import config from '../config/config.js';
import view from './view.js';

// Module scripts
import roleModule from './modules/role.js';
import groupModule from './modules/group.js';
import appInstanceModule from './modules/app-instance.js';
import widgetInstanceModule from './modules/widget-instance.js';
import OAuthClientModule from './modules/oauth-client.js';
import dataTableModule from './modules/data-table.js';
import interactionWidgetModule from './modules/interaction-widget.js';
import wsDataActionsModule from './modules/ws-data-actions.js';
import gcDataActionsModule from './modules/gc-data-actions.js';
import widgetDeploymentModule from './modules/widget-deployment.js';
import openMessagingModule from './modules/open-messaging.js';
import byocCloudTrunkModule from './modules/byoc-cloud-trunk.js';
import audiohookModule from './modules/audiohook.js';
import eventBridgeModule from './modules/event-bridge.js';
// Module Post Custom Setup
import postCustomSetup from './modules/post-custom-setup.js';

// Add new modules here
// This will later be filtered in setup() to only use
// what's in the config
let modules = [
    roleModule,
    groupModule,
    appInstanceModule,
    widgetInstanceModule,
    OAuthClientModule,
    dataTableModule,
    interactionWidgetModule,
    wsDataActionsModule,
    gcDataActionsModule,
    widgetDeploymentModule,
    openMessagingModule,
    byocCloudTrunkModule,
    audiohookModule,
    eventBridgeModule
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
    } catch (e) {
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
    console.log(installedData);
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
        } catch (e) {
            console.error(e);
        }
    },

    /**
     * Installs all the modules
     * @returns {Promise<Object>} Status of post-custom-setup eg. { status: true, cause: 'it's a success' }
     */
    async install() {
        let creationPromises = [];
        let configurationPromises = [];
        let finalFunctionPromises = [];
        let creationResult = null;

        // Create all the items
        try {
            modules.forEach((module) => {
                let moduleProvisioningData = config.provisioningInfo[module.provisioningInfoKey];

                if (!moduleProvisioningData) return;

                creationPromises.push(
                    module.create(
                        view.setLoadingModal,
                        moduleProvisioningData
                    )
                );
            });
            creationResult = await Promise.all(creationPromises);
        } catch (e) {
            console.error('Error on creating objects');
            throw e;
        }

        // Configure all objects
        try {
            modules.forEach((module, i) => {
                installedData[module.provisioningInfoKey] = creationResult[i];
            });

            modules.forEach((module) => {
                configurationPromises.push(
                    module.configure(
                        view.setLoadingModal,
                        installedData,
                        userMe.id
                    )
                );
            });
            await Promise.all(configurationPromises);
        } catch (e) {
            console.error('Error on configuring objects');
            throw e;
        }

        // Run 'finally' methods
        view.setLoadingModal('Executing Final Steps...');
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
        } catch (e) {
            console.error('Error running finally on objects');
            throw e;
        }

        // Store the installedData in the integration's description
        try {
            const integrationId = await getIntegrationId();

            console.log(installedData);
            let integrationInstance = await integrationsApi.getIntegrationConfigCurrent(integrationId);
            let simplifiedData = simplifyInstalledData();

            // NOTE: Cuts off at 500 because of limit to integration notes.
            let installNotes = JSON.stringify(simplifiedData);
            if (installNotes.length > 500) {
                integrationInstance.notes = installNotes.substring(0, 500);
            } else {
                integrationInstance.notes = installNotes;
            }

            await integrationsApi.putIntegrationConfigCurrent(integrationId, { body: integrationInstance });
        } catch (e) {
            console.error('Error finalizing installedData');
            throw e;
        }

        // Execute Post Custom Setup (if requested)
        if (!config.enableCustomSetupStepAfterInstall) {
            return { status: true, cause: 'no post custom setup' };
        }

        return postCustomSetup.configure(
            view.setLoadingModal,
            installedData,
            userMe,
            client
        );
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
    },


    /**
     * Gets the simplified installed data for use in other modules
     * @returns {Object}
     */
    getSimpleInstalledData() {
        return simplifyInstalledData();
    },

    getInstalledData() {
        return installedData;
    },
}