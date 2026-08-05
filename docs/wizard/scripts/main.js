import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';
import { PAGES } from './enums.js'
import { setPageLanguage, localizePage, getSelectedLanguage, getTranslatedText } from './language-manager.js';
import { getResourcePath, beautifyModuleKey, getQueryParameters } from './utils.js'

// Genesys Cloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();
const authorizationApi = new platformClient.AuthorizationApi();

// Constants
const premiumAppIntegrationTypeId = config.premiumAppIntegrationTypeId;
const startPage = PAGES.INDEX_PAGE;

// Variables
let gcLanguage; // Initial language from query parameter | config.
let gcEnvironment;
let gcClientApp;
let gcHostOrigin;
let gcTargetEnv;
let state; // State from authentication 
let currentPage = null;
let userMe = null;

/**
 * Redirect to the actual premium app
 */
function goToPremiumApp() {
  let redirectUrl = config.redirectURLOnWizardCompleted;
  if (config.redirectURLWithParams && config.redirectURLWithParams === true) {
    let currentLanguage = getSelectedLanguage();
    // Manage legacy url using pcEnvironment for interpolation
    if (gcTargetEnv === 'default') {
      redirectUrl += `?${config.genesysCloudEnvironmentQueryParam}=${gcEnvironment}&${config.languageQueryParam}=${currentLanguage}`;
    } else {
      redirectUrl += `?${config.genesysCloudHostOriginQueryParam}=${gcHostOrigin}&${config.genesysCloudTargetEnvQueryParam}=${gcTargetEnv}&${config.languageQueryParam}=${currentLanguage}`;
    }
  }
  window.location.href = redirectUrl;
}

/**
 * Authenticate with Genesys Cloud
 * Returns false if this page is a popup auth callback that should close itself.
 * @returns {Promise<boolean>}
 */
async function authenticateGenesysCloud(appParams) {
  client.setEnvironment(gcEnvironment);
  client.setPersistSettings(true, premiumAppIntegrationTypeId);

  // After setPersistSettings, the SDK loads any stored token into client.authData.
  // If a valid token is already present, loginPKCEGrant will return it immediately
  // without redirecting, so no popup is needed.
  const isLoginRequired = !client.authData || !client.authData.accessToken;

  const urlParams = new URLSearchParams(window.location.search);
  // Popup context: opened by loginViaPopup() with ?authmode=popup, or returned from GC with authmode in state
  const isPopupContext = (window.opener !== null) &&
    (urlParams.get('authmode') === 'popup' || appParams.authmode === 'popup');

  if (isLoginRequired && window.self !== window.top && !isPopupContext) {
    // Running in an iframe and login is needed.
    // Surface index-page, swap #available for #login-required-section, and wait
    // for a user click — the click gesture is required for the browser to allow the popup.
    view.displayPage(PAGES.INDEX_PAGE);
    document.getElementById('available').style.display = 'none';
    document.getElementById('login-required-section').style.display = '';
    view.hideLoadingModal();

    await new Promise((resolve, reject) => {
      document.getElementById('btn-login-popup').addEventListener('click', async () => {
        document.getElementById('login-required-section').style.display = 'none';
        document.getElementById('available').style.display = '';
        view.showLoadingModal();
        try {
          await loginViaPopup(appParams);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, { once: true });
    });

    // The popup stored the token in localStorage via setPersistSettings;
    // calling loginPKCEGrant now finds it and returns without redirecting.
    const authData = await client.loginPKCEGrant(
      config.clientID,
      `${config.wizardUriBase}index.html`,
      { state: JSON.stringify(appParams) }
    );
    state = JSON.parse(authData.state);
  } else {
    // Standalone mode, or this IS the popup window doing the PKCE flow.
    // Encode authmode=popup in the state so it survives the GC redirect.
    const authData = await client.loginPKCEGrant(
      config.clientID,
      `${config.wizardUriBase}index.html`,
      { state: JSON.stringify({ ...appParams, authmode: 'popup' }) }
    );
    state = JSON.parse(authData.state);

    if (isPopupContext && window.opener) {
      // Auth is done. Notify the parent iframe and close this popup.
      window.opener.postMessage({ type: 'gc-auth-complete' }, window.location.origin);
      window.close();
      return false;
    }
  }

  console.log(state);
  return true;
}

/**
 * Open a popup window that performs the full PKCE login flow.
 * The popup stores the token via setPersistSettings so the iframe can read it.
 * @param {Object} appParams
 * @returns {Promise<void>}
 */
function loginViaPopup(appParams) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    params.set('authmode', 'popup');
    if (appParams.language)    params.set(config.languageQueryParam, appParams.language);
    if (appParams.environment) params.set(config.genesysCloudEnvironmentQueryParam, appParams.environment);
    if (appParams.hostOrigin)  params.set(config.genesysCloudHostOriginQueryParam, appParams.hostOrigin);
    if (appParams.targetEnv)   params.set(config.genesysCloudTargetEnvQueryParam, appParams.targetEnv);

    const popupUrl = `${config.wizardUriBase}index.html?${params.toString()}`;
    const popup = window.open(popupUrl, 'gc-auth-popup', 'width=500,height=700,left=200,top=100');

    if (!popup) {
      reject(new Error('Authentication popup was blocked. Please allow popups for this site.'));
      return;
    }

    function onAuthMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'gc-auth-complete') {
        window.removeEventListener('message', onAuthMessage);
        resolve();
      }
    }

    window.addEventListener('message', onAuthMessage);
  });
}

