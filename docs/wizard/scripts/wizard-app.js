/*
*   NOTE: This sample uses ES6 features
*/
import appConfig from './config.js'
import hb from './template-references.js'
import { _renderModule, _renderCompletePage } from './handlebars-helper.js'
import { setButtonClick, setValidateInput, setValidateURL } from './util.js'

// Requires jQuery and Handlebars from parent context
const $ = window.$;
const jQuery = window.jQuery;
const Handlebars = window.Handlebars;
if((typeof $ === 'undefined') || (typeof jQuery === 'undefined') || (typeof Handlebars === 'undefined')){
    console.error("===== PREMIUM APP ERROR ====== \n" +
                  "A required library is missing. \n" +
                  "==============================");   
}

/**
 * WizardApp class that handles everything in the App.
 * @todo keep track of current status with local storage to enable resuming
 * @todo Separate functions for assigning event handlers
 * @todo Determine app instance id of current app.
 */
class WizardApp {
    constructor(){
        // Reference to the PureCloud App (Client App SDK)
        this.pcApp = null;

        // PureCloud Javascript SDK clients
        this.platformClient = require('platformClient');
        this.purecloudClient = this.platformClient.ApiClient.instance;
        this.purecloudClient.setPersistSettings(true, 'premium_app');
        this.redirectUri = appConfig.redirectUri;

        // Permissions required for using the app 
        this.setupPermissionsRequired = appConfig.setupPermissionsRequired;

        // Prefix to add to all objects that will be added
        // (roles, groups, integrations, etc..)
        // as a result of this installation wizard
        this.prefix = appConfig.prefix;

        // JS object that will stage information about the installation.
        this.stagingArea = {
            groups: [],
            roles: [],
            appInstances: []
        };

        // Default order to prefill staging area
        this.defaultOrderFileName = appConfig.defaultOrderFileName;

        // User ID 
        this.userId = null;
    }

    /**
     * First thing that needs to be called to setup up the PureCloud Client App
     */
    _setupClientApp(){    
        // Backwards compatibility snippet from: https://github.com/MyPureCloud/client-app-sdk
        let envQueryParamName = 'pcEnvironment';
    
        if (window && window.location && typeof window.location.search === 'string' &&
            window.location.search.indexOf('pcEnvironment') >= 0) {
                this.pcApp = new window.purecloud.apps.ClientApp({pcEnvironmentQueryParam: envQueryParamName});
        } else {
            // Use default PureCloud region
            this.pcApp = new window.purecloud.apps.ClientApp();
        }
        console.log(this.pcApp.pcEnvironment);
    }

    /**
     * Authenticate to PureCloud (Implicit Grant)
     * @todo Assign default or notify user if can't determine purecloud environment
     */
    _pureCloudAuthenticate() {
        return new Promise((resolve, reject) => {
            // Authenticate through PureCloud
            this.purecloudClient.loginImplicitGrant(appConfig.clientIDs[this.pcApp.pcEnvironment], 
                                    this.redirectUri, 
                                    {state: ('pcEnvironment=' + this.pcApp.pcEnvironment)})
            
            // Check user permissions
            .then(data => {
                console.log(data);

                let usersApi = new this.platformClient.UsersApi();

                let opts = {'expand': ['authorization']};

                return usersApi.getUsersMe(opts); 
            }).then(userMe => {
                console.log(userMe);
                this.userId = userMe.id;

                // Show appropriate elements based on qualification of user permissions.
                if(!this.setupPermissionsRequired.every(perm => userMe.authorization.permissions.indexOf(perm) > -1)){
                    _renderModule('not-authorized');
                }else{
                    resolve();
                }
                
            // Error handler catch all
            }).catch(err => console.log(err));
        });
    }

    /**
     * Load the default installation order for the wizard
     * @param {string} fileName extensionless json filename  
     */
    _loadDefaultOrder(fileName){
        let fileUri = fileName + ".json";

        return new Promise((resolve, reject) => {
            $.getJSON(fileUri)
            .done(data => {
                this.stagingArea = data;
                this.stagingArea.fileName = fileUri;

                resolve()
            })
            .fail(xhr => {
                console.log('error', xhr)
                this.stagingArea = {
                    groups: [],
                    roles: [],
                    appInstances: []
                }

                resolve();
            }); 
        });
    }

    stageRole(name, description, permissions, assignToSelf){
        if((name === '') || (typeof name !== "string")) throw "Invalid role name.";

        let role = {
            "name": name,
            "description": description,
            "permissions": permissions,
            "assignToSelf": assignToSelf
        };

        this.stagingArea.roles.push(role);
    }

