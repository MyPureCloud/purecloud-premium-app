import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing Genesys Cloud Data Actions based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
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
                return entity.integrationType.id == 'purecloud-data-actions' &&
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
 * Delete all existing Genesys Cloud Data Actions instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Genesys Cloud Data Actions...');

    let instances = await getExisting();

    let del_gc = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_gc.push((async () => {
                await integrationsApi.deleteIntegration(entity.id);

                console.log('Wait for Genesys Cloud Integration delete...');
                await new Promise((resolve, reject) => {
                    setTimeout(() => resolve(), 3000);
                });


                if (entity.config.current.credentials && entity.config.current.credentials.pureCloudOAuthClient && entity.config.current.credentials.pureCloudOAuthClient.id) {
                    return integrationsApi.deleteIntegrationsCredential(entity.config.current.credentials.pureCloudOAuthClient.id);
                }
            })());
        });
    }

    return Promise.all(del_gc);
}

/**
 * Add Genesys Cloud Data Actions instances based on installation data
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
                    id: 'purecloud-data-actions'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push((async () => {
            let data = await integrationsApi.postIntegrations(integrationBody);
            logFunc('Created Genesys Cloud Data Actions: ' + instance.name);
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
    let instanceInstallationData = config.provisioningInfo['gc-data-actions'];
    let gcInstancesData = installedData['gc-data-actions'];

    let promisesArr = [];

    Object.keys(gcInstancesData).forEach((instanceKey) => {
        let gcInstance = gcInstancesData[instanceKey];
        let gcInstanceInstall = instanceInstallationData
            .find((a) => a.name == instanceKey);

        let integrationConfig = {
            body: {
                name: config.prefix + instanceKey,
                version: 1,
                properties: {},
                advanced: gcInstanceInstall.advanced || {},
                notes: gcInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        let oauthData = installedData['oauth-client'];
        let credentialsConfig = {
            body: {
                name: "Integration-" + gcInstance.id,
                type: 'pureCloudOAuthClient',
                credentialFields: {
                    clientId: oauthData[gcInstanceInstall.oauthClient].id,
                    clientSecret: oauthData[gcInstanceInstall.oauthClient].secret
                }
            }
        };

        let gcCredentialsPromise = new Promise(async (resolve, reject) => {
            try {
                let data = await integrationsApi.postIntegrationsCredentials(credentialsConfig);
                resolve(data.id);
            } catch (e) {
                reject(e);
            }
        });

        promisesArr.push((async () => {
            let credId = await gcCredentialsPromise;

            if (credId && credId != '') {
                // Save Credential Id and Credential Type in installed data
                gcInstance.credentialId = credId;
                gcInstance.credentialType = 'pureCloudOAuthClient';
                integrationConfig.body.credentials = {
                    pureCloudOAuthClient: {
                        id: credId
                    }
                };
            }
            await integrationsApi.putIntegrationConfigCurrent(
                gcInstance.id,
                integrationConfig
            );

            logFunc('Configured Genesys Cloud Data Actions: ' + gcInstance.name);
            if (gcInstanceInstall.autoEnable && gcInstanceInstall.autoEnable === true) {
                let opts = {
                    body: {
                        intendedState: 'ENABLED'
                    }
                };

                await integrationsApi.patchIntegration(gcInstance.id, opts);
            }

            // Wait 3 seconds
            await new Promise((resolve, reject) => {
                console.log('Wait for Genesys Cloud Integration enablement...');
                setTimeout(() => resolve(), 3000);
            });

            console.log('Proceed with Genesys Cloud Integration configuration...');

            // Return if Configure Data Actions not necessary
            if (gcInstanceInstall['data-actions'] && gcInstanceInstall['data-actions'].length <= 0) {
                return;
            }

            // Configure data actions
            let promiseDataActions = [];

            gcInstanceInstall['data-actions'].forEach((dataAction) => {
                let dataActionBody = {
                    name: config.prefix + dataAction.name,
                    integrationId: gcInstance.id
                };

                // Rename and add Group Filtering
                promiseDataActions.push((async () => {
                    let createDataActionsResult = await integrationsApi.postIntegrationsActionsDrafts(dataActionBody);
                    logFunc('Created Genesys Cloud Data Action: ' + createDataActionsResult.name);
                    let dataActionUpdateBody = { ...createDataActionsResult };
                    dataActionUpdateBody.secure = dataAction.secure || false;
                    dataActionUpdateBody.config = dataAction.config;
                    dataActionUpdateBody.contract = dataAction.contract;

                    let patchDataActionsResult = await integrationsApi.patchIntegrationsActionDraft(dataActionUpdateBody.id, dataActionUpdateBody);
                    if (dataAction.autoPublish && dataAction.autoPublish === true) {
                        return integrationsApi.postIntegrationsActionDraftPublish(patchDataActionsResult.id, patchDataActionsResult);
                    } else {
                        return;
                    }
                })());
            });

            await Promise.all(promiseDataActions);

        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'gc-data-actions',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
