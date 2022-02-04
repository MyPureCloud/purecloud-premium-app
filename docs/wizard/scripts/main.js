import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';
import { PAGES } from './enums.js'
import { setPageLanguage, getTranslatedText } from './language-manager.js';

// Genesys Cloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance; 
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();

// Constants
const premiumAppIntegrationTypeId = config.premiumAppIntegrationTypeId;
const startPage = PAGES.INDEX_PAGE;

// Variables
let pcLanguage; // Initial language from query parameter | config.
let pcEnvironment;
let state; // State from implicit grant 
let currentPage = null;
let userMe = null;

/**
 * Get the query parameters and return an object 
 * @returns {Object} {language(?): ..., environment(?): ..., uninstall(?): ...}
 */
function getQueryParameters() {
  // Get Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  let language = urlParams.get(config.languageQueryParam);
  let environment = urlParams.get(config.genesysCloudEnvironmentQueryParam);
  let uninstall = urlParams.get('uninstall');
  let ret = {};

  if(language) ret.language = language;
  if(environment) ret.environment = environment;
  if(uninstall) ret.uninstall = uninstall;

  return ret;
}


/**
 * Redirect to the actual premium app
 */
function goToPremiumApp(){
  window.location.href = config.redirectURLOnWizardCompleted;
}

/**
 * Authenticate with Genesys Cloud
 * @returns {Promise}
 */
async function authenticateGenesysCloud() {
  const queryParams = getQueryParameters();

  // Determine Genesys Cloud environment
  pcEnvironment = queryParams.environment ? queryParams.environment : config.defaultPcEnvironment;
  client.setEnvironment(pcEnvironment);

  // Authenticate with Genesys Cloud and get the state
  client.setPersistSettings(true, premiumAppIntegrationTypeId); 
  const authData = await client.loginImplicitGrant(
    config.clientID, 
    `${config.wizardUriBase}index.html`, 
    { state: JSON.stringify(queryParams) }
  ); 
  state = JSON.parse(authData.state);
  console.log(state);

  // Set language
  pcLanguage = state.language ? state.language : config.defaultLanguage;
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
    console.log('PRODUCT UNAVAILABLE')
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
      if (!productAvailable) {
        showErrorPage(
          getTranslatedText('txt-product-not-available'),
          getTranslatedText('txt-not-available-message'),
          'txt-product-not-available',
          'txt-not-available-message'
        );
      } 
      
      // Check if there's an existing installation
      const integrationInstalled = await wizard.isExisting();
      if (integrationInstalled) {
        // If user is lacking permission, don't redirect to Premium App
        if (!userMe.authorization.permissions.includes(config.premiumAppViewPermission)) {
          showErrorPage(
            'Unauthorized',
            getTranslatedText('txt-missing-permissions'),
            null,
            'txt-missing-permissions',
            // Show the missing permissions in the error page
            () => {
              const container = document.createElement('ul');
              const entryElem = document.createElement('li');
              entryElem.style.display = 'flex';
              entryElem.style.justifyContent = 'center';
              entryElem.innerText = config.premiumAppViewPermission;
              container.appendChild(entryElem);

              return container;
            }
          );
        }
        goToPremiumApp();
      } 

      // If integration is not yet installed, check that the user has necessary install permissions
      if (config.checkInstallPermissions) {
        let missingPermissions = getMissingInstallPermissions();
        if (missingPermissions && missingPermissions.length > 0) {
          showErrorPage(
            'Unauthorized',
            getTranslatedText('txt-missing-permissions'),
            null,
            'txt-missing-permissions',
            // Show the missing permissions in the error page
            () => {
              const container = document.createElement('ul');
              
              missingPermissions.forEach(perm => {
                const entryElem = document.createElement('li');
                entryElem.style.display = 'flex';
                entryElem.style.justifyContent = 'center';
                entryElem.innerText = perm;
                container.appendChild(entryElem);
              });

              return container;
            }
          );
        }
      } 

      break;
    case PAGES.CUSTOM_SETUP:
      onCustomSetupEnter();
      break;
    case PAGES.INSTALL_DETAILS:
      break;
    case PAGES.DONE:
      setTimeout(() => {
        goToPremiumApp();
      }, 2000);

      break;
    case PAGES.UNINSTALL:
      alert('The uninstall button is for development purposes only. Remove this button before demo.');

      view.showLoadingModal('Uninstalling...');

      await wizard.uninstall();
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          window.history.replaceState(null, '', `${config.wizardUriBase}index.html`);
          resolve();
        }, 2000);
      });

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
 * Checks if the user has the necessary intall permissions
 * based on config.checkInstallPermissions
 * @returns {Array} Array of string. Missing permissions.
 */
function getMissingInstallPermissions() {
    const userPermissions = userMe.authorization.permissions;
    const permissionType = config.checkInstallPermissions;
    let missingPermissions = [];

    if (permissionType === 'premium') {
        if (!userPermissions.includes(config.premiumAppViewPermission)) {
            missingPermissions.push(config.premiumAppViewPermission);
        }
    } else if (permissionType === 'wizard' || permissionType === 'all') {
        let permissionsToCheck = [];

        if (permissionType === 'all') {
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
 * Go to the error page
 * @param {String} errorTitle title of the error
 * @param {String} errorMessage Full message for the error
 * @param {String} titleClass (Optional) CSS class to add to the element. (For use in on-the-fly translation)
 * @param {String} msgClass (Optional) CSS class to add to the element. (For use in on-the-fly translation)
 * @param {Function} extraContentFunc (Optional) Function that returns an element to be added to #additional-error-content
 */
function showErrorPage(errorTitle, errorMessage, titleClass, msgClass, extraContentFunc){
    view.setError(errorTitle, errorMessage, titleClass, msgClass, extraContentFunc);
    switchPage(PAGES.ERROR);
}

/**
 * This will run when the user enters the Custom Setup Page.
 * NOTE: Add your code for any custom initialization functionality here.
 */
function onCustomSetupEnter(){
  console.log('Custom Setup Page');
}

/**
 * Setup function
 * @returns {Promise}
 */
async function setup() {
    view.showLoadingModal();
    view.setupPage();

    try {
        // Authenticate and get current user
        await authenticateGenesysCloud();
        await setPageLanguage(pcLanguage);
        userMe = await usersApi.getUsersMe({ 'expand': ['organization', 'authorization'] });
        
        // Initialize the Wizard object
        wizard.setup(client, userMe);
        
        // Check if app is for uninstallation
        // ie. query parameter 'uninstall=true'
        if(state.uninstall === 'true') await switchPage(PAGES.UNINSTALL);
        
        // Load the Home page
        await switchPage(startPage);

        // View related
        setButtonEventListeners();
        view.showUserName(userMe.name);
        view.hideLoadingModal();
    } catch (e) {
        console.error(e);
    }
}

setup();
