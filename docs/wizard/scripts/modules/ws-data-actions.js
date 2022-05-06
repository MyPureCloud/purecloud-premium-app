import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing Web Services Data Actions based on the prefix
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
                return entity.integrationType.id == 'custom-rest-actions' &&
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
 * Delete all existing Web Services Data Actions instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Web Services Data Actions...');

    let instances = await getExisting();

    let del_ws = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_ws.push((async () => {
                await integrationsApi.deleteIntegration(entity.id);

                console.log('Wait for Web Services Integration delete...');
                await new Promise((resolve, reject) => {   
                    setTimeout(() => resolve(), 3000);
                });


                if (entity.config.current.credentials && entity.config.current.credentials.basicAuth && entity.config.current.credentials.basicAuth.id) {
                    return integrationsApi.deleteIntegrationsCredential(entity.config.current.credentials.basicAuth.id);
                }
            })());

            /*
            del_ws.push(
                integrationsApi.deleteIntegration(entity.id)
            );
            */
        });
    }

    return Promise.all(del_ws);
}

/**
 * Add Web Services Data Actions instances based on installation data
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
                    id: 'custom-rest-actions'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push((async () => {
            let data = await integrationsApi.postIntegrations(integrationBody);
            logFunc('Created Web Services Data Actions: ' + instance.name);
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
    let instanceInstallationData = config.provisioningInfo['ws-data-actions'];
    let wsInstancesData = installedData['ws-data-actions'];

    let promisesArr = [];

    Object.keys(wsInstancesData).forEach((instanceKey) => {
        let wsInstance = wsInstancesData[instanceKey];
        let wsInstanceInstall = instanceInstallationData
            .find((a) => a.name == instanceKey);

        let integrationConfig = {
            body: {
                name: config.prefix + instanceKey,
                version: 1,
                properties: {},
                advanced: wsInstanceInstall.advanced || {},
                notes: wsInstanceInstall.notes || `Provisioned by ${config.premiumAppIntegrationTypeId} integration`,
                credentials: {}
            }
        };

        let credentialsConfig = {
            body: {
                name: "Integration-" + wsInstance.id,
                type: wsInstanceInstall.credentialType || '',
                credentialFields: wsInstanceInstall.credentials || {}
            }
        };

        let wsCredentialsPromise = new Promise(async(resolve, reject) => {
            if (wsInstanceInstall.credentialType && (wsInstanceInstall.credentialType === 'userDefinedOAuth' || wsInstanceInstall.credentialType === 'userDefined' || wsInstanceInstall.credentialType === 'basicAuth')) {
                try {
                    let data = await integrationsApi.postIntegrationsCredentials(credentialsConfig);
                    resolve(data.id);
                } catch(e) {
                    reject(e);
                }
            } else {
                resolve('');
            }
        });

        promisesArr.push((async () => {
            let credId = await wsCredentialsPromise;

            if (credId && credId != '') {
                // Save Credential Id and Credential Type in installed data
                wsInstance.credentialId = credId;
                wsInstance.credentialType = wsInstanceInstall.credentialType;
                integrationConfig.body.credentials = {
                    basicAuth: {
                        id: credId
                    }
                };
            }
            await integrationsApi.putIntegrationConfigCurrent(
                wsInstance.id,
                integrationConfig
            );

            logFunc('Configured Web Services Data Actions: ' + wsInstance.name);
            if (wsInstanceInstall.autoEnable && wsInstanceInstall.autoEnable === true) {
                let opts = {
                    body: {
                        intendedState: 'ENABLED'
                    }
                };

                await integrationsApi.patchIntegration(wsInstance.id, opts);
            }

            // Wait 3 seconds
            await new Promise((resolve, reject) => {
                console.log('Wait for Web Services Integration enablement...');
                setTimeout(() => resolve(), 3000);
            });

            console.log('Proceed with Web Services Integration configuration...');

            // Return if Configure Data Actions not necessary
            if (wsInstanceInstall['data-actions'] && wsInstanceInstall['data-actions'].length <= 0){
                return;
            }

            // Configure data actions
            let promiseDataActions = [];

            wsInstanceInstall['data-actions'].forEach((dataAction) => {
                let dataActionBody = {
                    name: config.prefix + dataAction.name,
                    integrationId: wsInstance.id
                };

                // Rename and add Group Filtering
                promiseDataActions.push((async () => {
                    let createDataActionsResult =  await integrationsApi.postIntegrationsActionsDrafts(dataActionBody);
                    logFunc('Created Web Services Data Action: ' + createDataActionsResult.name);
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

            if (wsInstanceInstall.credentialType && wsInstanceInstall.credentialType == 'userDefinedOAuth' && wsInstanceInstall.customAuthAction && wsInstanceInstall.customAuthAction.update && wsInstanceInstall.customAuthAction.update === true) {
                // Set back to draft
                let createDraftResult = await integrationsApi.postIntegrationsActionDraft('customAuth_-_' + wsInstance.id);
                let dataActionUpdateBody = { ...createDraftResult };
                dataActionUpdateBody.config = wsInstanceInstall.customAuthAction.config;
                delete dataActionUpdateBody.contract;
                delete dataActionUpdateBody.secure;
                
                let patchResults = await integrationsApi.patchIntegrationsActionDraft(dataActionUpdateBody.id, dataActionUpdateBody);

                return integrationsApi.postIntegrationsActionDraftPublish(patchResults.id, patchResults);
            }
        })());
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'ws-data-actions',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