/**
 * Checks if the Genesys Cloud org has the premium app product enabled
 * @returns {Promise}
 */
async function validateProductAvailability() {
  let productAvailable = false;

  // Internal recursive function for calling 
  // next pages (if any) of the integration types
  let _getIntegrationsTypes = async (pageNum) => {
    let data = await integrationsApi.getIntegrationsTypes({
      pageSize: 100,
      pageNumber: pageNum
    });

    let productIntegrationType = data.entities.find(instance => instance.id == premiumAppIntegrationTypeId);

    if (productIntegrationType) {
      console.log('PRODUCT AVAILABLE');
      return true;
    }

    if (data.nextUri) {
      return _getIntegrationsTypes(pageNum + 1);
    } else {
      console.log('PRODUCT UNAVAILABLE');
      return false;
    }
  }

  try {
    productAvailable = await _getIntegrationsTypes(1);
  } catch (e) {
    console.error(e);
    console.log('PRODUCT UNAVAILABLE');
  }

  return productAvailable;
}


/**
 * Checks if the Genesys Cloud org has the BYOC Cloud Add-On enabled
 * @returns {Promise}
 */
async function validateBYOCAvailability() {
  let byocAvailable = false;
  try {
    let products = await authorizationApi.getAuthorizationProducts();
    // Check if "byoc" is listed - return true or false
    for (let product of products.entities) {
      if (product.id === 'byoc') {
        byocAvailable = true;
        console.log('BYOC AVAILABLE')
        break;
      }
    }
  } catch (e) {
    console.log('BYOC UNAVAILABLE')
  }
  return byocAvailable;
}

/**
 * Navigate to a new page
* @param {Enum.PAGES} targetPage the target page
 */
