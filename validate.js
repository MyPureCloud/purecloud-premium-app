/**
 * QUIDDITCH
 * 3.0.0
 * 
 * This script is for analyzing the wizard's readiness on being a Premium App
 * It will check if default values/images have already been replaced with a different one.
 * It will also do checks on configuration values to make sure they are valid.
 */
const chalk = require("chalk");
const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const path = require('path');
const HTMLParser = require('node-html-parser');
const css = require('css');
const md5 = require('md5');

// File paths
const configFilePath = path.join(__dirname, 'docs/wizard/config/config.js')
const languageDirPath = path.join(__dirname, 'docs/wizard/assets/languages')
const wizardPath = path.join(__dirname, 'docs/wizard')

// Default config constants to check
const defaultClientId = 'fd2ba742-446f-46c5-bbbc-1cad2f34ac3a';
const defaultIntegrationTypeId = 'premium-app-example';
const defaultViewPermission = 'integration:examplePremiumApp:view';
const defaultPrefix = 'PREMIUM_EXAMPLE_';

// Default language file text to check (en-us)
const defaultLanguage = {
  'txt-premium-app-name': 'Premium App',
  'txt-greeting-2': 'Welcome to the Premium App Example Application',
  'txt-not-available-message': 'We\'re sorry but your Genesys Cloud org does not have the Premium App Sample Product enabled. Please contact Genesys Cloud.',
}

// Default image md5 checksum hashes
const defaulImgHash = {
  footerImg: '3b3fc68be4e84a23b52ef2b9fcd359a8',
  loadingImg: '862df3c0557cc4e70b524f288eeeb8d9'
}

// Message arrays
const passedMessages = [];
const warningMessages = [];
const criticalMessages = [];

// The validation 'library'
const Validator = {
  // Levels of importance
  'WARNING': 0,
  'CRITICAL': 1,

  /**
   * Check object if property exists. If it's a string, then make sure that it's not blank.
   * @param {Object} obj the object
   * @param {String} propertyName property name to check
   * @param {String} objectName for message, the name of the object
   * @param {String} additionalComment (optional) additional comments
   * @returns {Array} [bool, message]
   */
  propertyExists(obj, propertyName, objectName, additionalComment) {
    if (propertyName in obj) {
      // If string, make sure it's not a blank string
      if(typeof obj[propertyName] == 'string' && obj[propertyName].trim().length <= 0){
        return Promise.resolve([false, `${propertyName} does not exist in ${objectName}. -- ${additionalComment}`])
      }

      return Promise.resolve([true, `${propertyName} exists in ${objectName}. -- ${additionalComment}`])
    }

    return Promise.resolve([false, `${propertyName} does not exist in ${objectName}. -- ${additionalComment}`])
  },

  /**
   * Check object if two values are not equal.
   * For checking if a default value has already been updated.
   * @param {any} value1 
   * @param {any} value2 
   * @param {String} value1Name for message name of value 1 
   * @param {String} additionalComment (optional) additional comments
   * @returns {Array} [bool, message]
   */
  notEqual(value1, value2, value1Name, additionalComment) {
    // value1 should not be null or undefined
    if(value1 === null || value1 === undefined){
      return [false, `${value1Name} does not exist`]
    }

    if(value1 !== value2){
      return Promise.resolve([true, `${value1Name} is not equal to '${value2.toString()}' -- ${additionalComment}`])
    } else {
      return Promise.resolve([false, `${value1Name} is equal to '${value2.toString()}' -- ${additionalComment}`])
    }
  },

  /**
   * Custom evaluation that returns true or false.
   * @param {Function} func fucntion that returns boolean
   * @param {String} passMessage 
   * @param {String} failMessage
   * @param {String} additionalComment (optional)
   * @returns {Array} [bool, message]
   */
  customEvaluation(func, passMessage, failMessage, additionalComment) {
    let result = func();
    if(typeof result != 'boolean') throw new Error('Func does not return boolean');
    
    if(result){
      return Promise.resolve([true, `${passMessage} -- ${additionalComment}`])
    } else {
      return Promise.resolve([false, `${failMessage} -- ${additionalComment}`])
    }
  },

  /**
   * Custom evaluation that returns true or false.
   * @param {Function} func async fucntion that returns Promise<boolean>
   * @param {String} passMessage 
   * @param {String} failMessage
   * @param {String} additionalComment (optional)
   * @returns {Array} [bool, message]
   */
  async customEvaluationAsync(func, passMessage, failMessage, additionalComment) {
    let result = await func();
    if(typeof result != 'boolean') throw new Error('Func resolution does not return boolean');
    
    if(result){
      return Promise.resolve([true, `${passMessage} -- ${additionalComment}`])
    } else {
      return Promise.resolve([false, `${failMessage} -- ${additionalComment}`])
    }
  },

  /**
   * Evaluate the contents of the array
   * @param {*} importanceLevel Validator.WARNING or Validator.CRITICAL
   * @param {Array} evaluationArr array of tests 
   */
  async evaluateArr(importanceLevel, evaluationArr) {
    const evaluationResults = await Promise.all(evaluationArr);

    evaluationResults.forEach(evaluation => {
      const result = evaluation[0];
      const message = evaluation[1];

      // If test passed, add message
      if(result){
        passedMessages.push(message);
        return;
      } 

      // For non-pass, determine level
      switch(importanceLevel){
        case this.WARNING:
          warningMessages.push(message);
          break;
        case this.CRITICAL:
          criticalMessages.push(message);
          break;
      }
    });
  }
}

