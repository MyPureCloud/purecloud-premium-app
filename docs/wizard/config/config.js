export default {
    clientID: 'e7de8a75-62bb-43eb-9063-38509f8c21af',

    // 'wizardUriBase': 'http://localhost:8080/wizard/',
    wizardUriBase: 'https://mypurecloud.github.io/purecloud-premium-app/wizard/',

    // The actual URL of the landing page of your web app.
    // 'premiumAppURL': 'http://localhost:8080/premium-app-sample/index.html',
    premiumAppURL: 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/index.html',

    // Genesys Cloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    // NOTE: During initial development please use ‘premium-app-example’.
    //            Once your premium app is approved an integration type will be created
    //            by the Genesys Cloud product team and you can update the name at that time.
    appName: 'premium-app-example',

    // The minimum permission required for a user to access the Premium App.
    // NOTE: During initial development please use the default permission 
    //      'integration:examplePremiumApp:view'. Once your premium app is approved,
    //      the unique integration domain will be generated and this must be updated.
    viewPermission: 'integration:examplePremiumApp:view',

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    defaultPcEnvironment: 'mypurecloud.com',
    defaultLanguage: 'en-us',

    // The names of the query parameters to check in 
    // determining language and environment
    // Ex: www.electric-sheep-app.com?langTag=en-us&environment=mypurecloud.com
    languageQueryParam: 'langTag',
    genesysCloudEnvironmentQueryParam: 'environment',

    // Permissions required for running the Wizard App
    setupPermissionsRequired: ['admin'],

    // Enable the optional 'Step 2' in the porivisoning process
    // If false, it will not show the page or the step in the wizard
    enableCustomSetup: true,

    // To be added to names of Genesys Cloud objects created by the wizard
    prefix: 'PREMIUM_EXAMPLE_',

    // These are the Genesys Cloud items that will be added and provisioned by the wizard
    provisioningInfo: {
        'role': [
            {
                'name': 'Role',
                'description': 'Generated role for access to the app.',
                'permissionPolicies': [
                    {
                        'domain': 'integration',
                        'entityName': 'examplePremiumApp',
                        'actionSet': ['*'],
                        'allowConditions': false
                    }
                ]
            }
        ],
        'group': [
            {
                'name': 'Supervisors',
                'description': 'Supervisors have the ability to watch a queue for ACD conversations.',
            }
        ],
        'app-instance': [
            {
                'name': 'Partner Enablement Tools',
                'url': 'https://genesysappfoundry.github.io/partner-enablement-tools/index.html?language={{pcLangTag}}&environment={{pcEnvironment}}',
                'type': 'standalone',
                'groups': ['Supervisors']
            }
        ],
        'oauth-client': [
            {
                'name': 'OAuth Client',
                'description': 'Generated Client that\'s passed to the App Backend',
                'roles': ['Role'],
                'authorizedGrantType': 'CLIENT_CREDENTIALS',

                /**
                 * This function is for other processing that needs
                 * to be done after creating an object.
                 * 'finally' is available for all the other
                 * resources configured in this config file.
                 * NOTE: Finally functions must return a Promise.
                 * For Client Credentials, normally it means
                 * passing the details to the backend.
                 * @param {Object} installedData the Genesys Cloud resource created
                 * @returns {Promise}    
                 */
                'finally': function(installedData){
                    return new Promise((resolve, reject) => {
                        console.log('Fake Sending Credentials...');
                        setTimeout(() => resolve(), 2000);
                    });
                }
            }
        ]
    }
};