async function switchPage(targetPage) {
  currentPage = targetPage;
  console.log(`Going to page: ${currentPage}`);

  view.displayPage(targetPage);
  switch (targetPage) {
    case PAGES.INDEX_PAGE:
      await onInitialPageEnter();
      break;
    case PAGES.CUSTOM_SETUP:
      await onCustomSetupEnter();
      break;
    case PAGES.INSTALL_DETAILS:
      await onInstallDetailsEnter();
      break;
    case PAGES.DONE:
      await onInstallationSummaryEnter();
      break;
    case PAGES.UNINSTALL:
      alert('The uninstall button is for development purposes only. Remove this button before demo.');

      view.showLoadingModal('Uninstalling...');

      await wizard.uninstall();
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          let currentLanguage = getSelectedLanguage();
          // Manage legacy url using pcEnvironment for interpolation
          if (gcTargetEnv === 'default') {
            window.location.href = `${config.wizardUriBase}index.html?${config.genesysCloudEnvironmentQueryParam}=${gcEnvironment}&${config.languageQueryParam}=${currentLanguage}`;
          } else {
            window.location.href = `${config.wizardUriBase}index.html?${config.genesysCloudHostOriginQueryParam}=${gcHostOrigin}&${config.genesysCloudTargetEnvQueryParam}=${gcTargetEnv}&${config.languageQueryParam}=${currentLanguage}`;
          }
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
function setEventListeners() {
  const nextButtons = Array.from(document.getElementsByClassName('btn-next'));
  const prevButtons = Array.from(document.getElementsByClassName('btn-prev'));
  const installButton = document.getElementById('btn-install');
  const goToAppButton = document.getElementById('btn-goto-app');

  // Buttons
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switch (currentPage) {
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

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switch (currentPage) {
        case PAGES.CUSTOM_SETUP:
          switchPage(PAGES.INDEX_PAGE);
          break;
        case PAGES.INSTALL_DETAILS:
          if (config.enableCustomSetupPageBeforeInstall) {
            switchPage(PAGES.CUSTOM_SETUP);
          } else {
            switchPage(PAGES.INDEX_PAGE);
          }
          break;
      }
    })
  });

  if (installButton) {
    installButton.addEventListener('click', () => {
      install();
    })
  }

  if (goToAppButton) {
    goToAppButton.addEventListener('click', () => {
      goToPremiumApp();
    })
  }

  // Progreess bar animation
  // Note: Disable steps click
  /*
  $('.steps').on('click', '.step--active', function() {
    $(this).removeClass('step--incomplete').addClass('step--complete');
    $(this).removeClass('step--active').addClass('step--inactive');
    $(this).next().removeClass('step--inactive').addClass('step--active');
  });
  
  $('.steps').on('click', '.step--complete', function() {
    $(this).removeClass('step--complete').addClass('step--incomplete');
    $(this).removeClass('step--inactive').addClass('step--active');
    $(this).nextAll().removeClass('step--complete').addClass('step--incomplete');
    $(this).nextAll().removeClass('step--active').addClass('step--inactive');
  });
  */
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
function showErrorPage(errorTitle, errorMessage, titleClass, msgClass, extraContentFunc) {
  view.setError(errorTitle, errorMessage, titleClass, msgClass, extraContentFunc);
  switchPage(PAGES.ERROR);
}

/**
 * Start the wizard installation
 */
async function install() {
  view.showLoadingModal('Installing..');
  try {
    const customSetupStatus = await wizard.install();

    // Check if Post Custom Setup is successful
    if (customSetupStatus.status) {
      switchPage(PAGES.DONE);
    } else {
      // Show error from post custom setup
      showErrorPage(
        getTranslatedText('txt-post-custom-setup-failure'),
        getTranslatedText('txt-failure-backend'),
        'txt-post-custom-setup-failure',
        'txt-failure-backend',
        () => {
          const container = document.createElement('div');
          container.innerHTML = `
            <p>
              <b>
                <span class="txt-details-failure-backend">${getTranslatedText('txt-details-failure-backend')}:</span>
              </b>
              <i>
                <span class="details-failure-backend">${customSetupStatus.cause}</span>
              </i>
            </p>
            <p>
              <span class="txt-resolve-backend">
                ${getTranslatedText('txt-resolve-backend')}
              </span>
            </p>
            `;
          return container;
        }
      );
    }
  } catch (e) {
    console.error(e);
    // Show error page on any error during installation
    showErrorPage(
      getTranslatedText('txt-installation-error'),
      `\n ${e.name} - ${e.message}. \n ${e.stack ? e.stack : ''}`,
      'txt-installation-error'
    );
  }
  view.hideLoadingModal();
}

/**
 * This will run when the user enters home page
 */
