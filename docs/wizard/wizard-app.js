import clientIDs from '../clientIDs.js'

let wizardApp = {
    // Reference to the PureCloud App
    pcApp: null,
    platformClient: null,
    purecloudClient: null,
    setupPermissionsRequired: ['admin'],

    // Functions
    setup: undefined,
    pureCloudAuthenticate: undefined
}
// Aliases
let pcApp = wizardApp.pcApp;
let platformClient = wizardApp.wizardApp;
let purecloudClient = wizardApp.purecloudClient;
let setupPermissionsRequired = wizardApp.setupPermissionsRequired;

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
    platformClient = require('platformClient');
    purecloudClient = platformClient.ApiClient.instance;
    purecloudClient.setPersistSettings(true, 'premium_app');

    purecloudClient.loginImplicitGrant(clientIDs[pcApp.pcEnvironment], 
                            redirectUri, 
                            {state: ('pcEnvironment=' + pcApp.pcEnvironment)})
    // Check permission of user
    .then(data => {
        console.log(data);

        let usersApi = new platformClient.UsersApi();
        let opts = {'expand': ['authorization']};
        return usersApi.getUsersMe(opts); 
    
    }).then(userMe => {
        console.log(userMe);
        // Show appropriate elements based on qualification of user permissions.
        if(!setupPermissionsRequired.every(perm => userMe.authorization.permissions.indexOf(perm) > -1)){
            $('#unauthorized').show();
            $('#authorized').hide();
        }else{
            $('#unauthorized').hide();
            $('#authorized').show();
        }
        
    }).catch(err => console.log(err));
}

export default wizardApp