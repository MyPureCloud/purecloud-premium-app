// Toggle if running in localhost or GH pages
let isTestEnvironment = true;

console.log(`Running in ${isTestEnvironment ? 'TEST' : 'PROD'} environment`);

// PureCloud Integration type name for this app 
let appName = 'premium-app-example';

// PREFIX for provisioned PureCloud objects. Used by wizard and other app that
// test the existence of these objects
let prefix = 'DEV_ORG_PROVISIONING_TOOL_';

// Client IDs when testing the app in localhost
let testClientIDs = {
    'mypurecloud.com': 'e7de8a75-62bb-43eb-9063-38509f8c21af',
}

// Client IDs for production
let prodClientIDs = {
    'mypurecloud.com': 'e4163c90-2168-400a-9441-cb2c8ae7ccc2',
    'mypurecloud.ie': '377bf436-7787-4ed0-83d7-7ade528ff4ed',
    'mypurecloud.com.au': 'ae206cd0-a70e-481d-86f4-b1bfb61498de',
    'mypurecloud.jp': '265993a4-931a-44e5-a0b1-80519c3edb25',
    'mypurecloud.de':  '5f25a1d0-7b42-416b-beb3-fa708e7b2e65',
    'usw2.pure.cloud': '0d09a06e-f09a-47ed-8556-080479596414' 
}

// Determine URL for different environments
const root = isTestEnvironment ? 'http://localhost:8080' : 'https://github.com/MyPureCloud/purecloud-premium-app';

export default {
    clientIDs: isTestEnvironment ? testClientIDs : prodClientIDs,
    isTestEnvironment: isTestEnvironment,
    appName: appName,
    prefix: prefix,
    root: root,
    landingAssetURL: `${root}/premium-app-sample/landing-page/assets`
}