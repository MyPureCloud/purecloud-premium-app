import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
 * Get existing apps based on the prefix
 * @returns {Promise.<Array>} Genesys Cloud Integrations
 */
async function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getIntegrations = async (pageNum) => {
        let data = await integrationsApi.getIntegrations({pageSize: 100, pageNumber: pageNum})
        data.entities
            .filter(entity => {
                return entity.integrationType.id == config.premiumAppIntegrationTypeId &&
                    entity.name.startsWith(config.prefix);
            }).forEach(integration =>
                integrations.push(integration));

        if (data.nextUri) {
            return _getIntegrations(pageNum + 1);
        }
    }

    try{
        await _getIntegrations(1)
    } catch(e) {
        console.error(e);
    }

    return integrations;
}

/**
 * Delete all existing PremiumApp instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Other App Instances...');

    let instances = await getExisting();
    let del_apps = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_apps.push(integrationsApi.deleteIntegration(entity.id));
        });
    }

    return Promise.all(del_apps);
}

/**
 * Add Genesys Cloud instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
async function create(logFunc, data) {
    let integrationPromises = [];
    let integrationsData = {};

    data.forEach((instance) => {
        let integrationBody = {
            body: {
                name: config.prefix + instance.name,
                integrationType: {
                    id: config.premiumAppIntegrationTypeId
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push((async () => {
            let result = await integrationsApi.postIntegrations(integrationBody);
            logFunc('Created instance: ' + instance.name);
            integrationsData[instance.name] = result;
        })());
    });

    await Promise.all(integrationPromises);
    return integrationsData;
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
async function configure(logFunc, installedData, userId) {
    let instanceInstallationData = config.provisioningInfo['app-instance'];
    let appInstancesData = installedData['app-instance'];

    let promisesArr = [];

    Object.keys(appInstancesData).forEach((instanceKey) => {
        let appInstance = appInstancesData[instanceKey];
        let appInstanceInstall = instanceInstallationData
            .find((a) => a.name == instanceKey);

        let integrationConfig = {
            body: {
                name: config.prefix + instanceKey,
                version: 1,
                properties: {
                    url: appInstanceInstall.url,
                    displayType: appInstanceInstall.type || 'standalone',
                    featureCategory: '',
                    groupFilter: appInstanceInstall
                        .groups.map((groupName) =>
                            installedData.group[groupName].id)
                        .filter(g => g != undefined)
                },
                advanced: appInstanceInstall.advanced || {},
                notes: appInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        // Manage Wizard during development, before approval, using premiumAppIntegrationTypeId='premium-app-example' (sandbox and permissions in request schema)
        // and in production, after approval, using premiumAppIntegrationTypeId='premium-app-vendorABC' (sandbox and permissions not allowed in request schema)
        if (config.premiumAppIntegrationTypeId === 'premium-app-example') {
            integrationConfig.body.properties.sandbox = appInstanceInstall.sandbox || 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads';
            integrationConfig.body.properties.permissions = appInstanceInstall.permissions || 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen';
        }

        promisesArr.push((async () => {
            try {
                await integrationsApi.putIntegrationConfigCurrent(appInstance.id, integrationConfig);

                logFunc('Configured instance: ' + appInstance.name);

                let opts = {
                    body: {
                        intendedState: 'ENABLED'
                    }
                };
                
                const patchData = await integrationsApi.patchIntegration(appInstance.id, opts);
                logFunc('Enabled instance: ' + patchData.name);
            } catch(e) {
                console.error(e);
            } 
        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'app-instance',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
