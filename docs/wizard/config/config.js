import cheatChat from '../../listing-management/partner-side/scripts/cheat-chat.js';
import globalConfig from '../../config/global-config.js';

export default {
    clientIDs: globalConfig.clientIDs,

    'wizardUriBase': globalConfig.isTestEnvironment ? 
            'http://localhost:8080/wizard/' :
            'https://genesysappfoundry.github.io/partner-enablement-tools/wizard/',

    // The actual URL of the landing page of your web app.
    'premiumAppURL': globalConfig.isTestEnvironment ? 
            'http://localhost:8080/' : 
            'https://genesysappfoundry.github.io/partner-enablement-tools/',

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    'appName': globalConfig.appName,

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
    'prefix': globalConfig.prefix,

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
                    },
                    {
                        "domain": "architect",
                        "entityName": "datatable",
                        "actionSet": ["*"]
                    }
                ]
            }
        ],
        'group': [
            {
                "name": "Listing Manager",
                "description": "People that will have acess to the Listing Info Workspce.",
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
                 * @param {Object} org orgname
                 * @param {String} pcEnvironment eg mypurecloud.com
                 * @returns {Promise}    
                 */
                'finally': function(installedData, org, pcEnvironment){
                    cheatChat.setUp(org, pcEnvironment);
                    return cheatChat.submitClientCredentials(installedData);
                }
            }
        ],
        'data-table': [{
            "name": "Listings",
            "description": "Contains the details of your app listings.",
            "referenceKey": "id",
            "customFields": [
                {
                    "name": "status",
                    "type": "string",
                    "default": "IN_PROGRESS"
                },
                {
                    "name": "businessInformation",
                    "type": "string",
                    "default": "{}"
                },
                {
                    "name": "listingDetails",
                    "type": "string",
                    "default": "{}"
                },
                {
                    "name": "premiumAppDetails",
                    "type": "string",
                    "default": "{}"
                },
                {
                    "name": "workspaceId",
                    "type": "string"
                },
                {
                    "name": "attachments",
                    "type": "string",
                    "default": "{}"
                },
                {
                    "name": "devFoundryNotes",
                    "type": "string",
                    "default": "[]"
                },
                {
                    "name": "placeholder1",
                    "type": "string"
                },
                {
                    "name": "placeholder2",
                    "type": "string"
                },
                {
                    "name": "placeholder3",
                    "type": "string"
                },
            ]
        }]
    }
};
