import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing Genesys Cloud AudioHook integrations based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud integrations
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
                return entity.integrationType.id == 'audiohook' &&
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
 * Delete all existing Genesys Cloud AudioHook integrations
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Genesys Cloud AudioHook integrations...');

    let instances = await getExisting();

    let del_ah = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_ah.push((async () => {
                await integrationsApi.deleteIntegration(entity.id);

                console.log('Wait for Genesys Cloud AudioHook integration delete...');
                await new Promise((resolve, reject) => {
                    setTimeout(() => resolve(), 3000);
                });


                if (entity.config.current.credentials && entity.config.current.credentials.audioHook && entity.config.current.credentials.audioHook.id) {
                    return integrationsApi.deleteIntegrationsCredential(entity.config.current.credentials.audioHook.id);
                }
            })());
        });
    }

    return Promise.all(del_ah);
}

/**
 * Add Genesys Cloud AudioHook integrations based on installation data
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
                    id: 'audiohook'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push((async () => {
            let data = await integrationsApi.postIntegrations(integrationBody);
            logFunc('Created Genesys Cloud AudioHook integration: ' + instance.name);
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
    let instanceInstallationData = config.provisioningInfo['audiohook'];
    let gcInstancesData = installedData['audiohook'];

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
                    channel: gcInstanceInstall.channel || 'both',
                    connectionUri: gcInstanceInstall.connectionUri || 'wss://test.test.test'
                },
                advanced: gcInstanceInstall.advanced || {},
                notes: gcInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        let credentialsConfig = {
            body: {
                name: "Integration-" + gcInstance.id,
                type: 'audioHook',
                credentialFields: {
                    apiKey: gcInstanceInstall.credentials.apiKey || 'TEST',
                    clientSecret: gcInstanceInstall.credentials.clientSecret || ''
                }
            }
        };

        promisesArr.push((async () => {
            let credResult = await integrationsApi.postIntegrationsCredentials(credentialsConfig);

            if (credResult) {
                // Save Credential Id and Credential Type in installed data
                gcInstance.credentialId = credResult.id;
                gcInstance.credentialType = 'audioHook';
                integrationConfig.body.credentials = {
                    audioHook: {
                        id: credResult.id
                    }
                };
            }
            await integrationsApi.putIntegrationConfigCurrent(
                gcInstance.id,
                integrationConfig
            );

            logFunc('Configured Genesys Cloud AudioHook integration: ' + gcInstance.name);
            if (gcInstanceInstall.autoEnable && gcInstanceInstall.autoEnable === true) {
                let opts = {
                    body: {
                        intendedState: 'ENABLED'
                    }
                };

                await integrationsApi.patchIntegration(gcInstance.id, opts);
            }

        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'audiohook',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