    unstageRole(roleIndex){
        this.stagingArea.roles.splice(roleIndex, 1);
    }


    /**
     * Loads the landing page of the app
     */
    loadLandingPage(event){
        this._pureCloudAuthenticate()
        .then(() => {
            let organizationApi = new this.platformClient.OrganizationApi();

            // Get organization information
            return organizationApi.getOrganizationsMe()
            .then(orgData => {
                let orgFeature = orgData.features;
    
                _renderCompletePage({
                        "title": "App Setup Wizard",
                        "subtitle": "Welcome! This Wizard will assist you in the installation, modification, or removal of the Premium App."
                    }, 
                    {
                        features: orgFeature,
                        startWizardFunction: this.loadRolesPage
                    },
                    hb['landing-page']
                )
                .then(() => {
                    setButtonClick(this, '#btn-check-installation', this.loadCheckInstallationStatus);
                });
            });
        });
        
    }

    /**
     * Load the page to check for existing PureCloud objects
     * @todo Reminder: Get roles and groups have max 25 after query. 
     *          Get integration has max 100 before manual filter.
     */
    loadCheckInstallationStatus(event){
        this._loadDefaultOrder(this.defaultOrderFileName)
        .then(() => 
        _renderCompletePage(
            {
                "title": "Checking Installation",
                "subtitle": "Check any existing PureCloud Objects that is set up by the App"
            }, 
            {
                objectPrefix: this.prefix
            },
            hb['check-installation']
        ))
        .then(() => {
            setButtonClick(this, '#btn-start-wizard', this.loadRolesCreation);
        });

        // PureCloud API instances
        let groupsApi = new this.platformClient.GroupsApi();
        let authApi = new this.platformClient.AuthorizationApi();
        let integrationApi = new this.platformClient.IntegrationsApi();

        // Query bodies
        var groupSearchBody = {
            "query": [
                {
                    "fields": ["name"],
                    "value": this.prefix,
                    "operator": "OR",
                    "type": "STARTS_WITH"
                }
            ]
        };

        var authOpts = { 
            'name': this.prefix + "*", // Wildcard to work like STARTS_WITH 
            'userCount': false
        };

        var integrationsOpts = {
            'pageSize': 100
        }
        
        // Check existing groups
        groupsApi.postGroupsSearch(groupSearchBody)
        .then(data => {
            let group = (typeof data.results !== 'undefined') ? data.results : [];
            let context = {
                panelHeading: 'Existing Groups (' + group.length + ')',
                objType: 'groups',
                pureCloudObjArr: group,
                icon: 'fa-users'
            }

            return _renderModule(hb['existing-objects'], context, 'results-group', group);
        })

        // Add delete button handlers
        // data is the groups from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((group) => {
                let btnId = '#btn-delete-' + group.id;
                setButtonClick(this, btnId, () => {
                    $('#modal-deleting').addClass('is-active');
                    let groupsApi = new this.platformClient.GroupsApi();

                    groupsApi.deleteGroup(group.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                });
            })
        })

        //Error handler
        .catch(err => console.log(err));

        // Check existing roles
        authApi.getAuthorizationRoles(authOpts)
        .then(data => {
            let roles = data.entities;
            let context = {
                panelHeading: 'Existing Roles (' + roles.length + ')',
                objType: 'roles',
                pureCloudObjArr: roles,
                icon: 'fa-briefcase'
            }

            return _renderModule(hb['existing-objects'], context, 'results-role', roles);
        })
        // Add delete button handlers
        // data is the roles from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((role) => {
                let btnId = '#btn-delete-' + role.id;
                setButtonClick(this, btnId, () => {
                    $('#modal-deleting').addClass('is-active');
                    let authApi = new this.platformClient.AuthorizationApi();

                    authApi.deleteAuthorizationRole(role.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                });
            })
        })
        .catch(err => console.log(err));

        // Check existing Integrations
        integrationApi.getIntegrations(integrationsOpts)
        .then(data => {
            let integrations = data.entities.filter(entity => entity.name.startsWith(this.prefix));
            let context = {
                panelHeading: 'Existing Integrations (' + integrations.length + ')',
                objType: 'integrations',
                pureCloudObjArr: integrations,
                icon: 'fa-cogs'
            }
            return _renderModule(hb['existing-objects'], context, 'results-integration', integrations);
        })

        // Add delete button handlers
        // data is the roles from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((customApp) => {
                let btnId = '#btn-delete-' + customApp.id;
                setButtonClick(this, btnId, () => {
                    $('#modal-deleting').addClass('is-active');
                    let integrationsApi = new this.platformClient.IntegrationsApi();

                    integrationsApi.deleteIntegration(customApp.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                });
            })
        })
        
        //Error handler
        .catch(err => console.log(err));
    }

    /**
     * Roles creation page
     * @param {*} event 
     */
    loadRolesCreation(event){
        let assignEventHandler = function(){
            // If add Role Button pressed then stage the role name 
            // from the form input
            setButtonClick(this, '#btn-add-role', () => {
                if ($('#txt-role-name').hasClass('is-danger')){
                    alert('Check your inputs.');
                    return;
                }

                let roleName = $('#txt-role-name').val().trim();
                let roleDescription = $('#txt-role-description').val().trim();
                let tempRole = {
                    "name": roleName,
                    "description": roleDescription,
                    "permissions": [appConfig.premiumAppPermission],
                    "assignToSelf": true
                };
                this.stagingArea.roles.push(tempRole);

                // Clear fields
                $('#txt-role-name').val('');
                $('#txt-role-description').val('');

                _renderModule(hb['wizard-role-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            });

            // Input validation for txt role name
            $('#txt-role-name').addClass('is-danger')
            setValidateInput('#txt-role-name');

            // Next button to Apps Creation
            setButtonClick(this, '#btn-next', this.loadRolesAssignment);

            // Back to check Installation
            setButtonClick(this, '#btn-prev', this.loadCheckInstallationStatus);

            // Assign deletion for each role entry
            for(let i = 0; i < this.stagingArea.roles.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                setButtonClick(this, btnId, () => {
                    this.stagingArea.roles.splice(i, 1);
                    _renderModule(hb['wizard-role-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                });
            }
        }

        _renderCompletePage(
            {
                title: "Create Roles",
                subtitle: "Roles are used to provide and determine access levels on the Premium App."
            },
            null, hb["wizard-page"]
        )

        // Render left guide bar
        // TODO: Change to Roles in template
        .then(() => _renderModule(hb['wizard-left'], {"highlight1": true}, 'wizard-left'))

        //Render contents of staging area
        .then(() => _renderModule(hb['wizard-role-content'], this.stagingArea, 'wizard-content'))

        //Render controls
        .then(() => _renderModule(hb['wizard-role-control'], {}, 'wizard-control'))

        // Event Handlers
        .then($.proxy(assignEventHandler, this));
    }

    /**
     * Page where user can choose which additional roles to assign to himself/herself
     * @param {*} event 
     */
    loadRolesAssignment(event){
        _renderCompletePage(
            {
                title: "Assign Roles",
                subtitle: "Assign roles to your current user."
            },
            null, hb["wizard-page"]
        )
        // Render left guide bar
        // TODO: Change to Roles in template
        .then(() => _renderModule(hb['wizard-left'], {"highlight1": true}, 'wizard-left'))

        //Render contents of staging area
        .then(() => _renderModule(hb['wizard-role-assign-content'], this.stagingArea, 'wizard-content'))

        //Render controls
        .then(() => _renderModule(hb['wizard-role-assign-control'], {}, 'wizard-control'))

        // Event Handlers
        .then(() => {
            // Take note of which roles to add to user after creation
            setButtonClick(this, '#btn-next', () => {
                for(let i = 0; i < this.stagingArea.roles.length; i++){
                    if($('#check-' + i.toString()).prop("checked") == true){
                        this.stagingArea.roles[i].assignToSelf = true;
                    } else {
                        this.stagingArea.roles[i].assignToSelf = false;
                    }
                }

                // Next button to Groups Creation
                $.proxy(this.loadGroupsCreation, this)();
            });

            // Back to Roles Creation
            setButtonClick(this, '#btn-prev', this.loadRolesCreation);
        });
    }

    /** 
     * Stage the groups to be created.
     * Thi is the First step of the installation wizard.
     * @param {object} event 
     */
    loadGroupsCreation(event){
        let assignEventHandler = function(){
            // If add Group Button pressed then stage the group name 
            // from the form input
            setButtonClick(this, '#btn-add-group', () => {
                if ($('#txt-group-name').hasClass('is-danger')){
                    alert('Check your inputs.');
                    return;
                }

                let tempGroup = {
                    "name": $('#txt-group-name').val().trim(), 
                    "description": $('#txt-group-description').val().trim(),
                    "assignToSelf": true
                }

                this.stagingArea.groups.push(tempGroup);

                $('#txt-group-name').val('');
                $('#txt-group-description').val('');

                _renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            })    

            // Next button to Apps Creation
            setButtonClick(this, '#btn-next', this.loadAppsCreation);

            // Back to check Installation
            setButtonClick(this, '#btn-prev', this.loadRolesAssignment);

            // Input validation for txt role name
            $('#txt-group-name').addClass('is-danger')
            setValidateInput('#txt-group-name');

            // Assign deletion for each role entry
            for(let i = 0; i < this.stagingArea.groups.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                setButtonClick(this, btnId, () => {
                    this.stagingArea.groups.splice(i, 1);
                    _renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                });
            }
        }

        _renderCompletePage(
            {
                title: "Create groups",
                subtitle: "Groups are required to filter which members will have access to specific instances of the App."
            },
            null, hb["wizard-page"]
        )

        // Render left guide bar
        .then(() => _renderModule(hb['wizard-left'], {"highlight2": true}, 'wizard-left'))
        
        //Render contents of staging area
        .then(() => _renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls
        .then(() => _renderModule(hb['wizard-group-control'], {}, 'wizard-control'))

        // TODO: Input Validation and Error Handling
        .then($.proxy(assignEventHandler, this));
    }

    /**
     * Creatino of App instances
     * @param {event} event 
     */
    loadAppsCreation(event){
        // Clear all form inputs
        function clearAll(){
            $('#txt-instance-name').val("");
            $('#txt-instance-uri').val("");
            $('#list-instance-groups').val("");
            $('#txt-instance-name').addClass('is-danger');
            $('#txt-instance-uri').addClass('is-danger');
        }

        // Integrations that have groups which are unstaged would have 
        // those groups automatically removed from their configuration
        this.stagingArea.appInstances.forEach((instance) =>
            instance.groups = instance.groups.filter((group) => 
                this.stagingArea.groups.map(g => g.name).includes(group))
        );

        // Assign Event Handlers
        let assignEventHandler = function(){
            clearAll();

            // Add Instance
            setButtonClick(this, '#add-instance', () => {
                if ($('#txt-instance-name').hasClass('is-danger') ||
                    $('#txt-instance-uri').hasClass('is-danger')){
                    alert('Check your inputs.');
                    return;
                }

                let instanceName = $('#txt-instance-name').val();
                let instanceType = $('input[name=instance-type]:checked', '#rad-instance-type').val();
                let instanceUri = $('#txt-instance-uri').val();
                let instanceGroups = $('#list-instance-groups').val();

                let instanceBody = {
                    "name": instanceName,
                    "url": instanceUri,
                    "type": instanceType,
                    "groups": instanceGroups
                }
                this.stagingArea.appInstances.push(instanceBody);

                clearAll();

                _renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            });
            
            setValidateInput('#txt-instance-name');
            setValidateURL('#txt-instance-uri');
            

            // Clear form content      
            setButtonClick(this, '#clear-details', clearAll);     

            // Next button to Final Page
            setButtonClick(this, '#btn-next', this.loadFinalizeInstallation);

            // Back to groups Installation
            setButtonClick(this, '#btn-prev', this.loadGroupsCreation);

            // Assign deletion for each instance entry
            for(let i = 0; i < this.stagingArea.appInstances.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                setButtonClick(this, btnId, () => {
                    this.stagingArea.appInstances.splice(i, 1);
                    _renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                });
            }
        }

        _renderCompletePage(
            {
                title: "Create App Instances",
                subtitle: "These is where you add instances of you app." +
                          "You could specify the landing page of each instance " +
                          "and the groups (must be created from the wizard) who " + 
                          "will have access to them."
            },
            null, hb["wizard-page"]
        )

        // Render left guide bar
        .then(() => _renderModule(hb['wizard-left'], {"highlight3": true}, 'wizard-left'))
        
        //Render contents of staging area
        .then(() => _renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls 
        .then(() => _renderModule(hb['wizard-instance-control'], this.stagingArea, 'wizard-control'))

        // Assign Event Handlers
        .then($.proxy(assignEventHandler, this));
    }

    /**
     * Installation page
     * @param {event} event
     * @todo Move actual PureCloud configuration and installation to separate method 
     */
    loadFinalizeInstallation(event){
        _renderCompletePage(
            {
                title: "Finalize",
                subtitle: "Please review the items below and press Install to " + 
                          "install the apps and configuration."
            },
            null, hb["wizard-page"]
        )
         // Render left guide bar
         .then(() => _renderModule(hb['wizard-left'], {"highlight4": true}, 'wizard-left'))

         //Render contents of staging area
        .then(() => _renderModule(hb['wizard-final-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls 
        .then(() => _renderModule(hb['wizard-final-control'], this.stagingArea, 'wizard-control'))  
        
        // Assign Event Handlers
        .then(() => {
            // Back to groups Installation
            setButtonClick(this, '#btn-prev', this.loadAppsCreation);

            // Start installing yeah!!!
             // TODO: handle the possibility of rate limit being reached on the API calls
            setButtonClick(this, '#btn-install', this.installAppConfigurations);
        });
    }


    /**
     * Configure PureCloud and install everything as defined from the 
     * stagingArea member. This should be the last step of the installation wizard.
     * @param {*} event 
     */
    installAppConfigurations(event){
        let logInfo = (info) => {
            console.log(info);
            $("#install-log")
            .append("<p class='has-text-grey is-marginless'><em>" +
                        info + "</em></p>");
        }


        // Remove controls
        _renderModule(hb['wizard-installing'], this.stagingArea, 'wizard-content')
        _renderModule(hb['blank'], this.stagingArea, 'wizard-control');

        // Api instances
        let groupsApi = new this.platformClient.GroupsApi();
        let authApi = new this.platformClient.AuthorizationApi();
        let integrationsApi = new this.platformClient.IntegrationsApi();

        // Keep the promises of the creation calls
        // This will be used to keep track once a particular batch resolves
        let groupPromises = [];
        let authPromises = [];
        let integrationPromises = [];

        // Once groups are created store the names and the ids
        // object of (groupName: groupId) pairs
        let groupData = {};


        // Create the roles
        this.stagingArea.roles.forEach((role) => {
            logInfo("Creating role: " + role.name);

            // Add the premium app permission if not included in staging area
            if(!role.permissions.includes(appConfig.premiumAppPermission))
                role.permissions.push(appConfig.premiumAppPermission);

            let roleBody = {
                    "name": this.prefix + role.name,
                    "description": "",
                    "permissions": role.permissions
            };

            authPromises.push(
                authApi.postAuthorizationRoles(roleBody)
                .then((data) => {
                    logInfo("Created role: " + role.name);

                    if(role.assignToSelf){
                        return authApi.putAuthorizationRoleUsersAdd(data.id, [this.userId]);
                    }else{
                        resolve();
                    }
                })
                .then((data) => {
                    logInfo("Assigned " + role.name + " to user");
                })
                .catch((err) => console.log(err))
            );
        });

        // Create the groups
        Promise.all(authPromises)
        .then(() => {
            this.stagingArea.groups.forEach((group) => {
                logInfo("Creating group: " + group.name);

                let groupBody = {
                    "name": this.prefix + group.name,
                    "description": group.description,
                    "type": "official",
                    "rulesVisible": true,
                    "visibility": "members"
                 }
    
                groupPromises.push(
                    groupsApi.postGroups(groupBody)
                    .then((data) => {
                        logInfo("Created group: " + group.name);
                        groupData[group.name] = data.id;
                    })
                    .catch((err) => console.log(err))
                );
            });

            // After groups are created, create instances
            // There are two steps for creating the app instances
            // 1. Create instance of a custom-client-app
            // 2. Configure the app
            Promise.all(groupPromises)
            .then(() => {
                this.stagingArea.appInstances.forEach((instance) => {
                    logInfo("Creating instance: " + instance.name);

                    let integrationBody = {
                        "body": {
                            "integrationType": {
                                "id": "embedded-client-app"
                            }
                        }
                    }

                    integrationPromises.push(
                        integrationsApi.postIntegrations(integrationBody)
                        .then((data) => {
                            logInfo("Configuring instance: " + instance.name);
                            let integrationConfig = {
                                "body": {
                                    "name": this.prefix + instance.name,
                                    "version": 1, 
                                    "properties": {
                                        "url" : instance.url,
                                        "sandbox" : "allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts",
                                        "displayType": instance.type,
                                        "featureCategory": "", 
                                        "groups": instance.groups.map((groupName) => groupData[groupName])
                                    },
                                    "advanced": {},
                                    "notes": "",
                                    "credentials": {}
                                }
                            }

                            return integrationsApi.putIntegrationConfigCurrent(data.id, integrationConfig)
                        })
                        .then((data) => logInfo("Configured instance: " + data.name))
                        .catch((err) => console.log(err))
                    );
                });
                return Promise.all(integrationPromises);
            })
            .then(() => logInfo("<strong>Installation Complete!</strong>"));
        });
    }


    /**
     * @description First thing that must be called to set-up the App
     */
    start(){
        this._setupClientApp();
        this.loadLandingPage();
    }
}


export default WizardApp