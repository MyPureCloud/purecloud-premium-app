/*
*   NOTE: This sample uses ES6 features
*/
import appConfig from './config.js'

const $ = window.$;
const jQuery = window.jQuery;

/**
 * WizardApp class that handles everything in the App.
 * @todo Make app persistent by using localStorage
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

        // Language default is english
        // Language context is object containing the translations
        this.language = 'en-us';

        // PureCloud app name
        this.appName = "premium-app-example"

        this.prefix = appConfig.prefix;
        this.installationData = {
            "roles": [
                {
                    "name": "Role",
                    "description": "Generated role for access to the app.",
                    "permissionPolicies": [
                        {
                            "domain": "integration",
                            "entityName": "examplePremiumApp",
                            "actionSet": ["*"],
                            "allowConditions": false
                        }
                    ]
                }
            ],
            "groups": [
                {
                    "name": "Agents",
                    "description": "Agents have access to a widget that gives US state information based on caller's number.",
                },
                {
                    "name": "Supervisors",
                    "description": "Supervisors have the ability to watch a queue for ACD conversations.",
                }
            ],
            "appInstances": [
                {
                    "name": "Agent Widget",
                    "url": "https://mypurecloud.github.io/purecloud-premium-app/index.html?lang={{pcLangTag}}&environment={{pcEnvironment}}",
                    "type": "widget",
                    "groups": ["Agents", "Supervisors"]
                }
            ]
        }
    }

    /**
     * First thing that needs to be called to setup up the PureCloud Client App
     */
    _setupClientApp(){    
        // Snippet from URLInterpolation example: 
        // https://github.com/MyPureCloud/client-app-sdk
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        let pcEnv = null;   
        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if(currParam[0] === 'langTag') {
                this.language = currParam[1];
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
                this.displayPageText(data);
                resolve();
            })
            .fail(xhr => {
                console.log('Language file not found.');
            }); 
        });
    }

    /**
     * Authenticate to PureCloud (Implicit Grant)
     * @return {Promise}
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
                resolve();
            // Error handler catch all
            }).catch(err => console.log(err));
        });
    }

    /**
     * Renders the proper text language into the web pages
     * @param {Object} text  Contains the keys and values from the language file
     */
    displayPageText(text){
        $(document).ready(() => {
            for (let key in text){
                if(!text.hasOwnProperty(key)) continue;
                $("." + key).text(text[key]);
            }
        });
    }

    /**
     * Get details of the current user
     * @return {Promise}
     */
    getUserDetails(){
        let usersApi = new this.platformClient.UsersApi();
        let opts = {'expand': ['authorization']};
    
        return usersApi.getUsersMe(opts)
    }

    /**
     * Checks if the product is available in the current Purecloud org.
     * @return {Promise}
     */
    validateProductAvailability(){
        // premium-app-example
        return new Promise((resolve, reject) => {
            let integrationsApi = new this.platformClient.IntegrationsApi();
            
            integrationsApi.getIntegrationsTypes({})
            .then((data) => {
                if (data.entities.filter((integType) => integType.id === this.appName)[0]){
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
        });
    }

    /**
     * Checks if any configured objects are still existing. This is based of the prefix
     * @returns {Promise} 
     */
    isExisting(){
        return new Promise((resolve, reject) => {
            let promiseArr = []; 
            
            promiseArr.push(
                this.getExistingGroups()
                .then((data) => {
                    if(data.total > 0) reject({"isExisting": true});
            }));
            
            promiseArr.push(
                this.getExistingRoles()
                .then((data) => {
                    if(data.total > 0) reject({"isExisting": true});
            }));

            promiseArr.push(
                this.getExistingApps()
                .then((data) => {
                    if (data.length > 0) reject({"isExisting": true});
            }));

            return Promise.all(promiseArr)
            .then(() => resolve())
        })
    }

    /**
     * Delete all existing Premium App PC objects
     * @returns {Promise}
     */
    clearConfigurations(){
        let configArr = [];

        // Delete groups
        configArr.push(
            this.getExistingGroups()
            .then(groups => {
                let del_group = [];

                if(groups.total > 0){
                    groups.results.map(grp => grp.id).forEach(x => {
                        del_group.push(this.deletePureCloudGroup(x));
                    });
                }

                return Promise.all(del_group);
            })
        )

        // Delete Roles
        configArr.push(
            this.getExistingRoles()
            .then(roles => {
                let del_role = [];

                if(roles.total > 0){
                    roles.entities.map(r => r.id).forEach(x => {
                        del_role.push(this.deletePureCloudRole(x));
                    });
                }
                
                return Promise.all(del_role);
            })
        )

        // Delete instances
        configArr.push(
            this.getExistingApps()
            .then(apps => {
                let del_app = [];

                if (apps.total > 0){
                    // Filter results before deleting
                    apps.map(entity => entity.id)
                        .forEach(x => {
                            del_app.push(this.deletePureCloudApp(x));
                    });
                }

                return Promise.all(del_app);
            })
        )

        return Promise.all(configArr);
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
        
        return new Promise((resolve, reject) => {
            integrationApi.getIntegrations(integrationsOpts)
            .then((data) => {
                resolve(data.entities
                    .filter(entity => entity.name
                        .startsWith(this.prefix)));
            })
        });
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
            this.installationData.roles.forEach((role) => {
                let roleBody = {
                        "name": this.prefix + role.name,
                        "description": "",
                        "permissionPolicies": role.permissionPolicies
                };

                // Assign role to user
                let roleId = null;
                authPromises.push(
                    authApi.postAuthorizationRoles(roleBody)
                    .then((data) => {
                        this.logInfo("Created role: " + role.name);
                        roleId = data.id;

                        return this.getUserDetails();
                    })
                    .then((data) => {
                        return authApi.putAuthorizationRoleUsersAdd(roleId, [data.id]);
                    })
                    .then((data) => {
                        this.logInfo("Assigned " + role.name + " to user");
                    })
                    .catch((err) => console.log(err))
                );
            });

            // Create the groups
            Promise.all(authPromises)
            .then(() => {
                this.installationData.groups.forEach((group) => {
                    let groupBody = {
                        "name": this.prefix + group.name + "_",
                        "description": group.description,
                        "type": "official",
                        "rulesVisible": true,
                        "visibility": "members"
                    }
                    console.log(groupBody);
                    groupPromises.push(
                        groupsApi.postGroups(groupBody)
                        .then((data) => {
                            this.logInfo("Created group: " + group.name);
                            groupData[group.name] = data.id;
                        })
                        .catch((err) => console.log(err))
                    );
                })

                
                return Promise.all(groupPromises);
            })
            
            // After groups are created, create instances
            // There are two steps for creating the app instances
            // 1. Create instance of a custom-client-app
            // 2. Configure the app
            // 3. Activate the instances
            .then(() => {
                this.installationData.appInstances.forEach((instance) => {
                    let integrationBody = {
                        "body": {
                            "integrationType": {
                                "id": this.appName
                            }
                        }
                    }

                    integrationPromises.push(
                        integrationsApi.postIntegrations(integrationBody)
                        .then((data) => {
                            this.logInfo("Created instance: " + instance.name);
                            let integrationConfig = {
                                "body": {
                                    "name": this.prefix + instance.name,
                                    "version": 1, 
                                    "properties": {
                                        "url" : instance.url,
                                        "sandbox" : "allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts",
                                        "displayType": instance.type,
                                        "featureCategory": "", 
                                        "groupFilter": instance.groups.map((groupName) => groupData[groupName])
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
                            this.logInfo("Configured instance: " + data.name);                           
                        })
                        .catch((err) => console.log(err))
                    );
                });
                return Promise.all(integrationPromises);
            })

            // Activate the newly created application instances
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
                        .then((data) => this.logInfo("Enabled instance: " + data.name))
                        .catch((err) => console.log(err))
                    );
                });
                
                return Promise.all(enablePromises);
            })

            // When everything's finished, log the output.
            .then(() => {
                this.logInfo("Installation Complete!");
                resolve();
            })
        });
    }

    logInfo(data){
        if (!data || (typeof(data) !== 'string')) data = "";

        $.LoadingOverlay("text", data);
        //$.LoadingOverlay("progress", progress * 11)
    }

    /**
     * @description First thing that must be called to set-up the App
     */
    start(){
        return new Promise((resolve, reject) => {
            this._setupClientApp()
            .then(() => this._pureCloudAuthenticate())
            .then(() => resolve())
            .catch(() => reject())
        });
    }
}


export default WizardApp