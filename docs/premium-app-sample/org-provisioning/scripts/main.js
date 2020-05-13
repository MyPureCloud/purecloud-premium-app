import provisionTelephonyViews from './views/provisiontelephony.js'
import architectFlowViews from './views/architectflow.js'
import loadModalView from './components/modals.js'
import developerRoleFlowViews from './views/developerRole.js'
import globalConfig from '../../config/global-config.js'
import header from '../../landing-page/components/header.js';
import sidebar from '../../landing-page/components/sidebar.js';
import content from './components/main.js';

// const clientId = '83d37bf5-e050-47bf-9937-0314b259c9c4';
const redirectUri = window.location.href;
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

let environment = '';

//Authenticate
environment = localStorage.getItem(globalConfig.appName + ':environment');
if(!environment){
    throw new Error('Environment not found from localstorage.');
}
let clientId = globalConfig.clientIDs[environment]; 
client.setEnvironment(environment);

// Display elements
const newHeaderEl = header.new("Dev Org Provisioning");
const newSidebarEl = sidebar.new();
const newContentEl = content.new();

document.body.appendChild(newHeaderEl);
document.body.appendChild(newSidebarEl);

let toolContent = document.getElementById("tool-contents");
toolContent.appendChild(newContentEl);

$(document).ready(() => {
    client.loginImplicitGrant(clientId, window.location.href.split('?')[0])
         .then(() => {
             console.log('Logged in');
            let token = client.authData.accessToken;

            // Eventlisteners for main buttons
            provisionTelephonyViews.btnEventListeners('btnProvisionTelephony');
            architectFlowViews.btnInitiateArchitectDownloadEventListener();
            developerRoleFlowViews.btnEventListener();
            loadModalView.setupLoadingEl();
         })
         .catch((err) => console.error(err));
})



