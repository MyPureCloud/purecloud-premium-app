export default {
    clientIDs: {        
        'mypurecloud.com': 'e7de8a75-62bb-43eb-9063-38509f8c21af',
        'mypurecloud.ie': '939ab4dd-109f-4120-ba9f-051b973b9ecc',
        'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
        'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71'
    },
    'redirectUriBase': 'http://localhost:8080/',
    //'redirectUriBase': 'https://mypurecloud.github.io/purecloud-premium-app/',

    // The actual URL of the landing page of your web app.
    'premiumAppURL': 'http://localhost:8080/premium-app-sample/',
    //'premiumAppURL': 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/',

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    'appName': 'premium-app-example',

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    'defaultPcEnvironment': 'mypurecloud.com',
    'defaultLanguage': 'en-us',

    // The names of the query parameters to check in 
    // determining language and environment
    // Ex: www.electric-sheep-app.com?language=en-us&environment=mypurecloud.com
    'languageQueryParam': 'language',
    'pureCloudEnvironmentQueryParam': 'environment',

    // Permissions required for running the Wizard App
    'setupPermissionsRequired': ['admin'],

    // To be added to names of PureCloud objects created by the wizard
    'prefix': 'PREMIUM_EXAMPLE_2_',

    // These are the PureCloud items that will be added and provisioned by the wizard
    'provisioningInfo': {
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
                'name': 'Agents',
                'description': 'Agents have access to a widget that gives US state information based on caller\'s number.',
            },
            {
                'name': 'Supervisors',
                'description': 'Supervisors have the ability to watch a queue for ACD conversations.',
            }
        ],
        'app-instance': [
            {
                'name': 'Agent Widget',
                'url': 'https://mypurecloud.github.io/purecloud-premium-app/index.html?lang={{pcLangTag}}&environment={{pcEnvironment}}',
                'type': 'widget',
                'groups': ['Agents']
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
                 * resources configured in this file.
                 * For Client Credentials, normally it means
                 * passing the details to the backend.
                 * @param {Object} installedData the PureCloud resource created
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