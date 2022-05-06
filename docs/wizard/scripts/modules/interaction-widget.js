import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing authetication clients based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
async function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getIntegrations = async (pageNum) => {
        let data = await integrationsApi.getIntegrations({
                            pageSize: 100,
                            pageNumber: pageNum
                        });
        data.entities
            .filter(entity => {
                return entity.integrationType.id == 'embedded-client-app-interaction-widget' &&
                    entity.name.startsWith(config.prefix);
            }).forEach(integration =>
                integrations.push(integration));

        if (data.nextUri) {
            return _getIntegrations(pageNum + 1);
        }
    }

    try {
        await _getIntegrations(1);
    } catch(e) {
        console.error(e)
    }

    return integrations;
}

/**
 * Delete all existing PremiumApp instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Interaction Widgets...');

    let instances = await getExisting();

    let del_widgets = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_widgets.push(integrationsApi.deleteIntegration(entity.id));
        });
    }

    return Promise.all(del_widgets);
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
                    id: 'embedded-client-app-interaction-widget'
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

    return Promise.all(integrationPromises)
        .then(() => integrationsData);
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
async function configure(logFunc, installedData, userId) {
    let instanceInstallationData = config.provisioningInfo['interaction-widget'];
    let appInstancesData = installedData['interaction-widget'];

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
                    sandbox: appInstanceInstall.sandbox || 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
                    permissions: appInstanceInstall.permissions || 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
                    queueIdFilterList: [],
                    communicationTypeFilter: appInstanceInstall
                        .communicationTypeFilter ?
                        appInstanceInstall.communicationTypeFilter :
                        '',
                    groups: appInstanceInstall
                        .groups.map((groupName) =>
                            installedData.group[groupName].id)
                        .filter(g => g != undefined)
                },
                advanced: appInstanceInstall.advanced || {},
                notes: appInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        promisesArr.push((async () => { 
            try {
                await integrationsApi.putIntegrationConfigCurrent(appInstance.id, integrationConfig);
                logFunc('Configured instance: ' + appInstance.name);

                let opts = {
                    body: {
                        intendedState: 'ENABLED'
                    }
                };

                let data = await integrationsApi.patchIntegration(appInstance.id, opts)
                
                logFunc('Enabled instance: ' + data.name);
            } catch(e) {
                console.error(e);
            }
        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'interaction-widget',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
