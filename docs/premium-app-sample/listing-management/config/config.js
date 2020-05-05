import globalConfig from '../../config/global-config.js';

let origin = 'https://genesysappfoundry.github.io';
let clientIDs = globalConfig.clientIDs;
if(globalConfig.isTestEnvironment){
    origin = 'http://localhost:8080';
}

// Keep origin as tld as it's being used 
// to check post messages in preview listing.
// root would be the actual root URI of the project.
const root = (origin == 'https://genesysappfoundry.github.io') ?
                origin + '/partner-enablement-tools/listing-management' :
                origin + '/listing-management';

export default {    
    clientIDs: globalConfig.clientIDs,

    prefix: globalConfig.prefix,
    root: root,
    origin: origin,
    redirectUriBase: `${root}/partner-side/`,
    globalAssetsURL: `${root}/assets/`,

    // For the Cheat Chat API
    cheatChat: {
        organizationId: '1f86c618-0d8d-4f10-9893-aeacc5a158b0',
        deploymentId: '7102e7b2-2b12-4bb0-b90b-2aaf70b52831'
    }
}