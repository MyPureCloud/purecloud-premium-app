/*
*   NOTE: This sample uses ES6 features
*/
import appConfig from './config.js'
import hb from './template-references.js'
import { _renderModule, _renderCompletePage } from './handlebars-helper.js'

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
 * @todo codebase is too verbose now, might look into implementing proper MVC and different templating engine
 * @todo Change all members to static if more appropriate
 * @todo keep track of current main module(page) to check with inner modules before they're rendered
 * @todo keep track of current status with local storage to enable resuming
 * @todo Separate functions for assigning event handlers
 * @todo For load page methods, check the event to make sure that it was invoked legally.
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

                resolve()
            }); 
        });
    }

    /**
     * Configure PureCloud and install everything as defined from the 
     * stagingArea member. This should be the last step of the installation wizard.
     * @param {*} event 
     */
    installAppConfigurations(event){
        // Remove controls
        _renderModule(hb['blank'], this.stagingArea, 'wizard-content');
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

        this.stagingArea.roles.forEach((role) => {
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
                    console.log("created role");
                })
                .catch((err) => console.log(err))
            );
        });

        Promise.all(authPromises)
        .then(() => console.log("DONE"));

        /* TODO: Comment block temporarily disable creation of groups and app

        // Once groups are created store the names and the ids
        // object of (groupName: groupId) pairs
        let groupData = {};

        // Create the groups
        this.stagingArea.groups.forEach((group) => {
            let groupBody = {
                "name": this.prefix + group,
                "type": "official",
                "rulesVisible": true,
                "visibility": "members"
             }

            groupPromises.push(
                groupsApi.postGroups(groupBody)
                .then((data) => {
                    groupData[group] = data.id;
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
            console.log(groupData);

            this.stagingArea.appInstances.forEach((instance) => {
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
                    .then((data) => console.log(data))
                    .catch((err) => console.log(err))
                );
            });
            return Promise.all(integrationPromises);
        })
        .then(() => console.log("Finished setting up App instances")) */
    }

    /**
     * Loads the landing page of the app
     */
    loadLandingPage(event){
        this._pureCloudAuthenticate()
        .then(() => {
            this._test();
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
                    $('#btn-check-installation').off('click').click($.proxy(this.loadCheckInstallationStatus, this));
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
            $('#btn-start-wizard').off('click').click($.proxy(this.loadRolesCreation, this));
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
                $(btnId).off('click').click(
                    $.proxy(() => {
                    let groupsApi = new this.platformClient.GroupsApi();

                    groupsApi.deleteGroup(group.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                } ,this));
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
                $(btnId).off('click').click(
                    $.proxy(() => {
                    let authApi = new this.platformClient.AuthorizationApi();

                    authApi.deleteAuthorizationRole(role.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                } ,this));
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
                $(btnId).off('click').click(
                    $.proxy(() => {
                    let integrationsApi = new this.platformClient.IntegrationsApi();

                    integrationsApi.deleteIntegration(customApp.id)
                    .then((data) => this.loadCheckInstallationStatus())
                    .catch(() => console.log(err));
                } ,this));
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
            $('#btn-add-role').off('click').click($.proxy(() => {
                let roleName = $('#txt-role-name').val();
                let roleDescription = $('#txt-role-description').val();
                let tempRole = {
                    "name": roleName,
                    "description": roleDescription,
                    "permissions": [appConfig.premiumAppPermission],
                    "assignToSelf": true
                };
                this.stagingArea.roles.push(tempRole);

                _renderModule(hb['wizard-role-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            }, this));      

            // Next button to Apps Creation
            $('#btn-next').off('click').click($.proxy(this.loadRolesAssignment, this));

            // Back to check Installation
            $('#btn-prev').off('click').click($.proxy(this.loadCheckInstallationStatus, this));

            // Assign deletion for each role entry
            for(let i = 0; i < this.stagingArea.roles.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                $(btnId).off('click').click($.proxy(() => {
                    this.stagingArea.roles.splice(i, 1);
                    _renderModule(hb['wizard-role-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                } ,this));
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
            $('#btn-next').off('click').click(() => {
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
            $('#btn-prev').off('click').click($.proxy(this.loadRolesCreation, this));
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
            $('#btn-add-group').off('click').click($.proxy(() => {
                let tempGroup = {
                    "name": $('#txt-group-name').val(), 
                    "description": $('#txt-group-description').val(),
                    "assignToSelf": true
                }

                this.stagingArea.groups.push(tempGroup);

                _renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            }, this));      

            // Next button to Apps Creation
            $('#btn-next').off('click').click($.proxy(this.loadAppsCreation, this));

            // Back to check Installation
            $('#btn-prev').off('click').click($.proxy(this.loadRolesAssignment, this));

            // Assign deletion for each role entry
            for(let i = 0; i < this.stagingArea.groups.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                $(btnId).off('click').click($.proxy(() => {
                    this.stagingArea.groups.splice(i, 1);
                    _renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                } ,this));
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
        let assignEventHandler = function(){
            $('#add-instance').off('click').click($.proxy(() => {
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

                _renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            }, this));    
            
            // Clear form content            
            $('#clear-details').off('click').click($.proxy(() => {
                $('#txt-instance-name').val("");
                $('#txt-instance-uri').val("");
                $('#list-instance-groups').val("");
            }, this));    

            // Next button to Final Page
            $('#btn-next').off('click').click($.proxy(this.loadFinalizeInstallation, this));

            // Back to groups Installation
            $('#btn-prev').off('click').click($.proxy(this.loadGroupsCreation, this));

            // Assign deletion for each instance entry
            for(let i = 0; i < this.stagingArea.appInstances.length; i++){
                let btnId = '#btn-delete-' + (i).toString();
                $(btnId).off('click').click($.proxy(() => {
                    this.stagingArea.appInstances.splice(i, 1);
                    _renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content')
                    .then($.proxy(assignEventHandler, this));
                } ,this));
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
            $('#btn-prev').off('click').click($.proxy(this.loadAppsCreation, this));

            // Start installing yeah!!!
             // TODO: handle the possibility of rate limit being reached on the API calls
            $('#btn-install').off('click').click($.proxy(this.installAppConfigurations, this));
        });
    }

    /**
     * @description First thing that must be called to set-up the App
     */
    start(){
        this._setupClientApp();
        this.loadLandingPage();
    }


    // This is called immediately after PureCloud and App SDK authentication
    // For very quick and ugly tests
    // TODO: Delete someday
    _test(){

    }
}


export default WizardApp