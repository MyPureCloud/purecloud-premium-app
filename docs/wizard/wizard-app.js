/*
*   This sample uses ES6 features
*/
import clientIDs from '../clientIDs.js'

// Requires jQuery and Handlebars from parent context
const $ = window.$;
const jQuery = window.jQuery;
const Handlebars = window.Handlebars;
if((typeof $ === 'undefined') ||
        (typeof jQuery === 'undefined') ||
        (typeof Handlebars === 'undefined')){
    console.error("===== PREMIUM APP ERROR ====== \n" +
                  "A required library is missing. \n" +
                  "==============================");   
}

class WizardApp {
    constructor(){
        // Reference to the PureCloud App (Client App SDK)
        this.pcApp = null;
        // PureCloud Javascript SDK clients
        this.platformClient = null;
        this.purecloudClient = null;
        // Permissions required for using the app 
        // TODO: store permissions on a separate file
        this.setupPermissionsRequired = ['admin'];
        // Handlebars values
        this.templateSource = null;
        this.template = null;
    }

    setupClientApp(){
        this.templateSource = document.getElementById("wizard-app-template").innerHTML;
        this.template = Handlebars.compile(this.templateSource);
    
        // Backwards compatibility snippet from: https://github.com/MyPureCloud/client-app-sdk
        let envQueryParamName = 'pcEnvironment';
    
        if (window && window.location && typeof window.location.search === 'string' &&
            window.location.search.indexOf('pcEnvironment') >= 0) {
                this.pcApp = new window.purecloud.apps.ClientApp({pcEnvironmentQueryParam: envQueryParamName});
        } else {
            // Use default PureCloud region
            this.pcApp = new window.purecloud.apps.ClientApp();
        }
        console.log(this.pcApp.pcEnvironment);
    }

    pureCloudAuthenticate() {
        // Authenticate through PureCloud
        const redirectUri = "https://localhost/wizard/index.html";
        this.platformClient = require('platformClient');
        this.purecloudClient = this.platformClient.ApiClient.instance;
        this.purecloudClient.setPersistSettings(true, 'premium_app');
    
        this.purecloudClient.loginImplicitGrant(clientIDs[this.pcApp.pcEnvironment], 
                                redirectUri, 
                                {state: ('pcEnvironment=' + this.pcApp.pcEnvironment)})
        // Check permission of user
        .then(data => {
            console.log(data);
    
            let usersApi = new this.platformClient.UsersApi();
            let opts = {'expand': ['authorization']};
            return usersApi.getUsersMe(opts); 
        
        }).then(userMe => {
            console.log(userMe);
            // Show appropriate elements based on qualification of user permissions.
            if(!this.setupPermissionsRequired.every(perm => userMe.authorization.permissions.indexOf(perm) > -1)){
                $('#unauthorized').show();
                $('#authorized').hide();
            }else{
                $('#unauthorized').hide();
                $('#authorized').show();
            }
            
        }).catch(err => console.log(err));
    }

    renderPage(page) {
        switch(page){
            case 'landing_page':
                let context = {
                    title: 'App Setup Wizard',
                    subtitle: 'Welcome! This Wizard will assist you in the installation, modification, or removal of the Premium App.'
                }
                let renderedHtml = this.template(context);
                $('#wizard-app-display').html(renderedHtml);
                break;
        }
    }
}

export default WizardApp