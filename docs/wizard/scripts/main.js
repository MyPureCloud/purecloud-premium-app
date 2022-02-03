import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';
import { PAGES } from './enums.js'

// Genesys Cloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance; 
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();

// Constants
const premiumAppIntegrationTypeId = config.premiumAppIntegrationTypeId;

// Variables
let pcLanguage;
let pcEnvironment;
let startPage = PAGES.INDEX_PAGE;
let currentPage = null;
let userMe = null;

/**
 * Set values for environment and language, prioritizng values on the query
 * parameters
 */
function setDynamicParameters() {
    // Get Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    let tempLanguage = urlParams.get(config.languageQueryParam);
    let tempPcEnv = urlParams.get(config.genesysCloudEnvironmentQueryParam);

    // Language
    pcLanguage = tempLanguage ||
        localStorage.getItem(premiumAppIntegrationTypeId + ':language') ||
        config.defaultLanguage;
    localStorage.setItem(premiumAppIntegrationTypeId + ':language', pcLanguage);

    // Environment
    pcEnvironment = tempPcEnv ||
        localStorage.getItem(premiumAppIntegrationTypeId + ':environment') ||
        config.defaultPcEnvironment;
    localStorage.setItem(premiumAppIntegrationTypeId + ':environment', pcEnvironment);
}

/**
 * Get the name of the current html page
 * @returns {String} eg index.html, install.html, etc..
 */
 function getPage(){
    const pathParts = window.location.pathname.split('/');
    const page = pathParts[pathParts.length - 1];

    return page;
}

/**
 * Authenticate with Genesys Cloud
 * @returns {Promise} login info
 */
function authenticateGenesysCloud() {
    client.setEnvironment(pcEnvironment);
    client.setPersistSettings(true, premiumAppIntegrationTypeId);
    return client.loginImplicitGrant(
        config.clientID,
        window.location.href
    );
}

/**
 * Get user details with its roles from the Genesys API
 * @returns {Promise} usersApi result
 */
function getUserDetails() {
    let opts = { 'expand': ['organization', 'authorization'] };

    return usersApi.getUsersMe(opts);
}

/**
 * Checks if the Genesys Cloud org has the premium app product enabled
 * @returns {Promise}
 */
async function validateProductAvailability() {
    let productAvailable = false;
    try {
        await integrationsApi.getIntegrationsType(premiumAppIntegrationTypeId);
        console.log('PRODUCT AVAILABLE');
        return true;
    } catch(e) {
        console.log('PRODUCT NOT AVAILABLE');
    }
    return productAvailable;
}

/**
 * Navigate to a new page
* @param {Enum.PAGES} targetPage the target page
 */
async function switchPage(targetPage){
    currentPage = targetPage;
    console.log(`Going to page: ${currentPage}`);

    view.displayPage(targetPage);
    switch(targetPage){
        case PAGES.INDEX_PAGE:
            // Check product availability
            const productAvailable = await validateProductAvailability()
            if (productAvailable) {
                view.showProductAvailable();
            } else {
                view.showProductUnavailable();
            }
            
            // Check if has an existing installation
            const integrationInstalled = await wizard.isExisting();
            if (integrationInstalled) {
                // If the wizard install process was already performed, only check the Premium App View permission
                if (!userMe.authorization.permissions.includes(config.premiumAppViewPermission)) {
                    localStorage.setItem(premiumAppIntegrationTypeId + ':missingPermissions', config.premiumAppViewPermission);
                    window.location.href = './unlicensed.html';
                } else {
                    window.location.href = config.redirectURLOnWizardCompleted;
                }
            } else {
                // JSM TODO - rest-ce que ca ne va pas masquer le cas ou product is not available???
                if (config.checkInstallPermissions && productAvailable == true) {
                    let missingPermissions = checkUserPermissions(config.checkInstallPermissions, userMe.authorization.permissions);
                    if (missingPermissions && missingPermissions.length > 0) {
                        localStorage.setItem(premiumAppIntegrationTypeId + ':missingPermissions', missingPermissions.toString());
                        window.location.href = './unlicensed.html';
                    }
                } 
            }
            break;
        case PAGES.CUSTOM_SETUP:
            break;
        case PAGES.INSTALL_DETAILS:
            break;
        case PAGES.DONE:
            setTimeout(() => {
                window.location.href = config.redirectURLOnWizardCompleted;
            }, 2000);

            break;
        case PAGES.UNINSTALL:
            alert('The uninstall button is for development purposes only. Remove this button before demo.');

            view.showLoadingModal('Uninstalling...');

            await wizard.uninstall();
            setTimeout(() => {
                window.location.href = config.wizardUriBase + 'index.html';
            }, 2000);

            break;
        case PAGES.ERROR:
            break;
        default:
            throw new Error('Unknown page');
    }
    console.log(`Loaded page: ${currentPage}`);
}

