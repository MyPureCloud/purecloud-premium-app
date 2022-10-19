import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing Genesys Cloud AWS EventBridge integrations based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud AWS EventBridge integrations
*/
async function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getIntegrations = async (pageNum) => {
        let data = await integrationsApi.getIntegrations({
            pageSize: 100,
            pageNumber: pageNum,
            expand: ['config.current']
        });
        data.entities
            .filter(entity => {
                return entity.integrationType.id == 'amazon-eventbridge-source' &&
                    entity.name.startsWith(config.prefix);
            }).forEach(integration =>
                integrations.push(integration));

        if (data.nextUri) {
            return _getIntegrations(pageNum + 1);
        }
    }

    try {
        await _getIntegrations(1);
    } catch (e) {
        console.error(e)
    }

    return integrations;

}

/**
 * Delete all existing Genesys Cloud AWS EventBridge integrations
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Genesys Cloud AWS EventBridge integrations...');

    let instances = await getExisting();

    let del_eb = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_eb.push(integrationsApi.deleteIntegration(entity.id));
        });
    }

    return Promise.all(del_eb);
}

/**
 * Add Genesys Cloud AWS EventBridge integrations based on installation data
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
                    id: 'amazon-eventbridge-source'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push((async () => {
            let data = await integrationsApi.postIntegrations(integrationBody);
            logFunc('Created Genesys Cloud AWS EventBridge integration: ' + instance.name);
            integrationsData[instance.name] = data;
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
    let instanceInstallationData = config.provisioningInfo['event-bridge'];
    let gcInstancesData = installedData['event-bridge'];

    let promisesArr = [];

    Object.keys(gcInstancesData).forEach((instanceKey) => {
        let gcInstance = gcInstancesData[instanceKey];
        let gcInstanceInstall = instanceInstallationData
            .find((a) => a.name == instanceKey);

        let integrationConfig = {
            body: {
                name: config.prefix + instanceKey,
                version: 1,
                properties: {
                    awsAccountId: gcInstanceInstall.awsAccountId || '123456123456',
                    awsAccountRegion: gcInstanceInstall.awsAccountRegion || 'us-east-1',
                    eventSourceSuffix: gcInstanceInstall.eventSourceSuffix || 'gc-',
                    eventFilter: gcInstanceInstall.eventFilter || []
                },
                advanced: gcInstanceInstall.advanced || {},
                notes: gcInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        promisesArr.push((async () => {
            try {
                await integrationsApi.putIntegrationConfigCurrent(gcInstance.id, integrationConfig);


                logFunc('Configured Genesys Cloud AWS EventBridge integration: ' + gcInstance.name);
                if (gcInstanceInstall.autoEnable && gcInstanceInstall.autoEnable === true) {
                    let opts = {
                        body: {
                            intendedState: 'ENABLED'
                        }
                    };

                    await integrationsApi.patchIntegration(gcInstance.id, opts);
                }

            } catch (e) {
                console.error(e);
            }
        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'event-bridge',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
