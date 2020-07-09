// Toggle if running in localhost or GH pages
let isTestEnvironment = false;

console.log(`Running in ${isTestEnvironment ? 'TEST' : 'PROD'} environment`);

// Genesys Cloud Integration type name for this app 
let appName = 'premium-app-example';

// PREFIX for provisioned Genesys Cloud objects. Used by wizard and other app that
// test the existence of these objects
let prefix = 'PREMIUM_APP_EXAMPLE_';

// Client IDs when testing the app in localhost
let testClientID = 'e7de8a75-62bb-43eb-9063-38509f8c21af';

// Client IDs for production
let prodClientID = 'fd2ba742-446f-46c5-bbbc-1cad2f34ac3a';

// Determine URL for different environments
const root = isTestEnvironment ? 'http://localhost:8080' : 'https://mypurecloud.github.io/purecloud-premium-app';

export default {
    clientID: isTestEnvironment ? testClientID : prodClientID,
    isTestEnvironment: isTestEnvironment,
    appName: appName,
    prefix: prefix,
    root: root,
    landingAssetURL: `${root}/premium-app-sample/landing-page/assets`
}