// Globals
let config = null; // Config object of the config file

/**
 * Print the result messages
 */
function printMessages(){
  console.log(chalk.blue(' --------- PASSED ----------'));  
  if(!passedMessages || passedMessages.length <= 0) console.log(chalk.grey('none'));
  passedMessages.forEach((m, i) => console.log(chalk.green(`${i + 1}. ${m}`)));
  console.log();

  console.log(chalk.blue(' --------- WARNING ----------'));  
  if(!warningMessages || warningMessages.length <= 0) console.log(chalk.grey('none'));
  warningMessages.forEach((m, i) => console.log(chalk.yellow(`${i + 1}. ${m}`)));
  console.log();

  console.log(chalk.blue(' --------- CRITICAL ----------'));
  if(!criticalMessages || criticalMessages.length <= 0) console.log(chalk.grey('none'));
  criticalMessages.forEach((m, i) => console.log(chalk.redBright(`${i + 1}. ${m}`)));
  console.log();

  console.log(chalk.black.bgWhite.underline('NOTE: Some warnings are acceptable especially if the evaluation is done prior to a demo.'));
  console.log(chalk.black.bgWhite.underline('For production-ready wizards, every test should pass.'));
  console.log(chalk.black.bgWhite.underline('If there are any questions, please contact your Genesys Developer Evangelist POC.'));
  console.log();
}

/**
 * Print message to validation.log file
 */
function logToFile(){
  let log = '';
  let ts = Date.now();
  let dateTime = (new Date(ts)).toISOString();

  log += `${dateTime}\n\n`;

  log += ' --------- PASSED ----------\n';  
  if(passedMessages.length <= 0) log += 'none\n';
  passedMessages.forEach((m, i) => log += `${i + 1}. ${m}\n`);
  log += '\n';

  log += ' --------- WARNING ----------\n';  
  if(warningMessages.length <= 0) log += 'none\n';
  warningMessages.forEach((m, i) => log += `${i + 1}. ${m}\n`);
  log += '\n';

  log += ' --------- CRITICAL ----------\n';  
  if(criticalMessages.length <= 0) log += 'none\n';
  criticalMessages.forEach((m, i) => log += `${i + 1}. ${m}\n`);
  log += '\n';

  fs.writeFile('validation.log', log);
}

/**
 * Get the config file and return the contents as an object
 * @returns {Promise<Object|null>}
 */
async function getConfigObject(){
  let configObject = null;

  try {
    const configData = await fs.readFile(configFilePath);
    // remove 'export default'
    let configContent = configData.toString()
    configContent = configContent.substring(configContent.indexOf('{'));
    configObject = Function('return (' + configContent + ')')()
  } catch(e) {
    console.error(e);
    return null ;
  }

  return configObject;
}

/**
 * Validate the config.json
 */
