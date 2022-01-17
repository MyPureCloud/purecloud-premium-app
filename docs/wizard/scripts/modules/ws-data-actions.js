import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
* Get existing Web Services Data Actions based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getIntegrations = (pageNum) => {
        return integrationsApi.getIntegrations({
            pageSize: 100,
            pageNumber: pageNum,
            expand: ['config.current']
        })
            .then((data) => {
                data.entities
                    .filter(entity => {
                        return entity.integrationType.id == 'custom-rest-actions' &&
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
 * Delete all existing Web Services Data Actions instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc) {
    logFunc('Uninstalling Web Services Data Actions...');

    return getExisting()
        .then((instances) => {
            let del_ws = [];

            if (instances.length > 0) {
                instances.forEach(entity => {
                    del_ws.push(
                        integrationsApi.deleteIntegration(entity.id)
                            .then(() => {
                                return new Promise((resolve, reject) => {
                                    console.log('Wait for Web Services Integration delete...');
                                    setTimeout(() => resolve(), 3000);
                                });
                            })
                            .then(() => {
                                if (entity.config.current.credentials && entity.config.current.credentials.basicAuth && entity.config.current.credentials.basicAuth.id) {
                                    return integrationsApi.deleteIntegrationsCredential(entity.config.current.credentials.basicAuth.id);
                                }
                            })
                    );

                    /*
                    del_ws.push(
                        integrationsApi.deleteIntegration(entity.id)
                    );
                    */
                });
            }

            return Promise.all(del_ws);
        });
}

/**
 * Add Web Services Data Actions instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
function create(logFunc, data) {
    let integrationPromises = [];
    let integrationsData = {};

    data.forEach((instance) => {
        let integrationBody = {
            body: {
                integrationType: {
                    id: 'custom-rest-actions'
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push(
            integrationsApi.postIntegrations(integrationBody)
                .then((data) => {
                    logFunc('Created Web Services Data Actions: ' + instance.name);
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

        let wsCredentialsPromise = new Promise((resolve, reject) => {
            if (wsInstanceInstall.credentialType && (wsInstanceInstall.credentialType === 'userDefinedOAuth' || wsInstanceInstall.credentialType === 'userDefined' || wsInstanceInstall.credentialType === 'basicAuth')) {
                integrationsApi.postIntegrationsCredentials(credentialsConfig)
                    .then((data) => {
                        resolve(data.id);
                    })
                    .catch(err => reject(err));
            } else {
                resolve('');
            }
        });

        promisesArr.push(
            wsCredentialsPromise
                .then((credId) => {
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
                    return integrationsApi.putIntegrationConfigCurrent(
                        wsInstance.id,
                        integrationConfig
                    );
                })
                .then((data) => {
                    logFunc('Configured Web Services Data Actions: ' + wsInstance.name);

                    if (wsInstanceInstall.autoEnable && wsInstanceInstall.autoEnable === true) {
                        let opts = {
                            body: {
                                intendedState: 'ENABLED'
                            }
                        };

                        return integrationsApi.patchIntegration(wsInstance.id, opts);
                    } else {
                        return;
                    }
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        console.log('Wait for Web Services Integration enablement...');
                        setTimeout(() => resolve(), 3000);
                    });
                })
                .then(() => {
                    console.log('Proceed with Web Services Integration configuration...');
                    // Configure Data Actions if necessary
                    if (wsInstanceInstall['data-actions'] && wsInstanceInstall['data-actions'].length > 0) {
                        let promiseDataActions = [];

                        wsInstanceInstall['data-actions'].forEach((dataAction) => {
                            let dataActionBody = {
                                name: config.prefix + dataAction.name,
                                integrationId: wsInstance.id
                            };

                            // Rename and add Group Filtering
                            promiseDataActions.push(
                                integrationsApi.postIntegrationsActionsDrafts(dataActionBody)
                                    .then((data) => {
                                        logFunc('Created Web Services Data Action: ' + data.name);
                                        let dataActionUpdateBody = { ...data };
                                        dataActionUpdateBody.secure = dataAction.secure || false;
                                        dataActionUpdateBody.config = dataAction.config;
                                        dataActionUpdateBody.contract = dataAction.contract;
                                        return integrationsApi.patchIntegrationsActionDraft(dataActionUpdateBody.id, dataActionUpdateBody);
                                    })
                                    .then((data) => {
                                        if (dataAction.autoPublish && dataAction.autoPublish === true) {
                                            return integrationsApi.postIntegrationsActionDraftPublish(data.id, data);
                                        } else {
                                            return;
                                        }
                                    })
                            );
                        });

                        return Promise.all(promiseDataActions)
                            .then(() => {
                                if (wsInstanceInstall.credentialType && wsInstanceInstall.credentialType == 'userDefinedOAuth' && wsInstanceInstall.customAuthAction && wsInstanceInstall.customAuthAction.update && wsInstanceInstall.customAuthAction.update === true) {
                                    // Set back to draft
                                    return integrationsApi.postIntegrationsActionDraft('customAuth_-_' + wsInstance.id)
                                        .then((data) => {
                                            let dataActionUpdateBody = { ...data };
                                            dataActionUpdateBody.config = wsInstanceInstall.customAuthAction.config;
                                            delete dataActionUpdateBody.contract;
                                            delete dataActionUpdateBody.secure;
                                            return integrationsApi.patchIntegrationsActionDraft(dataActionUpdateBody.id, dataActionUpdateBody);
                                        })
                                        .then((data) => {
                                            return integrationsApi.postIntegrationsActionDraftPublish(data.id, data);
                                        })
                                }
                            });
                    }
                })
                .catch((err) => console.error(err))
        );
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
