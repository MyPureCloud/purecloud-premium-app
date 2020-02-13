/*
*   NOTE: This sample uses ES6 features
*/
import appConfig from '../../config/config.js';

// JQuery Alias
const $ = window.$;

// Relative path to wizard page from config's redirectUri
const WIZARD_PAGE = "wizard/index.html";

/**
 * WizardApp class that handles everything in the App.
 */
class WizardApp {
    constructor(){
        // Reference to the PureCloud App (Client App SDK)
        this.pcApp = null;

        // PureCloud Javascript SDK clients
        this.platformClient = require('platformClient');
        this.purecloudClient = this.platformClient.ApiClient.instance;
        this.purecloudClient.setPersistSettings(true, 'premium_app');
        this.redirectUri = appConfig.redirectUriBase + WIZARD_PAGE;

        // PureCloud API instances
        this.usersApi = new this.platformClient.UsersApi();
        this.integrationsApi = new this.platformClient.IntegrationsApi();
        this.groupsApi = new this.platformClient.GroupsApi();
        this.authApi = new this.platformClient.AuthorizationApi();
        this.oAuthApi = new this.platformClient.OAuthApi();

        // Language default is english
        // Language context is object containing the translations
        this.language = appConfig.defaultLangTag;

        // PureCloud app name
        this.appName = appConfig.appName;

        this.prefix = appConfig.prefix;
        this.installationData = appConfig.provisioningInfo;

        // PureCloud user object (current user)
        this.user = {};
    }

    /**
     * Get details of the current user
     * @return {Promise.<Object>} PureCloud User data
     */
    getUserDetails(){
        let opts = {'expand': ['authorization']};
    
        return this.usersApi.getUsersMe(opts);
    }

    /**
     * Checks if the product is available in the current Purecloud org.
     * @return {Promise.<Boolean>}
     */
    validateProductAvailability(){
        // premium-app-example         
        return this.integrationsApi.getIntegrationsTypes({})
        .then((data) => {
            if (data.entities.filter((integType) => integType.id === this.appName)[0]){
                console.log("PRODUCT AVAILABLE");
                return(true);
            } else {
                console.log("PRODUCT NOT AVAILABLE");
                return(false);
            }
        });
    }

    /**
     * Checks if any configured objects are still existing. 
     * This is based on the prefix
     * @returns {Promise.<Boolean>} If any installed objects are still existing in the org. 
     */
    isExisting(){
        let promiseArr = []; 
        
        promiseArr.push(this.getExistingGroups());
        promiseArr.push(this.getExistingRoles());
        promiseArr.push(this.getExistingApps());
        promiseArr.push(this.getExistingAuthClients());

        return Promise.all(promiseArr)
        .then((results) => { 
            if(
                // Check if any groups are still existing
                results[0].total > 0 || 

                // Check if any roles are existing
                results[1].total > 0 ||

                // Check if any apps are existing
                results[2].length > 0 ||

                results[3].length > 0
            ){

                return(true);
            }

            return(false);
        });
    }


    //// =======================================================
    ////      ROLES
    //// =======================================================


    //// =======================================================
    ////      GROUPS
    //// =======================================================

 


    //// =======================================================
    ////      INTEGRATIONS (APP INSTANCES)
    //// =======================================================



    //// =======================================================
    ////      OAUTH2 CLIENT
    //// =======================================================



    //// =======================================================
    ////      PROVISIONING / DEPROVISIONING
    //// =======================================================

    /**
     * Delete all existing Premium App PC objects
     * @returns {Promise}
     */
    clearConfigurations(){
        let configArr = [];

        configArr.push(this.deleteAuthClients());
        configArr.push(this.deletePureCloudGroups());
        configArr.push(this.deletePureCloudRoles());
        configArr.push(this.deletePureCloudApps());

        return Promise.all(configArr);
    }

    /**
     * Final Step of the installation wizard. 
     * Create the PureCloud objects defined in provisioning configuration
     * The order is important for some of the PureCloud entities.
     */
    installConfigurations(){
        // Create groups
        return this.addGroups()

        // Create instances after groups for (optional) group filtering
        .then((groupData) => this.addInstances(groupData))

        // Create Roles
        .then(() => this.addRoles())

        // Create OAuth client after role (required) and pass to server
        .then((roleData) => this.addAuthClients(roleData))
        .then((oAuthClients) => this.storeOAuthClient(oAuthClients))


        // When everything's finished, log a success message.
        .then(() => {
            this.logInfo("Installation Complete!");
        })
        .catch((err) => console.log(err));
    }

