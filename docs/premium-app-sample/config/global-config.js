// Toggle if running in localhost or GH pages
let isTestEnvironment = false;

console.log(`Running in ${isTestEnvironment ? 'TEST' : 'PROD'} environment`);

// PureCloud Integration type name for this app 
let appName = 'premium-app-example';

// PREFIX for provisioned PureCloud objects. Used by wizard and other app that
// test the existence of these objects
let prefix = 'PREMIUM_APP_EXAMPLE_';

// Client IDs when testing the app in localhost
let testClientIDs = {
    'mypurecloud.com': 'e7de8a75-62bb-43eb-9063-38509f8c21af',
}

// Client IDs for production
let prodClientIDs = {
    'mypurecloud.com': 'fd2ba742-446f-46c5-bbbc-1cad2f34ac3a',
    'mypurecloud.ie': '939ab4dd-109f-4120-ba9f-051b973b9ecc',
    'mypurecloud.de': 'aa8efb84-a77f-4c43-8b37-ac0566d9f73e',
    'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
    'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71',
    'usw2.pure.cloud': '2075921c-a285-4523-91df-7984f1268677'
}

// Determine URL for different environments
const root = isTestEnvironment ? 'http://localhost:8080' : 'https://mypurecloud.github.io/purecloud-premium-app';

export default {
    clientIDs: isTestEnvironment ? testClientIDs : prodClientIDs,
    isTestEnvironment: isTestEnvironment,
    appName: appName,
    prefix: prefix,
    root: root,
    landingAssetURL: `${root}/premium-app-sample/landing-page/assets`
}