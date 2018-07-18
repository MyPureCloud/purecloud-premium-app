/*
*   NOTE: This sample uses ES6 features
*/
import appConfig from './config.js'
import hb from './template-references.js'
import PageManager from './page-manager.js'

// Requires jQuery and Handlebars from parent context
const $ = window.$;
const jQuery = window.jQuery;
const Handlebars = window.Handlebars;
if((typeof $ === 'undefined') || (typeof jQuery === 'undefined') || 
   (typeof Handlebars === 'undefined')){
    console.error("===== PREMIUM APP ERROR ====== \n" +
                  "A required library is missing. \n" +
                  "==============================");   
}

/**
 * WizardApp class that handles everything in the App.
 * @todo keep track of current status with local storage to enable resuming
 * @todo Separate functions for assigning event handlers
 * @todo Determine app instance id of current app.
 * @todo Maybe implement middleware between pages and App. RN Pages are directly invoking methods
 *       and accessing stagearea property.
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

        // Default permission to add to new roles
        this.premiumAppPermission = appConfig.premiumAppPermission;

        // Prefix to add to all objects that will be added
        // (roles, groups, integrations, etc..)
        // as a result of this installation wizard
        this.prefix = appConfig.prefix;

        // Language default is english
        // Language context is object containing the translations
        this.language = 'en-us';
        this.languageContext = null

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

        // Asign to class so pages could call it
        this.pageManager = new PageManager(this);
    }

    /**
     * First thing that needs to be called to setup up the PureCloud Client App
     * @param {String} forceLang fallback language if translation file does not exist 
     * @returns {Promise} Due to AJAX call of language file
     */
    _setupClientApp(forceLang){    
        this.language = forceLang;

        // Snippet from URLInterpolation example: 
        // https://github.com/MyPureCloud/client-app-sdk
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        let pcEnv = null;   
        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if(currParam[0] === 'langTag') {
                if(!forceLang) this.language = currParam[1];
            } else if(currParam[0] === 'pcEnvironment') {
                pcEnv = currParam[1];
            } else if(currParam[0] === 'environment' && pcEnv === null) {
                pcEnv = currParam[1];
            }
        }

        if(pcEnv){
            this.pcApp = new window.purecloud.apps.ClientApp({pcEnvironment: pcEnv});
        }else{
            // Use default PureCloud region
            this.pcApp = new window.purecloud.apps.ClientApp();
        }
        
        console.log(this.pcApp.pcEnvironment);

        // Get the language context file and assign it to the app
        return new Promise((resolve, reject) => {
            let fileUri = './languages/' + this.language + '.json';
            $.getJSON(fileUri)
            .done(data => {
                this.languageContext = data;
                resolve()
            })
            .fail(xhr => {
                console.log('Language file not found. Defaulting to en-us');
                this._setupClientApp('en-us');
            }); 
        });
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

    /**
     * Gets the org info
     */
    getOrgInfo(){
        let organizationApi = new this.platformClient.OrganizationApi();

        // Get organization information
        return organizationApi.getOrganizationsMe()
    }

    /**
     * Gets the existing groups on PureCloud based on Prefix
     */
    getExistingGroups(){
        // PureCloud API instances
        const groupsApi = new this.platformClient.GroupsApi();

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

        return groupsApi.postGroupsSearch(groupSearchBody);
    }

    /**
     * Delete Group from PureCloud org
     * @param {String} groupId 
     */
    deletePureCloudGroup(groupId){
        let groupsApi = new this.platformClient.GroupsApi();

        return groupsApi.deleteGroup(groupId);
    }

    /**
     * Get existing roles in purecloud based on prefix
     * @todo Get role based on permission. NOTE: if permission is on permissionPolicy instead of General,
     *       PureCloud don't have API to easily search using it.
     */
    getExistingRoles(){
        const authApi = new this.platformClient.AuthorizationApi();

        let authOpts = { 
            'name': this.prefix + "*", // Wildcard to work like STARTS_WITH 
            'userCount': false
        };

        return authApi.getAuthorizationRoles(authOpts);
    }

    /**
     * Delete the specified role
     * @param {String} roleId 
     */
    deletePureCloudRole(roleId){
        let authApi = new this.platformClient.AuthorizationApi();

        return authApi.deleteAuthorizationRole(roleId)
    }

    /**
     * Get existing apps based on the prefix
     * @todo Get instances of a particular type of app.
     */
    getExistingApps(){
        const integrationApi = new this.platformClient.IntegrationsApi();
        let integrationsOpts = {
            'pageSize': 100
        }
        return integrationApi.getIntegrations(integrationsOpts);
    }

    /**
     * Delete a PureCLoud instance
     * @param {String} instanceId 
     */
    deletePureCloudApp(instanceId){
        let integrationsApi = new this.platformClient.IntegrationsApi();

        return integrationsApi.deleteIntegration(instanceId)
    }

    /**
     * Stage a role
     * @param {String} name 
     * @param {String} description 
     * @param {StringArray} permissions 
     * @param {Boolean} assignToSelf 
     */
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

    /**
     * Assign or unassign a staged role to the user after installation
     * @param {integer} roleIndex 
     * @param {boolean} toAssign 
     */
    setStagedRoleAssignment(roleIndex, toAssign){
        this.stagingArea.roles[roleIndex].assignToSelf = toAssign;
    }

    /**
     * Unstages a role
     * @param {integer} roleIndex Index in stagingArea.roles array
     */
    unstageRole(roleIndex){
        this.stagingArea.roles.splice(roleIndex, 1);
    }

    /**
     * Stage group
     * @param {String} name 
     * @param {String} description 
     * @param {Boolean} asignToSelf 
     */
    stageGroup(name, description, asignToSelf){
        let tempGroup = {
            "name": name, 
            "description": description,
            "assignToSelf": asignToSelf
        }
        this.stagingArea.groups.push(tempGroup);
    }

    /**
     * Unstage a group
     * @param {Integer} groupIndex 
     */
    unstageGroup(groupIndex){
        this.stagingArea.groups.splice(groupIndex, 1);
    }

    /**
     * Stage App instance
     * @param {String} name 
     * @param {String} type Either standalone or widget
     * @param {String} url  
     * @param {StringArray} groups
     */
    stageInstance(name, type, url, groups){
        let instanceBody = {
            "name": name,
            "url": url,
            "type": type,
            "groups": groups
        }
        this.stagingArea.appInstances.push(instanceBody);
    }

    /**
     * Unstage App Instance
     * @param {Integer} instanceIndex 
     */
    unstageInstance(instanceIndex){
        this.stagingArea.appInstances.splice(instanceIndex, 1);
    }

    /**
     * Fix Staged instances that have groups which are unstaged after app is already configured. 
     * Have those groups automatically removed from the instance configuration.
     * Called when loading the App Instance page
     */
    reevaluateStagedInstances(){
        this.stagingArea.appInstances.forEach((instance) =>
        instance.groups = instance.groups.filter((group) => 
            this.stagingArea.groups.map(g => g.name).includes(group))
        );
    }

    /**
     * Final Step of the installation wizard. Actually install every staged object.
     */
    installConfigurations(){
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

        // Get info from created integrations
        let integrationsData = [];

        return new Promise((resolve,reject) => { 
            // Create the roles
            this.stagingArea.roles.forEach((role) => {
                this.pageManager.logInfo("Creating role: " + role.name);

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
                        this.pageManager.logInfo("Created role: " + role.name);

                        if(role.assignToSelf){
                            return authApi.putAuthorizationRoleUsersAdd(data.id, [this.userId]);
                        }else{
                            resolve();
                        }
                    })
                    .then((data) => {
                        this.pageManager.logInfo("Assigned " + role.name + " to user");
                    })
                    .catch((err) => console.log(err))
                );
            });

            // Create the groups
            Promise.all(authPromises)
            .then(() => {
                this.stagingArea.groups.forEach((group) => {
                    this.pageManager.logInfo("Creating group: " + group.name);

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
                            this.pageManager.logInfo("Created group: " + group.name);
                            groupData[group.name] = data.id;
                        })
                        .catch((err) => console.log(err))
                    );
                });

                // After groups are created, create instances
                // There are two steps for creating the app instances
                // 1. Create instance of a custom-client-app
                // 2. Configure the app
                // 3. Activate the instances
                Promise.all(groupPromises)
                .then(() => {
                    this.stagingArea.appInstances.forEach((instance) => {
                        this.pageManager.logInfo("Creating instance: " + instance.name);

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
                                this.pageManager.logInfo("Configuring instance: " + instance.name);
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

                                integrationsData.push(data);
                                return integrationsApi.putIntegrationConfigCurrent(data.id, integrationConfig)
                            })
                            .then((data) => {
                                this.pageManager.logInfo("Configured instance: " + data.name);                           
                            })
                            .catch((err) => console.log(err))
                        );
                    });
                    return Promise.all(integrationPromises);
                })
                .then(() => {
                    let enablePromises = [];
                    integrationsData.forEach((instance) => {
                        let opts = {
                            "body": {
                                "intendedState": "ENABLED"
                            }
                         }

                        enablePromises.push(
                            integrationsApi.patchIntegration(instance.id, opts)
                            .then((data) => this.pageManager.logInfo("Enabled instance: " + data.name))
                            .catch((err) => console.log(err))
                        );
                    });
                    
                    return Promise.all(enablePromises);
                })
                .then(() => {
                    this.pageManager.logInfo("<strong>Installation Complete!</strong>");
                    resolve();
                })
            });
        });
    }

    /**
     * @description First thing that must be called to set-up the App
     */
    start(){
        this._setupClientApp()
        .then(this.pageManager.setPage("landingPage"));
    }
}


export default WizardApp