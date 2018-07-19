export default {
    clientIDs: {
        //'mypurecloud.com': '8c821827-57bd-4d44-8765-597d4a3220c5',
        'mypurecloud.com': '26255f2c-6a85-43bf-8d27-7761057bc72d',
        'mypurecloud.ie': '939ab4dd-109f-4120-ba9f-051b973b9ecc',
        'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
        'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71'
    },
    "redirectUri": "https://mypurecloud.github.io/purecloud-premium-app/wizard/index.html",
    //"redirectUri": "https://localhost/wizard/index.html",

    //Permissions required for running the Wizard App
    "setupPermissionsRequired": ['admin'],

    // To be added to names of PureCloud objects created by the wizard
    "prefix": "PREMIUM_EXAMPLE_",
}