async function validateConfig(){
  if(!config) throw new Error('Error on getting the config file.');

  // =================== WARNING LEVEL ===============
  await Validator.evaluateArr(Validator.WARNING, [
    // URLs
    Validator.customEvaluation(() => {
      let url = new URL(config.wizardUriBase);
      return url.hostname == 'localhost' ? false : true;
    }, 'wizardUriBase is not localhost', 'wizardUriBase is localhost', 'wizardUriBase should be a publically available URL'),
    Validator.customEvaluation(() => {
      let url = new URL(config.redirectURLOnWizardCompleted);
      return url.hostname == 'localhost' ? false : true;
    }, 'redirectURLOnWizardCompleted is not localhost', 'redirectURLOnWizardCompleted is localhost', 'redirectURLOnWizardCompleted should be a publically available URL'),

    // Integration Type ID
    Validator.notEqual(config.premiumAppIntegrationTypeId, defaultIntegrationTypeId, 'premiumAppIntegrationTypeId', 'Once integration is approved in AppFoundry, premiumAppIntegrationTypeId should match the provided unique ID.'),

    // Premium App View Permission
    Validator.notEqual(config.premiumAppViewPermission, defaultViewPermission, 'premiumAppViewPermission', 'Once integration is approved in AppFoundry, premiumAppViewPermission should match the new unique permission.'),
  ])

  // =================== CRITICAL LEVEL ===============
  await Validator.evaluateArr(Validator.CRITICAL, [
    // Client ID
    Validator.notEqual(config.clientID, defaultClientId, 'clientID', 'clientID should be replaced with your own client ID.'),
    Validator.propertyExists(config, 'clientID', 'config', 'ClientID should exist'),
    Validator.propertyExists(config, 'wizardUriBase', 'config', 'wizardUriBase should exist'),
    Validator.propertyExists(config, 'redirectURLOnWizardCompleted', 'config', 'redirectURLOnWizardCompleted should exist'),
    Validator.propertyExists(config, 'premiumAppIntegrationTypeId', 'config', 'premiumAppIntegrationTypeId should exist'),
    Validator.propertyExists(config, 'premiumAppViewPermission', 'config', 'premiumAppViewPermission should exist'),
    // checkInstallPermissions
    Validator.customEvaluation(() => {
        let installPermisison = config.checkInstallPermissions;
        if(!installPermisison) return false;

        if(['all', 'premium', 'wizard', 'none'].includes(installPermisison)) return true;

        return false;
      }, `${config.checkInstallPermissions} is valid value for checkInstallPermissions`,
      `${config.checkInstallPermissions} is not valid value for checkInstallPermissions`,
      `Valid values: all, premium, wizard, none`
    ),
    Validator.propertyExists(config, 'defaultPcEnvironment', 'config', 'defaultPcEnvironment should exist'),
    // TODO: Maybe test if pcEnvironment is valid value
    Validator.propertyExists(config, 'prefix', 'config', 'prefix should exist'),
    Validator.notEqual(config.prefix, defaultPrefix, 'prefix', 'Prefix should be updated to be unique'),
    Validator.propertyExists(config, 'provisioningInfo', 'config', 'provisioningInfo should exist'),
    Validator.propertyExists(config, 'defaultLanguage', 'config', 'defaultLanguage should exist'),
    Validator.propertyExists(config, 'availableLanguageAssets', 'config', 'availableLanguageAssets should exist'),
    // Check if defaultLanguage value is valid
    Validator.customEvaluation(() => {
        if(!config.defaultLanguage) return false;

        return Object.keys(config.availableLanguageAssets).includes(config.defaultLanguage)
      },
      `${config.defaultLanguage} is a valid language value`,
      `${config.defaultLanguage} is not available in the availableLanguageAssets`,
      `defaultLanguage should be valid`
    ),
    Validator.propertyExists(config, 'installPermissions', 'config', 'installPermissions should exist'),
    Validator.propertyExists(config, 'uninstallPermissions', 'config', 'uninstallPermissions should exist'),
    Validator.propertyExists(config, 'installScopes', 'config', 'installScopes should exist'),
    Validator.propertyExists(config, 'uninstallScopes', 'config', 'uninstallScopes should exist'),
    Validator.notEqual(config.enableUninstall, true, 'config.enableUninstall', 'Uninstall should be disabled for production'),
  ])
}

/**
 * Check if language files exist for the available languages in config
 */
async function validateLanguageFiles(){
  const toBeEvaluated = [];

  Object.keys(config.availableLanguageAssets).forEach(langKey => {
    toBeEvaluated.push(Validator.customEvaluationAsync(async () => {
        const langFilePath = path.join(languageDirPath, `${langKey}.json`);
        try {
          await fs.access(langFilePath, fsConstants.F_OK);
          return true;
        } catch(e) {
          return false
        }
      },
      `${langKey}.json exists`,
      `${langKey} is declared in config languages but ${langKey}.json does not exist.`,
      'Language file should exist'
    ))
  });

  await Validator.evaluateArr(Validator.CRITICAL, toBeEvaluated);
}

/**
 * Checks the properties of the language JSON file (en-us language only for now)
 * and evaluates if they were updated and no longer the default values.
 * If en-us does not exist or is not the default language, skip this entire section.
 * In that case, we'll assume that because they're using a different default language, that the text would 
 * already be their own.
 */
async function validateWizardText(){
  let langFileObject = null;

  // If en-us.json does not exist, skip
  try {
    const langFileData = await fs.readFile(path.join(languageDirPath, 'en-us.json'));
    langFileObject = JSON.parse(langFileData.toString());
  } catch(e) {
    console.log(e)
    return;
  }

  // If language default is not en-us, skip
  if(config.defaultLanguage != 'en-us') return;

  const forEvaluation = [];

  Object.keys(defaultLanguage).forEach(textKey => {
    forEvaluation.push(Validator.notEqual(langFileObject[textKey], defaultLanguage[textKey], 
      textKey, `text should be personalized`));
  })

  await Validator.evaluateArr(Validator.CRITICAL, forEvaluation)
}

