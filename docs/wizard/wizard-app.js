import clientIDs from '../clientIDs.js'

let wizardApp = {
    // Reference to the PureCloud App
    pcApp: null,

    // Functions
    setup: undefined,
    pureCloudAuthenticate: undefined
}
let pcApp = wizardApp.pcApp;

wizardApp.setup = function(){
    // Backwards compatibility snippet from: https://github.com/MyPureCloud/client-app-sdk
    let envQueryParamName = 'pcEnvironment';

    if (window && window.location && typeof window.location.search === 'string' &&
        window.location.search.indexOf('pcEnvironment') >= 0) {
        pcApp = new window.purecloud.apps.ClientApp({pcEnvironmentQueryParam: envQueryParamName});
    } else {
        // Use default PureCloud region
        pcApp = new window.purecloud.apps.ClientApp();
    }
    console.log(pcApp.pcEnvironment);
}

wizardApp.pureCloudAuthenticate = function(){
    // Authenticate through PureCloud
    const redirectUri = "https://localhost/wizard/index.html";
    const platformClient = require('platformClient');
    let purecloudClient = platformClient.ApiClient.instance;

    purecloudClient.loginImplicitGrant(clientIDs[pcApp.pcEnvironment], 
                            redirectUri, 
                            {state: ('pcEnvironment=' + pcApp.pcEnvironment)})
    .then(function(data) {
        console.log(data);
    })
    .catch(function(err) {
        console.log(err);
    });
}

export default wizardApp