import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';

// Genesys Cloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
const ClientApp = window.purecloud.apps.ClientApp;

// API 
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();

// Constants
const appName = config.appName;
        
// Variables
let pcLanguage;
let pcEnvironment;
let clientApp = null;
let userMe = null;
let integrationId = '';

/**
 * Get ID of the integration so the description can be edited containing
 * the installed data. Currently gets the first one from the result.
 * Does not support multiple integration instances yet.
 * @returns {Promise} id of the premium app integration instance
 */
function getIntegrationId(){
    return new Promise((resolve, reject) => {
        integrationsApi.getIntegrationsClientapps({pageSize: 1000})
        .then((data) => {
            let instances = data.entities;
            let pa_instance = instances.find(instance => instance.integrationType.id == config.appName);
            if(pa_instance){
                resolve(pa_instance.id);
            }else{
                resolve(null);
            }
        })
        .catch(err => reject(err))
    });
}   

/**
 * Set values for environment and language, prioritizng values on the query
 * parameters
 */
function setDynamicParameters(){
    // Get Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    let tempLanguage = urlParams.get(config.languageQueryParam);
    let tempPcEnv = urlParams.get(config.genesysCloudEnvironmentQueryParam); 

    // Language
    pcLanguage = tempLanguage || 
                localStorage.getItem(appName + ':language') ||
                config.defaultLanguage;
    localStorage.setItem(appName + ':language', pcLanguage);

    // Environment
    pcEnvironment = tempPcEnv ||
                    localStorage.getItem(appName + ':environment') ||
                    config.defaultPcEnvironment;
    localStorage.setItem(appName + ':environment', pcEnvironment);
}

/**
 * Authenticate with Genesys Cloud
 * @returns {Promise} login info
 */
function authenticateGenesysCloud(){
    client.setEnvironment(pcEnvironment);
    client.setPersistSettings(true, appName);
    return client.loginImplicitGrant(
                config.clientID, 
                config.wizardUriBase + 'index.html'
            );
}

/**
 * Get user details with its roles
 * @returns {Promise} usersApi result
 */
function getUserDetails(){
    let opts = {'expand': ['authorization']};
    
    return usersApi.getUsersMe(opts);
}

/**
 * Checks if the Genesys Cloud org has the premium app product enabled
 * @returns {Promise}
 */
function validateProductAvailability(){      
    let integrationTypes = []

    // Internal recursive function for calling 
    // next pages (if any) of the integration types
    let _getIntegrationTypes = (pageNum) => {
        return integrationsApi.getIntegrationsTypes({
            pageSize: 100,
            pageNumber: pageNum
        })
        .then((data) => {
            data.entities.forEach(integrationType => 
                integrationTypes.push(integrationType));
            
            if(data.nextUri){
                return _getIntegrationTypes(pageNum + 1);
            }
        });
    }

    return _getIntegrationTypes(1)
    .then(() => {
        if (integrationTypes.filter((integType) => integType.id === appName)[0]){
            console.log('PRODUCT AVAILABLE');
            return true;
        } else {
            console.log('PRODUCT NOT AVAILABLE');
            return false;
        }
    })
    .catch(e => console.error(e)); 
}

/**
 * Setup function
 * @returns {Promise}
 */
function setup(){
    view.showLoadingModal('Loading...');
    view.setupPage();
    view.hideContent();

    setDynamicParameters();

    // Setup Client App
    clientApp = new ClientApp({
        pcEnvironment: pcEnvironment
    });

    return authenticateGenesysCloud()
    .then(() => {
        return getUserDetails();
    })
    .then((user) => {
        userMe = user;

        view.showUserName(user);

        return getIntegrationId();
    })
    .then((id) => {
        integrationId = id;

        return setPageLanguage();
    })  
    .then(() => {
        wizard.setup(client, userMe, integrationId);

        return runPageScript();
    })  
    .then(() => {
        view.hideLoadingModal();
    })
    .catch((e) => console.error(e));    
}

/**
 * Sets and loads the language file based on the pcLanguage global var
 * @returns {Promise}
 */
function setPageLanguage(){
    return new Promise((resolve, reject) => {
        let fileUri = 
            `${config.wizardUriBase}assets/languages/${pcLanguage}.json`;
        $.getJSON(fileUri)
        .done(data => {
            Object.keys(data).forEach((key) => {
                let els = document.querySelectorAll(`.${key}`);
                for(let i = 0; i < els.length; i++){
                    els.item(i).innerText = data[key];
                }
            })
            resolve();
        })
        .fail(xhr => {
            console.log('Language file not found.');
            resolve();
        }); 
    });
}

/**
 * Runs page specific script.
 * @returns {Promise}
 */
function runPageScript(){
    return new Promise((resolve, reject) => {
        let pathParts = window.location.pathname.split('/');
        let page = pathParts[pathParts.length - 1];

        // Run Page Specific Scripts
        switch(page){
            case 'index.html':
                // Button Handler
                let elNextBtn = document.getElementById('next');
                elNextBtn.addEventListener('click', () => {
                    if(config.enableCustomSetup){
                        window.location.href = './custom-setup.html';
                    } else {
                        window.location.href = './install.html';
                    }
                });

                validateProductAvailability()
                .then((isAvailable) => {
                    if(isAvailable){
                        view.showProductAvailable();
                    }else{
                        view.showProductUnavailable();
                    }

                    return wizard.isExisting();
                })
                // Check if has an existing installation
                .then((exists) => {
                    if(exists) {
                        if(!userMe.authorization.permissions.includes(config.viewPermission)){
                            window.location.href = './unlicensed.html';
                        } else {
                            window.location.href = config.premiumAppURL;
                        }
                    } else {
                        view.showContent();
                        resolve();
                    }
                });
                break;
            case 'custom-setup.html':
                // Button Handler
                let elSetupBtn = document.getElementById('next');
                elSetupBtn.addEventListener('click', () => {
                    window.location.href = './install.html';
                });

                resolve();
                view.showContent();
                break;
            case 'install.html':
                // Button Handler
                let elStartBtn = document.getElementById('start');
                elStartBtn.addEventListener('click', () => {
                    view.showLoadingModal('Installing..');
                    wizard.install()
                    .then(() => {
                        window.location.href = './finish.html';
                    })
                    .catch(e => console.error(e))
                });

                resolve();
                view.showContent();
                break;
            case 'finish.html':
                view.showContent();
                setTimeout(() => {
                    window.location.href = config.premiumAppURL;
                }, 2000);

                resolve();
                break;
            case 'uninstall.html':
                alert("The uninstall button is for development purposes only. Remove this button before demo.");

                view.showContent();
                view.showLoadingModal('Uninstalling...');

                wizard.uninstall()
                .then(() => {
                    setTimeout(() => {
                        window.location.href = config.wizardUriBase 
                                        + 'index.html';
                    }, 2000);
                });
                resolve();
                break;
            default:
                reject('Unknown page');
                break;
        }
    });
}


setup();