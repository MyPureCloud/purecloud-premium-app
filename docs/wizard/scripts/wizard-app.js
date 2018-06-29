/*
*   NOTE: This sample uses ES6 features
*/
import clientIDs from '../clientIDs.js'
import hb from './template-references.js'

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
 * @todo Change all members to static if more appropriate
 * @todo keep track of current main module(page) to check with inner modules before they're rendered
 * @todo keep track of current status with local storage to enable resuming
 * @todo move  Handlebar renderer functions to separate module.
 * @todo Roles Creation
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
        //this.redirectUri = "https://localhost/wizard/index.html";
        this.redirectUri = "https://princemerluza.github.io/purecloud-premium-app/wizard/index.html";

        // Permissions required for using the app 
        // TODO: store permissions on a separate file
        this.setupPermissionsRequired = ['admin'];

        // Prefix to add to all objects that will be added
        // (roles, groups, integrations, etc..)
        // as a result of this installatino wizard
        this.prefix = '1111';

        // JS object that will stage information about the installation.
        this.stagingArea = {
            groups: [],
            roles: [],
            appInstances: []
        };

        // Default order to prefill staging area
        this.defaultOrderFileName = 'sample-order';
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
            this.purecloudClient.loginImplicitGrant(clientIDs[this.pcApp.pcEnvironment], 
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
                    this._renderModule('not-authorized');
                }else{
                    resolve();
                }
                
            // Error handler catch all
            }).catch(err => console.log(err));
        });
    }

    /**
     * Render the Handlebars template to the window
     * @param {string} page     contains filename of handlebars file
     * @param {object} context  context oject
     * @param {string} target   ID of element HTML where rendered module will be placed
     * @param {*}  resolveData  Optional data to pass for resolve of the promise
     * @returns Promise
     */
    _renderModule(page, context, target, resolveData) {
        context = (typeof context !== 'undefined') ? context : {}; 
        target = (typeof target !== 'undefined') ? target : 'default-module'; 

        let templateUri = 'templates/' + page + '.handlebars';
        let templateSource;
        let template;

        return new Promise((resolve, reject) => {
            // Async get the desired template file
            $.ajax({
                url: templateUri,
                cache: true
            })
            .done(data => {
                // Compile Handlebars template 
                templateSource = data;
                template = Handlebars.compile(templateSource);

                // Render html and display to the target element
                let renderedHtml = template(context);
                $('#' + target).html(renderedHtml);

                resolve(resolveData);
            })
            .fail(xhr => {
                console.log('error', xhr);
                reject(xhr);
            });
        });
    }

    /**
     * Render a complete page with header and body
     * @param {Object} headerContext    contains title and subtitle for header
     * @param {Object} bodyContext      context for the body
     * @param {string} bodyTemplate     filename of template for the body section
     */
    _renderCompletePage(headerContext, bodyContext, bodyTemplate){
        // Default values
        headerContext = (typeof headerContext !== 'undefined') ? headerContext : {};
        bodyContext = (typeof bodyContext !== 'undefined') ? bodyContext : {};

        return new Promise((resolve, reject) => {
            this._renderModule(hb['root'])
            .then(() => this._renderModule(hb['header'], headerContext, 'root-header'))
            .then(() => this._renderModule(bodyTemplate, bodyContext, 'root-body'))
            .then(() => resolve())
        })
        
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
        this._renderModule(hb['blank'], this.stagingArea, 'wizard-content');
        this._renderModule(hb['blank'], this.stagingArea, 'wizard-control');

        // Api instances
        let groupsApi = new this.platformClient.GroupsApi();
        let authApi = new this.platformClient.AuthorizationApi();
        let integrationsApi = new this.platformClient.IntegrationsApi();

        // Keep the promises of the creation calls
        // This will be used to keep track once a particular batch resolves
        let groupPromises = [];
        let integrationPromises = [];

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
        .then(() => console.log("Finished setting up App instances"))
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
    
                this._renderCompletePage(
                    {
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
                    $('#btn-check-installation').click($.proxy(this.loadCheckInstallationStatus, this));
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
        this._renderCompletePage(
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
            $('#btn-start-wizard').click($.proxy(this.loadGroupsCreation, this));
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

            return this._renderModule(hb['existing-objects'], context, 'results-group', group);
        })

        // Add delete button handlers
        // data is the groups from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((group) => {
                let btnId = '#btn-delete-' + group.id;
                $(btnId).click(
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

            return this._renderModule(hb['existing-objects'], context, 'results-role', roles);
        })
        // Add delete button handlers
        // data is the roles from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((role) => {
                let btnId = '#btn-delete-' + role.id;
                $(btnId).click(
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
            return this._renderModule(hb['existing-objects'], context, 'results-integration', integrations);
        })

        // Add delete button handlers
        // data is the roles from PureCloud
        .then((data) => {
            data = data || [];
            data.forEach((customApp) => {
                let btnId = '#btn-delete-' + customApp.id;
                $(btnId).click(
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
     * Stage the groups to be created.
     * Thi is the First step of the installation wizard.
     * @param {object} event 
     */
    loadGroupsCreation(event){
        this._renderCompletePage(
            {
                title: "Create groups",
                subtitle: "Groups are required to filter which members will have access to specific instances of the App."
            },
            null, hb["wizard-page"]
        )

        // Render left guide bar
        .then(() => this._renderModule(hb['wizard-left'], {"highlight1": true}, 'wizard-left'))
        
        //Render contents of staging area
        .then(() => this._renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls
        .then(() => this._renderModule(hb['wizard-group-control'], {}, 'wizard-control'))

        // TODO: Input Validation and Error Handling
        .then(() => {
            // If add Group Button pressed then stage the group name 
            // from the form input
            $('#btn-add-group').click($.proxy(() => {
                let groupName = $('#txt-group-name').val();
                this.stagingArea.groups.push(groupName);

                this._renderModule(hb['wizard-group-content'], this.stagingArea, 'wizard-content')
            }, this));      

            // Next button to Apps Creation
            $('#btn-next').click($.proxy(this.loadAppsCreation, this));

            // Back to check Installation
            $('#btn-prev').click($.proxy(this.loadCheckInstallationStatus, this));
        });
    }

    /**
     * Creatino of App instances
     * @param {event} event 
     */
    loadAppsCreation(event){
        this._renderCompletePage(
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
        .then(() => this._renderModule(hb['wizard-left'], {"highlight2": true}, 'wizard-left'))
        
        //Render contents of staging area
        .then(() => this._renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls 
        .then(() => this._renderModule(hb['wizard-instance-control'], this.stagingArea, 'wizard-control'))

        // Assign Event Handlers
        .then(() => {
            $('#add-instance').click($.proxy(() => {
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

                this._renderModule(hb['wizard-instance-content'], this.stagingArea, 'wizard-content')
            }, this));    
            
            // Clear form content            
            $('#clear-details').click($.proxy(() => {
                $('#txt-instance-name').val("");
                $('#txt-instance-uri').val("");
                $('#list-instance-groups').val("");
            }, this));    

            // Next button to Final Page
            $('#btn-next').click($.proxy(this.loadFinalizeInstallation, this));

            // Back to groups Installation
            $('#btn-prev').click($.proxy(this.loadGroupsCreation, this));
        });
    }

    /**
     * Installation page
     * @param {event} event
     * @todo Move actual PureCloud configuration and installation to separate method 
     */
    loadFinalizeInstallation(event){
        this._renderCompletePage(
            {
                title: "Finalize",
                subtitle: "Please review the items below and press Install to " + 
                          "install the apps and configuration."
            },
            null, hb["wizard-page"]
        )
         // Render left guide bar
         .then(() => this._renderModule(hb['wizard-left'], {"highlight3": true}, 'wizard-left'))

         //Render contents of staging area
        .then(() => this._renderModule(hb['wizard-final-content'], this.stagingArea, 'wizard-content'))
        
        //Render controls 
        .then(() => this._renderModule(hb['wizard-final-control'], this.stagingArea, 'wizard-control'))  
        
        // Assign Event Handlers
        .then(() => {
            // Back to groups Installation
            $('#btn-prev').click($.proxy(this.loadAppsCreation, this));

            // Start installing yeah!!!
             // TODO: handle the possibility of rate limit being reached on the API calls
            $('#btn-install').click($.proxy(this.installAppConfigurations, this));
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