async function onInitialPageEnter() {
  // Check product availability
  const productAvailable = await validateProductAvailability();
  if (!productAvailable) {
    showErrorPage(
      getTranslatedText('txt-product-not-available'),
      getTranslatedText('txt-not-available-message'),
      'txt-product-not-available',
      'txt-not-available-message'
    );
    return;
  }

  if (config.checkProductBYOC === true) {
    const byocAvailable = await validateBYOCAvailability();
    if (!byocAvailable) {
      showErrorPage(
        getTranslatedText('txt-byoc-not-available'),
        getTranslatedText('txt-no-byoc-message'),
        'txt-byoc-not-available',
        'txt-no-byoc-message'
      );
      return;
    }
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
      return;
    }
    goToPremiumApp();
  } else {
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
        return;
      }
    }
  }
}

async function onInstallDetailsEnter() {
  if (config.enableDynamicInstallSummary == true) {
    let messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    let modulesToInstall = Object.keys(config.provisioningInfo);
    if (config.enableCustomSetupStepAfterInstall === true) {
      modulesToInstall.push('post-custom-setup');
    }
    let moduleIndex = 0;
    modulesToInstall.forEach(modKey => {
      moduleIndex++;
      let messageDiv = document.createElement("div");
      messageDiv.className = "message";

      let messageTitle = document.createElement("div");
      messageTitle.className = "message-title";
      messageTitle.innerHTML = "<span>" + moduleIndex.toString() + ". </span><span class='txt-create-" + modKey + "'></span><hr>";
      messageDiv.appendChild(messageTitle);

      let messageContent = document.createElement("div");
      messageContent.className = "message-content";
      messageContent.innerHTML = "<div><span class='txt-create-" + modKey + "-msg'></span></div>";
      messageDiv.appendChild(messageContent);

      messagesDiv.appendChild(messageDiv);
    });

    localizePage();
  }
}

/**
 * This will run after the installation and upon entering the PAGES.DONE page.
 * Show the summary of the provisioned items.
 */
async function onInstallationSummaryEnter() {
  const installedData = wizard.getInstalledData();
  const dataKeys = Object.keys(installedData);
  const simpleInstalledData = wizard.getSimpleInstalledData();

  // Show the results in the page
  // TODO: Make this more pretty
  const summaryContainer = document.getElementById('summary-container');
  if (!summaryContainer) return;

  // Create an array that contains HTML string per object category 
  const summaryElems = dataKeys.map((category, i) => {
    let childElemsString = '';

    const installedObjects = installedData[category];
    const installedObjectsKeys = Object.keys(installedObjects);
    // Build the children elements for the category
    installedObjectsKeys.forEach(objKey => {
      const obj = installedObjects[objKey]
      const resourcePath = getResourcePath(gcHostOrigin, category, obj.id)

      if (resourcePath) {
        childElemsString += `
          <p><a class="provisioned-link" href="${resourcePath}" target="_blank">${config.prefix}${objKey}</a></p>
        `;
      } else {
        childElemsString += `
          <p>${config.prefix}${objKey}</p>
        `;
      }
      // Special treatment for OAuth Client and Widget Deployment
      if (category === 'oauth-client') {
        childElemsString += `
          <span><b>Grant Type: </b>${obj.authorizedGrantType}</span>
          <br/>
          <span><b>Client ID: </b>${obj.id}</span>
          <br/>
          <span><b>Client Secret: </b>${obj.secret}</span>
          <br/><br/>
        `;
      }
      if (category === 'widget-deployment') {
        childElemsString += `
        <span><b>Deployment Key: </b>${obj.id}</span>
        <br/>
        <span><b>Org ID: </b>${userMe.organization.id}</span>
        <br/><br/>
      `;
      }
      if (category === 'open-messaging') {
        childElemsString += `
        <span><b>Integration ID: </b>${obj.id}</span>
        <br/><br/>
      `;
      }
    });

    const template = `
      <div id="installation-summary-${dataKeys[i]}" class="install-summary-category">
        <h3>${beautifyModuleKey(category)}</h3>
        ${childElemsString}
      </div>
    `

    return template;
  });

  // Add the elements
  summaryElems.forEach(summary => {
    summaryContainer.innerHTML += summary;
  })

  // Add the raw installation data to the textarea
  const textAreaSummary = document.getElementById('summary-raw-data');
  if (!textAreaSummary) return;
  if (config.displaySummarySimplifiedData === true) {
    textAreaSummary.value = JSON.stringify(simpleInstalledData);
  } else {
    textAreaSummary.style.display = 'none';
  }
}

