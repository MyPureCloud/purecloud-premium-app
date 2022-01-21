import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';

// Genesys Cloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// API 
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();

// Constants
const premiumAppIntegrationTypeId = config.premiumAppIntegrationTypeId;

// Variables
let pcLanguage;
let pcEnvironment;
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
 * Authenticate with Genesys Cloud
 * @returns {Promise} login info
 */
function authenticateGenesysCloud() {
    client.setEnvironment(pcEnvironment);
    client.setPersistSettings(true, premiumAppIntegrationTypeId);
    return client.loginImplicitGrant(
        config.clientID,
        config.wizardUriBase + 'index.html'
    );
}

/**
 * Get user details with its roles
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
    view.showLoadingModal('Loading...');
    view.setupPage();
    view.hideContent();

    setDynamicParameters();

    try {
        // Authenticate and get current user
        await authenticateGenesysCloud();
        const userDetails = await getUserDetails();
        userMe = userDetails;
        view.showUserName(userDetails);

        await config.setPageLanguage(pcLanguage);

        // Initialize the Wizard object
        wizard.setup(client, userMe);

        await runPageScript();

        view.hideLoadingModal();
    } catch (e) {
        console.error(e);
    }
}

/**
 * Runs page specific script.
 * @returns {Promise}
 */
async function runPageScript() {
    let pathParts = window.location.pathname.split('/');
    let page = pathParts[pathParts.length - 1];

    // Run Page Specific Scripts
    switch (page) {
        case 'index.html':
            // Button Handler
            let elNextBtn = document.getElementById('next');
            elNextBtn.addEventListener('click', () => {
                if (config.enableCustomSetupPageBeforeInstall) {
                    window.location.href = './custom-setup.html';
                } else {
                    window.location.href = './install.html';
                }
            });

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
                    } else {
                        // No missing permission or no required permission - granted access to install
                        view.showContent();
                    }
                } else {
                    // No check of permissions on install or product not available warning should take priority
                    view.showContent();
                }
            }

            break;
        case 'custom-setup.html':
            // Button Handler
            let elSetupBtn = document.getElementById('next');
            elSetupBtn.addEventListener('click', () => {
                window.location.href = './install.html';
            });

            view.showContent();
            break;
        case 'install.html':
            async function install() {
                view.showLoadingModal('Installing..');
                try {
                    const customSetupStatus = await wizard.install();
                    if (customSetupStatus.status) {
                        window.location.href = './finish.html';
                    } else {
                        localStorage.setItem(premiumAppIntegrationTypeId + ':failureCause', customSetupStatus.cause);
                        window.location.href = './post-custom-setup-failure.html';
                    }
                } catch(e) {
                    console.error(e);
                }
            }
            
            // Button Handler
            let elStartBtn = document.getElementById('start');
            elStartBtn.addEventListener('click', () => install());

            view.showContent();
            break;
        case 'finish.html':
            view.showContent();
            setTimeout(() => {
                window.location.href = config.redirectURLOnWizardCompleted;
            }, 2000);

            break;
        case 'uninstall.html':
            alert('The uninstall button is for development purposes only. Remove this button before demo.');

            view.showContent();
            view.showLoadingModal('Uninstalling...');

            await wizard.uninstall();
            setTimeout(() => {
                window.location.href = config.wizardUriBase
                    + 'index.html';
            }, 2000);

            break;
        default:
            throw new Error('Unknown page');
    }
}


setup();
