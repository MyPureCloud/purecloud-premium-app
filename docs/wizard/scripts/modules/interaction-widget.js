import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing authetication clients based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getIntegrations = (pageNum) => {
        return integrationsApi.getIntegrations({
            pageSize: 100,
            pageNumber: pageNum
        })
            .then((data) => {
                data.entities
                    .filter(entity => {
                        return entity.integrationType.id == 'embedded-client-app-interaction-widget' &&
                            entity.name.startsWith(config.prefix);
                    }).forEach(integration =>
                        integrations.push(integration));

                if (data.nextUri) {
                    return _getIntegrations(pageNum + 1);
                }
            });
    }

    return _getIntegrations(1)
        .then(() => {
            return integrations;
        })
        .catch(e => console.error(e));
}

/**
 * Delete all existing PremiumApp instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc) {
    logFunc('Uninstalling Interaction Widgets...');

    return getExisting()
        .then((instances) => {
            let del_widgets = [];

            if (instances.length > 0) {
                instances.forEach(entity => {
                    del_widgets.push(integrationsApi.deleteIntegration(entity.id));
                });
            }

            return Promise.all(del_widgets);
        });
}

/**
 * Add Genesys Cloud instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
function create(logFunc, data) {
    let integrationPromises = [];
    let enableIntegrationPromises = [];
    let integrationsData = {};

    data.forEach((instance) => {
        let integrationBody = {
            body: {
                integrationType: {
                    id: 'embedded-client-app-interaction-widget'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push(
            integrationsApi.postIntegrations(integrationBody)
                .then((data) => {
                    logFunc('Created instance: ' + instance.name);
                    integrationsData[instance.name] = data;
                })
        );
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
function configure(logFunc, installedData, userId) {
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
                    sandbox: appInstanceInstall.sandbox || 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts',
                    permissions: appInstanceInstall.permissions || 'camera,microphone,geolocation',
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

        promisesArr.push(
            integrationsApi.putIntegrationConfigCurrent(
                appInstance.id,
                integrationConfig
            )
                .then((data) => {
                    logFunc('Configured instance: ' + appInstance.name);

                    let opts = {
                        body: {
                            intendedState: 'ENABLED'
                        }
                    };

                    return integrationsApi.patchIntegration(appInstance.id, opts)
                })
                .then((data) => logFunc('Enabled instance: ' + data.name))
                .catch((err) => console.error(err))
        );
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
