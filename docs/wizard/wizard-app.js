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

/**
 * WizardApp class that handles everything in the App.
 * @todo Change all members to static if more appropriate
 * @todo keep track of current main module(page) to check with inner modules before they're rendered
 */
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

        // Prefix to add to all objects that will be added
        // (roles, groups, integrations, etc..)
        // as a result of this installatino wizard
        this.prefix = 'Prince';
    }

    /**
     * First thing that needs to be called to setup up the PureCloud Client App
     */
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


    /**
     * Authenticate to PureCloud (Implicit Grant)
     * @todo Assign default or notify user if can't determine purecloud environment
     * @todo Decouple so can be called in every new rendered page
     */
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

            this._renderModule('landing-page',
                    {isAuthorized: isAuthorized,
                     features: orgFeature,
                     startWizardFunction: this.loadRolesPage
                    });

        // Error handler catch all
        }).catch(err => console.log(err));
    }

    /**
     * Render the Handlebars template to the window
     * @param {string} page     contains filename of handlebars file
     * @param {object} context  context oject
     * @param {string} target   ID of element HTML where rendered module will be placed
     */
    _renderModule(page, context, target) {
        context = (typeof context !== 'undefined') ? context : {}; 
        target = (typeof target !== 'undefined') ? target : 'default-module'; 

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

                // Render html and display to the target element
                let renderedHtml = template(context);
                $('#' + target).html(renderedHtml);

                this._assignEventListeners(page);
            }
        }); 
    }

    /**
     * Manual assignment of event listeners after page is rendered
     * @param {string} page 
     * 
     * @todo Find potential alternative that does this better
     */
    _assignEventListeners(page){
        switch(page){
            case 'landing-page':
                // Button to Start the Wizard
                // jquery proxy to keep the context of 'this'
                $('#btn-start-wizard').click($.proxy(this.loadCheckInstallationStatus, this));
                break;
        }
    }

    /**
     * Loads the landing page of the app
     */
    loadLandingPage(){
        this._pureCloudAuthenticate();
    }

    /**
     * Load the page to check for existing PureCloud objects
     */
    loadCheckInstallationStatus(){
        this._renderModule('check-installation', {
            objectPrefix: this.prefix
        });

        // PureCloud API instances
        let groupsApi = new this.platformClient.GroupsApi();
        let authApi = new this.platformClient.AuthorizationApi();

        var groupSearchBody = {
            "query": [
               {
                 "fields": ["name"],
                  "value": this.prefix,
                  "operator": "OR",
                  "type": "STARTS_WITH"
               }
            ]
        };

        var authOpt = { 
            'name': this.prefix + "*", // Wildcard to work like STARTS_WITH 
            'userCount': false
        };
        
        // Check existing groups
        groupsApi.postGroupsSearch(groupSearchBody)
        .then(data => {
            let group = data.results;
            let context = {
                panelHeading: 'Existing Groups',
                objType: 'groups',
                pureCloudObjArr: group,
                icon: 'fa-users'
            }
            this._renderModule('panel-existing-objects',
                                context,
                                'results-group');
        }).catch(err => console.log(err));

        // Check existing roles
        authApi.getAuthorizationRoles(authOpt)
        .then(data => {
            let roles = data.entities;
            let context = {
                panelHeading: 'Existing Roles',
                objType: 'roles',
                pureCloudObjArr: roles,
                icon: 'fa-briefcase'
            }
            this._renderModule('panel-existing-objects',
                                context,
                                'results-role');
        })
        .catch(err => console.log(err));
    }

    /**
     * First thing that must be called to set-up the App
     */
    start(){
        this._setupClientApp();
        this.loadLandingPage();
    }
}
WizardApp.instance = null;

export default WizardApp