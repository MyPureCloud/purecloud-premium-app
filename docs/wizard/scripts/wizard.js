import config from '../config/config.js';
import view from './view.js';

// Module scripts
import roleModule from './modules/role.js';
import groupModule from './modules/group.js';
import appInstanceModule from './modules/app-instance.js';
import OAuthClientModule from './modules/oauth-client.js';
import dataTableModule from './modules/data-table.js';
import interactionWidget from './modules/interaction-widget.js';
import wsDataActions from './modules/ws-data-actions.js';
import widgetDeployment from './modules/widget-deployment.js';
// Module Post Custom Setup
import postCustomSetup from './modules/post-custom-setup.js';

// Add new modules here
// This will later be filtered in setup() to only use
// what's in the config
let modules = [
    roleModule,
    groupModule,
    appInstanceModule,
    OAuthClientModule,
    dataTableModule,
    interactionWidget,
    wsDataActions,
    widgetDeployment
];

const jobOrder = config.provisioningInfo;

// Genesys Cloud
const platformClient = require('platformClient');
let client = null;
const integrationsApi = new platformClient.IntegrationsApi();


// Global data
let userMe = null; // Genesys Cloud user object
let integrationId = ''; // Integration instance ID
let installedData = {}; // Everything that's installed after

/**
 * Get ID of the integration so the description can be edited containing
 * the installed data. Currently gets the first one from the result.
 * Does not support multiple integration instances yet.
 * @returns {Promise<string|null>} id of the premium app integration instance
 */
async function getIntegrationId() {
    try {
        const clientApps = await integrationsApi.getIntegrationsClientapps({ pageSize: 1000 });
        let instances = clientApps.entities;
        let pa_instance = instances.find(instance => instance.integrationType.id == config.premiumAppIntegrationTypeId);

        return pa_instance ? pa_instance.id : null;
    } catch(e) {
        throw e;
    }
}

/**
 * Get's all the currently installed items as defined in the
 * job order.
 * @returns {Promise<Array>} Array of the installed objects
 */
function getInstalledObjects() {
    let promiseArr = [];

    modules.forEach((module) => {
        if (jobOrder[module.provisioningInfoKey]) {
            promiseArr.push(module.getExisting());
        }
    });

    return Promise.all(promiseArr);
}

/**
 * Run against the global installedData so it will just contain id and
 * name of the installed Genesys Cloud objects
 * @returns {Object} SImplified object data of installed items
 */
function simplifyInstalledData() {
    let result = {};
    Object.keys(installedData).forEach(modKey => {
        let modItems = installedData[modKey];
        result[modKey] = {};

        Object.keys(modItems).forEach(itemName => {
            let itemVal = modItems[itemName];
            result[modKey][itemName] = {
                id: itemVal.id,
                name: itemVal.name,
            }
        })
    });

    return result;
}

export default {
    /**
     * Setup the wizard with references
     * @param {Object} pcClient Genesys Cloud API Client
     * @param {Object} user Genesys Cloud user object
     * @param {String} instanceId ID of the working integration instance 
     */
    setup(pcClient, user) {
        client = pcClient;
        userMe = user;

        // Use only modules in provisioning info
        modules = modules.filter((module) => {
            return Object.keys(config.provisioningInfo)
                .includes(module.provisioningInfoKey);
        });
    },

    getInstalledObjects: getInstalledObjects,

    /**
     * Checks if any installed objects are still existing
     * @returns {Promise<boolean>}
     */
    async isExisting() {
        let exists = false;

        try {
            const installedObjects = await getInstalledObjects();
            console.log(installedObjects);

            installedObjects.forEach(item => {
                // if it's just an array
                exists = item.length > 0 ? true : exists;
            });
            
            return exists;
        } catch(e) {
            console.error(e);
        }
    },

    /**
     * Installs all the modules
     * @returns {Promise<Array>} array of finally function resolves
     */
    async install() {
        let creationPromises = [];
        let configurationPromises = [];
        let finalFunctionPromises = [];

        // Create all the items
        try {
            modules.forEach((module) => {
                let moduleProvisioningData = config.provisioningInfo[module.provisioningInfoKey];

                if (!moduleProvisioningData) return;

                creationPromises.push(
                    module.create(
                        view.showLoadingModal,
                        moduleProvisioningData
                    )
                );
            });
            const creationResult = await Promise.all(creationPromises);
        } catch(e) {
            console.error('Error on creating objects');
            console.error(e);
        } 

        // Configure all objects
        try {
            modules.forEach((module, i) => {
                installedData[module.provisioningInfoKey] = creationResult[i];
            });

            modules.forEach((module) => {
                configurationPromises.push(
                    module.configure(
                        view.showLoadingModal,
                        installedData,
                        userMe.id
                    )
                );
            });
            await Promise.all(configurationPromises);
        } catch(e) {
            console.error('Error on configuring objects');
            console.error(e);
        }

        // Run 'finally' methods
        view.showLoadingModal('Executing Final Steps...');
        try {
            // Loop through all items with finally 
            Object.keys(config.provisioningInfo).forEach(key => {
                let provisionItems = config.provisioningInfo[key];
                provisionItems.forEach((item) => {
                    if (item.finally) {
                        finalFunctionPromises.push(
                            item.finally(installedData[key][item.name])
                        );
                    }
                })
            });
            await Promise.all(finalFunctionPromises);
        } catch(e) {
            console.error('Error running finally on objects');
            console.error(e);
        }

        // Store the installedData in the integration's description
        try {
            const integrationId = await getIntegrationId();

            console.log(installedData);
            let integrationInstance = await integrationsApi.getIntegrationConfigCurrent(integrationId);
            let simplifiedData = simplifyInstalledData();

            integrationInstance.notes = JSON.stringify(simplifiedData);

            await integrationsApi.putIntegrationConfigCurrent(integrationId, { body: integrationInstance });

            // Execute Post Custom Setup (if requested)
            if (config.enableCustomSetupStepAfterInstall) {
                return postCustomSetup.configure(
                    view.showLoadingModal,
                    installedData,
                    userMe,
                    client
                );
            } else {
                return { status: true, cause: 'no post custom setup' };
            }
        } catch(e) {
            console.error('Error finalizing installeData');
            console.error(e);
        }
    },

    /**
     * Uninstall all the modules
     * @returns {Promise<Array>} module remove promises
     */
    uninstall() {
        let promiseArr = [];

        modules.forEach((module) => {
            promiseArr.push(
                module.remove(view.showLoadingModal)
            );
        });

        return Promise.all(promiseArr);
    }
}