/**
 * This will run when the user enters the Custom Setup Page.
 * NOTE: Add your code for any custom initialization functionality here.
 */
async function onCustomSetupEnter() {
  console.log('Custom Page Here');
}

/**
 * Setup function
 * @returns {Promise}
 */
async function setup() {
  view.showLoadingModal();
  view.setupPage();

  try {
    // Retrieve URL Query Params or Hash
    let appParams = getQueryParameters();

    // Determine Genesys Cloud environment
    if (appParams.hostOrigin && appParams.targetEnv) {
      try {
        gcHostOrigin = appParams.hostOrigin;
        gcTargetEnv = appParams.targetEnv;
        var ClientApp = window.purecloud.apps.ClientApp;
        /*
        // parsing query params works on first index.html invocation, but not on redirect (encode in state parameter)
        gcClientApp = new ClientApp({
          gcHostOriginQueryParam: config.genesysCloudHostOriginQueryParam,
          gcTargetEnvQueryParam: config.genesysCloudTargetEnvQueryParam
        });
        */
        gcClientApp = new ClientApp({
          gcHostOrigin: gcHostOrigin,
          gcTargetEnv: gcTargetEnv
        });
        gcEnvironment = gcClientApp.gcEnvironment;
      } catch (err) {
        // if host origin and target env cannot be resolved
        // try to override with environment query parameter if present
        gcEnvironment = appParams.environment ? appParams.environment : config.defaultGcEnvironment;
        gcHostOrigin = 'https://apps.' + gcEnvironment;
        gcTargetEnv = 'default';
      }
    } else {
      // Manage legacy url using pcEnvironment for interpolation
      gcEnvironment = appParams.environment ? appParams.environment : config.defaultGcEnvironment;
      gcHostOrigin = 'https://apps.' + gcEnvironment;
      gcTargetEnv = 'default';
    }

    // Set language
    gcLanguage = appParams.language ? appParams.language : config.defaultLanguage;
    await setPageLanguage(gcLanguage);

    if (appParams.error === true) {
      if (appParams.errorCode != "access_denied") {
        showErrorPage(
          getTranslatedText('txt-error-access-invalid'),
          getTranslatedText('txt-error-access-invalid-msg'),
          'txt-error-access-invalid',
          'txt-error-access-invalid-msg',
          () => {
            const container = document.createElement('ul');
            const entryElem = document.createElement('li');
            entryElem.style.display = 'flex';
            entryElem.style.justifyContent = 'center';
            entryElem.innerText = "\"" + appParams.errorDescription + "\"";
            container.appendChild(entryElem);

            return container;
          }
        );
      } else {
        showErrorPage(
          getTranslatedText('txt-error-access-denied'),
          getTranslatedText('txt-error-access-denied-msg'),
          'txt-error-access-denied',
          'txt-error-access-denied-msg',
          () => {
            const container = document.createElement('ul');
            const entryElem = document.createElement('li');
            entryElem.style.display = 'flex';
            entryElem.style.justifyContent = 'center';
            entryElem.innerText = "\"" + appParams.errorDescription + "\"";
            container.appendChild(entryElem);

            return container;
          }
        );
      }
      view.hideLoadingModal();
      return;
    }

    // Authenticate and get current user
    const continueSetup = await authenticateGenesysCloud(appParams);
    if (!continueSetup) return; // This page is a popup that just closed itself after auth
    userMe = await usersApi.getUsersMe({ 'expand': ['organization', 'authorization'] });

    // Initialize the Wizard object
    wizard.setup(client, userMe);

    // Check if app is for uninstallation
    // ie. query parameter 'uninstall=true'
    if (config.enableUninstall && state.uninstall === 'true') await switchPage(PAGES.UNINSTALL);

    // Load the Home page
    await switchPage(startPage);

    // View related
    setEventListeners();
    view.showUserName(userMe.name);
    view.hideLoadingModal();
  } catch (e) {
    console.error(e);
  }
}


document.addEventListener('DOMContentLoaded', function () {
  setup();
});