/**
 * Evaluate images if they've been changed
 * Uses md5 checksum to check if the same as default image
 */
async function validateImages(){
  let htmlString = null;
  let htmlValue = null; // Parsed HTML
  let forEvaluation = [];

  // Footer Image
  // NOTE: Only checks in index.html. Pretty safe assumption that if partner updated the image, they'll
  // update it on all pages as it would be OBVIOUS if some pages have different logos.
  try {
    const htmlData = await fs.readFile(path.join(wizardPath, 'index.html'));
    htmlString = htmlData.toString();
    htmlValue = HTMLParser.parse(htmlString);
  } catch(e) {
    console.error(`Error in parsing index.html`)
    throw e;
  }

  const footerImgSrc = htmlValue.querySelector('#footer-logo').getAttribute('src');
  const footerImgData = await fs.readFile(path.join(wizardPath, footerImgSrc));
  forEvaluation.push(Validator.customEvaluation(() => {
      return md5(footerImgData) !== defaulImgHash.footerImg;
    },
    `Footer image has been replaced`,
    `Footer image is the default footer image`,
    `Personalize UI`
  ));

  // Loading Image
  const loaderImgSrc = htmlValue.querySelector('#loading-img').getAttribute('src');
  const loaderImgData = await fs.readFile(path.join(wizardPath, loaderImgSrc));
  forEvaluation.push(Validator.customEvaluation(() => {
      return md5(loaderImgData) !== defaulImgHash.loadingImg;
    },
    `"Loading" graphic has been replaced`,
    `"Loading" graphic is still the default svg`,
    `Personalize UI`
  ));

  await Validator.evaluateArr(Validator.CRITICAL, forEvaluation);
}

/**
 * Evaluate CSS values
 */
async function validateStyles(){
  let forEvaluation = [];
  let cssString = null;
  let cssValue = null;

  try {
    const cssData = await fs.readFile(path.join(wizardPath, 'styles/style.css'));
    cssString = cssData.toString();
    cssValue = css.parse(cssString);
  } catch(e) {
    console.error(`Error in parsing style.css`)
    throw e;
  }

  const titleColor = getStyleValue(cssValue, '.title', 'color');
  if (titleColor){
    forEvaluation.push(Validator.notEqual(titleColor, '#3B90AA', '.title CSS', 'Personalize CSS'));
  }
  const messageTitleColor = getStyleValue(cssValue, '.message-title', 'color');
  if (messageTitleColor){
    forEvaluation.push(Validator.notEqual(messageTitleColor, '#00AE9E', '.message-title color CSS', 'Personalize CSS'));
  }
  const buttonColor = getStyleValue(cssValue, 'button', 'background-color');
  if (buttonColor){
    forEvaluation.push(Validator.notEqual(buttonColor, '#00AE9E', 'button background-color CSS', 'Personalize CSS'));
  }

  await Validator.evaluateArr(Validator.WARNING, forEvaluation);
}


/**
 * Get the value of a selectors's property
 * @param {Object} ast Parsed object by 'css'
 * @param {String} selector CSS selector (not multiple)
 * @param {String} property property of the element
 * @returns {String|null} value of the selector's property
 * */ 
 function getStyleValue(ast, selector, property) {
  const cssRules = ast.stylesheet.rules;
  const rule = cssRules.find(rule => {
    if(!rule.selectors) return false;
    return rule.selectors.includes(selector);
  });
  if(!rule) return null;
  
  const declaration = rule.declarations.find(declaration => declaration.property == property);
  if(!declaration) return null;

  const value = declaration.value;
  if(!value) return null;

  return value;
}

async function validateAll(){
  config = await getConfigObject();
  
  const validations = [validateConfig(), 
    // validateLanguageFiles(), 
    // validateWizardText(),
    validateImages(),
    validateStyles()
  ]

  await Promise.all(validations)
  printMessages();
  logToFile();
}


console.log(chalk.black.bgCyanBright(`
=====================================================================
-----------------          QUIDDITCH                -----------------
-----------------      PREMIUM WIZARD VALIDATION    -----------------
-----------------          (v3.0.0)                 -----------------
=====================================================================
`));
validateAll();

/**
 * TODO: verify that div ids for 'pages' exist in index.html
 * TODO: Make sure wizarduribase hase / at the end of it
 * TODO: if post custom setup is enabled make sure translation keys exist.
*/
