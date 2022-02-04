import config from '../config/config.js';
import { GC_OBJECT_BASE_URL_MAP } from './enums.js';

/**
 * Build the complete URL for the resource. Used in the summary page
 * @param {String} environment GC environment. eg mypurecloud.com
 * @param {String} category provisioningKey of the module
 * @param {String} id id of the actual GC object
 * @returns {String|null} path to the resource.
 */
export function getResourcePath(environment, category, id){
    const categoryPath = GC_OBJECT_BASE_URL_MAP[category];
    if(!categoryPath) return null;
    
    return `https://apps.${environment}${categoryPath}${id}`;
}

/**
 * Returns a display version of the GC object module. eg. data-table -> Data Tables
 * Used for summary page
 * @param {String} key the exported provisioningKey of the module
 */
export function beautifyModuleKey(key){
    const words = key.split('-');
    const capitalizedWords = words.map(word => {
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
    return capitalizedWords.join(' ') + 's'; 
}


/**
 * Get the query parameters and return an object 
 * @returns {Object} {language(?): ..., environment(?): ..., uninstall(?): ...}
 */
export function getQueryParameters() {
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