    /**
     * If an OAUTH Client is created pass the details over to a backend system.
     * NOTE: This function is for demonstration purposes and is neither functional
     *       nor production-ready.
     * @param {Array} oAuthClients PureCloud OAuth objects. 
     *         Normally there should only be 1 auth client created for an app.                     
     */
    storeOAuthClient(oAuthClients){
        // TODO: Replace with something functional for production

        // oAuthClients.forEach((client) => {
        //     $.ajax({
        //         url: "https://mycompany.org/premium-app",
        //         method: "POST",
        //         contentType: "application/json",
        //         data: JSON.stringify(oAuthClients)
        //     });
        // });

        console.log("Sent to server!");
    }

    //// =======================================================
    ////      DISPLAY/UTILITY FUNCTIONS
    //// =======================================================

    /**
     * Renders the proper text language into the web pages
     * @param {Object} text  Contains the keys and values from the language file
     */
    displayPageText(text){
        $(document).ready(() => {
            for (let key in text){
                if(!text.hasOwnProperty(key)) continue;
                $("." + key).text(text[key]);
            }
        });
    }

    /**
     * Shows an overlay with the specified data string
     * @param {string} data 
     */
    logInfo(data){
        if (!data || (typeof(data) !== 'string')) data = "";

        $.LoadingOverlay("text", data);
    }

    //// =======================================================
    ////      ENTRY POINT
    //// =======================================================
    start(){
        return this._setupClientApp()
            .then(() => this._pureCloudAuthenticate())
            .then((data) => { 
                console.log(data); 

                return this.getUserDetails();
            })
            .then((user) => {
                console.log(user);
                this.user = user;
            })
            .catch((err) => console.log(err));
    }

    /**
     * First thing that needs to be called to setup up the PureCloud Client App
     */
    _setupClientApp(){    
        // Snippet from URLInterpolation example: 
        // https://github.com/MyPureCloud/client-app-sdk
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');

        let pcEnv = null;   
        let langTag = null;

        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if(currParam[0] === 'langTag') {
                langTag = currParam[1];
            } else if(currParam[0] === 'pcEnvironment') {
                pcEnv = currParam[1];
            } else if(currParam[0] === 'environment' && pcEnv === null) {
                pcEnv = currParam[1];
            }
        }

        // Stores the query parameters into localstorage
        // If query parameters are not provided, try to get values from localstorage
        // Default values if it does not exist.
        if(pcEnv){
            localStorage.setItem(this.appName + ":environment", pcEnv);
        }else if(localStorage.getItem(this.appName + ":environment")){
            pcEnv = localStorage.getItem(this.appName + ":environment");
        } else {
            // Use default PureCloud region
            pcEnv = appConfig.defaultPcEnv;
        }
        this.pcApp = new window.purecloud.apps.ClientApp({pcEnvironment: pcEnv});


        if(langTag){
            this.language = langTag;
            localStorage.setItem(this.appName + ":langTag", langTag);
        }else if(localStorage.getItem(this.appName + ":langTag")){
            langTag = localStorage.getItem(this.appName + ":langTag");
            this.language = langTag;
        } else {
            // Use default Language
        }
        
        console.log(this.pcApp.pcEnvironment);

        // Get the language context file and assign it to the app
        // For this example, the text is translated on-the-fly.
        return new Promise((resolve, reject) => {
            let fileUri = './languages/' + this.language + '.json';
            $.getJSON(fileUri)
            .done(data => {
                this.displayPageText(data);
                resolve();
            })
            .fail(xhr => {
                console.log('Language file not found.');
                resolve();
            }); 
        });
    }

    /**
     * Authenticate to PureCloud (Implicit Grant)
     * @return {Promise}
     */
    _pureCloudAuthenticate() {
        this.purecloudClient.setEnvironment(this.pcApp.pcEnvironment);
        return this.purecloudClient.loginImplicitGrant(
                        appConfig.clientIDs[this.pcApp.pcEnvironment], 
                        this.redirectUri, 
                        {state: ('pcEnvironment=' + this.pcApp.pcEnvironment)});
    }
}


export default WizardApp;