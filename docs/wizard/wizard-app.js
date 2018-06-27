/*
*   NOTE: This sample uses ES6 features
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
        this.platformClient = require('platformClient');
        this.purecloudClient = this.platformClient.ApiClient.instance;
        this.redirectUri = "https://localhost/wizard/index.html";
        // Permissions required for using the app 
        // TODO: store permissions on a separate file
        this.setupPermissionsRequired = ['admin'];
    }

    // First thing that needs to be called to setup up the PureCloud Client App
    _setupClientApp(){    
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
    _pureCloudAuthenticate() {
        let isAuthorized = false;
        // Authenticate through PureCloud
        this.purecloudClient.setPersistSettings(true, 'premium_app');
        this.purecloudClient.loginImplicitGrant(clientIDs[this.pcApp.pcEnvironment], 
                                this.redirectUri, 
                                {state: ('pcEnvironment=' + this.pcApp.pcEnvironment)})
        
        // Check user permissions
        .then(data => {
            console.log(data);
            let usersApi = new this.platformClient.UsersApi();

            let opts = {'expand': ['authorization']};

            return usersApi.getUsersMe(opts); 
        }).then(userMe => {
            console.log(userMe);
            let organizationApi = new this.platformClient.OrganizationApi();

            // Show appropriate elements based on qualification of user permissions.
            if(!this.setupPermissionsRequired.every(perm => userMe.authorization.permissions.indexOf(perm) > -1)){
                isAuthorized = false;
            }else{
                isAuthorized = true;
            }

        // Get organization information
            return organizationApi.getOrganizationsMe();
        }).then(orgData => {
            let orgFeature = orgData.features;

            this._renderPage('landing-page',
                    {isAuthorized: isAuthorized,
                     features: orgFeature,
                     startWizardFunction: this.loadRolesPage
                    });

        // Error handler catch all
        }).catch(err => console.log(err));
    }

    _renderPage(page, context) {
        context = (typeof context !== 'undefined') ? context : {}; 
        let templateUri = 'templates/' + page + '.handlebars';
        let templateSource;
        let template;

        // Async get the desired template file
        $.ajax({
            url: templateUri,
            cache: true,
            success: data => {
                // Compile Handlebars template 
                templateSource = data;
                template = Handlebars.compile(templateSource);

                // Render html and display to webpage
                let renderedHtml = template(context);
                $('#wizard-app-display').html(renderedHtml);

                this._assignEventListeners(page);
            }
        }); 
    }

    // Manual assignment of event listeners after page is rendered
    // TODO: Find better alternative
    _assignEventListeners(page){
        switch(page){
            case 'landing-page':
                // Button to Start the Wizard
                $('#btn-start-wizard').click(this.loadRolesPage);
                break;
        }
    }

    loadLandingPage(){
        this._setupClientApp();
        this._pureCloudAuthenticate();
    }

    loadRolesPage(){
        console.log("YEP");
    }

    start(){
        this.loadLandingPage();
    }
}

export default WizardApp