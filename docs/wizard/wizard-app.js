// Requires jQuery and Handlebars from parent module context
import clientIDs from '../clientIDs.js'

let wizardApp = {
    // Reference to the PureCloud App (Client App SDK)
    pcApp: null,
    // PureCloud Javascript SDK clients
    platformClient: null,
    purecloudClient: null,
    // Permissions required for using the app 
    // TODO: store permissions on a separate file
    setupPermissionsRequired: ['admin'],
    // Handlebars values
    templateSource: null,
    template: null,

    // Functions
    setup: () => null,
    pureCloudAuthenticate: () => null,
    renderPage: (page) => null
}
// Aliases
let _pcApp = wizardApp.pcApp;
let _platformClient = wizardApp.wizardApp;
let _purecloudClient = wizardApp.purecloudClient;
let _setupPermissionsRequired = wizardApp.setupPermissionsRequired;
let _templateSource = wizardApp.templateSource;
let _template = wizardApp.template;

wizardApp.setup = function(){
    _templateSource = document.getElementById("wizard-app-template").innerHTML;
    _template = Handlebars.compile(_templateSource);

    // Backwards compatibility snippet from: https://github.com/MyPureCloud/client-app-sdk
    let envQueryParamName = 'pcEnvironment';

    if (window && window.location && typeof window.location.search === 'string' &&
        window.location.search.indexOf('pcEnvironment') >= 0) {
        _pcApp = new window.purecloud.apps.ClientApp({pcEnvironmentQueryParam: envQueryParamName});
    } else {
        // Use default PureCloud region
        _pcApp = new window.purecloud.apps.ClientApp();
    }
    console.log(_pcApp.pcEnvironment);
}

wizardApp.pureCloudAuthenticate = function(){
    // Authenticate through PureCloud
    const redirectUri = "https://localhost/wizard/index.html";
    _platformClient = require('platformClient');
    _purecloudClient = _platformClient.ApiClient.instance;
    _purecloudClient.setPersistSettings(true, 'premium_app');

    _purecloudClient.loginImplicitGrant(clientIDs[_pcApp.pcEnvironment], 
                            redirectUri, 
                            {state: ('pcEnvironment=' + _pcApp.pcEnvironment)})
    // Check permission of user
    .then(data => {
        console.log(data);

        let usersApi = new _platformClient.UsersApi();
        let opts = {'expand': ['authorization']};
        return usersApi.getUsersMe(opts); 
    
    }).then(userMe => {
        console.log(userMe);
        // Show appropriate elements based on qualification of user permissions.
        if(!_setupPermissionsRequired.every(perm => userMe.authorization.permissions.indexOf(perm) > -1)){
            $('#unauthorized').show();
            $('#authorized').hide();
        }else{
            $('#unauthorized').hide();
            $('#authorized').show();
        }
        
    }).catch(err => console.log(err));
}

wizardApp.renderPage = function(page){
    switch(page){
        case 'landing_page':
            let context = {
                title: 'App Setup Wizard',
                subtitle: 'Welcome! This Wizard will assist you in the installation, modification, or removal of the Premium App.'
            }
            let renderedHtml = _template(context);
            $('#wizard-app-display').html(renderedHtml);
            break;
    }
}

export default wizardApp