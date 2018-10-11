export default {
    clientIDs: {
        'mypurecloud.com': 'e7de8a75-62bb-43eb-9063-38509f8c21af',
        
        //'mypurecloud.com': '26255f2c-6a85-43bf-8d27-7761057bc72d',
        'mypurecloud.ie': '939ab4dd-109f-4120-ba9f-051b973b9ecc',
        'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
        'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71'
    },
    //"redirectUri": "https://mypurecloud.github.io/purecloud-premium-app/",
    "redirectUriBase": "https://localhost/",

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    "appName": "premium-app-example",

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    "defaultPcEnv": "mypurecloud.com.au",
    "defaultLangTag": "en-us",

    // Permissions required for running the Wizard App
    "setupPermissionsRequired": ['admin'],

    // To be added to names of PureCloud objects created by the wizard
    "prefix": "PREMIUM_EXAMPLE_",

    // These are the PureCloud items that will be added and provisioned by the wizard
    "provisioningInfo": {
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
                "groups": ["Agents"]
            }
        ],
        "oauth": [
            {
                "name": "OAuth Client",
                "description": "Generated Client that's passed to the App Backend",
                "roles": ["Role"],
                "authorizedGrantType": "CLIENT_CREDENTIALS"
            }
        ]
    }
};