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
    }

    // First thing that needs to be called to setup up the PureCloud Client App
    setupClientApp(){    
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

    // TODO: Assign default or notify user if can't determine purecloud environment
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
        let templateUri = 'templates/' + page + '.handlebars';
        let templateSource;
        let template;
        let context = {};

        // Async get the desired template file
        $.ajax({
            url: templateUri,
            cache: true,
            success: data => {
                // Compile Handlebars template 
                templateSource = data;
                template = Handlebars.compile(templateSource);

                // Assign context
                switch(page){
                    case 'landing-page':
                        context = {};
                        break;
                }

                // Render html and display to webpage
                let renderedHtml = template(context);
                $('#wizard-app-display').html(renderedHtml);
            }
        });
        
    }
}

export default WizardApp