/**
 * This script is for analyzing the wizard's readiness on being a Premium App
 * It will check if default values/images have already been replaced with a different one.
 * It will also do checks on configuration values to make sure they are valid.
 */
const fs = require('fs').promises;
const path = require('path');
const colors = require('colors');

// File paths
const configFilePath = path.join(__dirname, 'docs/wizard/config/config.js')

// Constants to check
const defaultClientId = 'e7de8a75-62bb-43eb-9063-38509f8c21af';

// Message arrays
const passedMessages = [];
const warningMessages = [];
const criticalMessages = [];

// Like a Test library but much simpler
const Evaluator = {
  // Levels of importance
  'WARNING': 0,
  'CRITICAL': 1,

  /**
   * Check object if property exists
   * @param {Object} obj the object
   * @param {String} propertyName property name to check
   * @param {String} objectName for message, the name of the object
   * @param {String} additionalComment (optional) additional comments
   * @returns {Array} [bool, message]
   */
  propertyExists(obj, propertyName, objectName, additionalComment) {
    if (propertyName in obj) {
      return [true, `${propertyName} exists in ${objectName}. -- ${additionalComment}`]
    } else {
      return [false, `${propertyName} does not exist in ${objectName}. -- ${additionalComment}`]
    }
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
    if(value1 !== value2){
      return [true, `${value1Name} is not equal to ${value2} -- ${additionalComment}`]
    } else {
      return [false, `${value1Name} is equal to ${value2} -- ${additionalComment}`]
    }
  },

  /**
   * Evaluate the contents of the array
   * @param {*} importanceLevel Evaluator.WARNING or Evaluator.CRITICAL
   * @param {Array} evaluationArr array of tests 
   */
  evaluateArr(importanceLevel, evaluationArr) {
    evaluationArr.forEach(evaluation => {
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

function printMessages(){
  console.log(' --------- PASSED ----------'.blue);  
  if(passedMessages.length <= 0) console.log('none'.grey);
  passedMessages.forEach((m, i) => console.log(`${i + 1}. ${m}`.green));
  console.log();

  console.log(' --------- WARNING ----------'.blue);  
  if(warningMessages.length <= 0) console.log('none'.grey);
  warningMessages.forEach((m, i) => console.log(`${i + 1}. ${m}`.yellow));
  console.log();

  console.log(' --------- CRITICAL ----------'.blue);  
  if(criticalMessages.length <= 0) console.log('none'.grey);
  criticalMessages.forEach((m, i) => console.log(`${i + 1}. ${m}`.brightRed));
  console.log();

  console.log('NOTE: Some warnings may be acceptable especially if the evaluation is done prior to a Premium App demo.');
  console.log('If there are any questions, please contact your Genesys Developer Evangelist POC.');
  console.log();
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
 * Evaluate the config.json
 */
async function evaluateConfig(){
  let config = await getConfigObject();
  if(!config) throw new Error('Error on getting the config file.');

  Evaluator.evaluateArr(Evaluator.WARNING, [
    Evaluator.notEqual(config.clientID, defaultClientId, 'defaultClientId', 'clientID should be replaced with your own client ID.')
  ])

  Evaluator.evaluateArr(Evaluator.CRITICAL, [
    Evaluator.propertyExists(config, 'clientID', 'config', 'ClientID should exist')
  ])
}


async function evaluateAll(){
  await evaluateConfig();

  printMessages();
}


evaluateAll()