/**
 * Assign navigation functionality for buttons
 */
function setButtonEventListeners(){
    const nextButtons = Array.from(document.getElementsByClassName('btn-next'));
    const installButton = document.getElementById('btn-install');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log(currentPage)
            switch(currentPage){
                case PAGES.INDEX_PAGE:
                    if (config.enableCustomSetupPageBeforeInstall) {
                        switchPage(PAGES.CUSTOM_SETUP);
                    } else {
                        switchPage(PAGES.INSTALL_DETAILS);
                    }
                    break;
                case PAGES.CUSTOM_SETUP:
                    switchPage(PAGES.INSTALL_DETAILS);
                    break;
            }
        })
    });

    if(installButton) {
        installButton.addEventListener('click', () => {
            (async () => {
                view.showLoadingModal('Installing..');
                try {
                    const customSetupStatus = await wizard.install();
                    if (customSetupStatus.status) {
                        switchPage(PAGES.DONE);
                    } 
                    // TODO:
                    // else {
                    //     localStorage.setItem(premiumAppIntegrationTypeId + ':failureCause', customSetupStatus.cause);
                    //     window.location.href = './post-custom-setup-failure.html';
                    // }
                } catch(e) {
                    console.error(e);
                }
            })();
        })
    }
}

/**
 * Checks if the user has the necessary permissions
 */
function checkUserPermissions(checkType, userPermissions) {
    let missingPermissions = [];
    if (checkType === 'premium') {
        if (!userPermissions.includes(config.premiumAppViewPermission)) {
            missingPermissions.push(config.premiumAppViewPermission);
        }
    } else if (checkType === 'wizard' || checkType === 'all') {
        let permissionsToCheck = [];

        if (checkType === 'all') {
            permissionsToCheck.push(config.premiumAppViewPermission);
        }

        let modulesToCheck = Object.keys(config.provisioningInfo);
        modulesToCheck.push('custom');
        modulesToCheck.push('wizard');
        if (config.enableCustomSetupStepAfterInstall === true) {
            modulesToCheck.push('postCustomSetup');
        }

        modulesToCheck.forEach(modKey => {
            config.installPermissions[modKey].forEach(item => {
                if (!permissionsToCheck.includes(item)) {
                    permissionsToCheck.push(item);
                }
            });
        });

        // check permissions
        // first filter on exact match
        let filteredPermissionsToCheck = permissionsToCheck.filter((perm) => !userPermissions.includes(perm));
        // second filter using startsWith match criteria - to manage division based permissions
        for (const checkPerm of filteredPermissionsToCheck) {
            let permissionFound = false;
            for (const userPerm of userPermissions) {
                if (userPerm.startsWith(checkPerm)) {
                    permissionFound = true;
                    break;
                }
            }
            if (permissionFound == false) {
                missingPermissions.push(checkPerm);
            }
        }
    }

    return missingPermissions;
}


/**
 * Setup function
 * @returns {Promise}
 */
async function setup() {
    view.showLoadingModal();
    view.setupPage();

    setDynamicParameters();

    try {
        // Authenticate and get current user
        await authenticateGenesysCloud();
        await config.setPageLanguage(pcLanguage);

        userMe = await getUserDetails();
        
        // Initialize the Wizard object
        wizard.setup(client, userMe);
        
        setButtonEventListeners();
        await switchPage(startPage);

        // Prepare page for viewing
        view.showUserName(userMe.name);
        view.hideLoadingModal();
    } catch (e) {
        console.error(e);
    }
}


// TODO: Change uninstallation determination to query parameter/state
if(getPage() == 'uninstall.html') startPage = PAGES.UNINSTALL;
setup();
