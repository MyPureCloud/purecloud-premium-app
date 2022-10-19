import config from '../../config/config.js';

const platformClient = require('platformClient');
const widgetsApi = new platformClient.WidgetsApi();


/**
* Get existing Widget Deployments based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
async function getExisting() {
    let data = await widgetsApi.getWidgetsDeployments();
    return data.entities.filter((entity) => entity.name.startsWith(config.prefix));
}

/**
 * Delete all existing Widget Deployment instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Widget Deployments...');

    let instances = await getExisting();

    let del_deployments = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_deployments.push(widgetsApi.deleteWidgetsDeployment(entity.id));
        });
    }

    return Promise.all(del_deployments);
}

/**
 * Add Widget Deployment instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
async function create(logFunc, data) {
    let deploymentPromises = [];
    let deploymentsData = {};

    data.forEach((instance) => {
        let deploymentBody = {
            name: config.prefix + instance.name,
            description: instance.description || '',
            authenticationRequired: instance.authentication || false,
            disabled: true,
            allowedDomains: instance.allowedDomains || [],
            clientType: instance.clientType || 'third-party'
        };

        deploymentPromises.push((async () => {
            let result = await widgetsApi.postWidgetsDeployments(deploymentBody);
            logFunc('Created Widget Deployment: ' + instance.name);
            deploymentsData[instance.name] = result;
        })());
    });

    await Promise.all(deploymentPromises);
    return deploymentsData;
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
async function configure(logFunc, installedData, userId) {
    let instanceInstallationData = config.provisioningInfo['widget-deployment'];
    let deploymentInstancesData = installedData['widget-deployment'];

    let promisesArr = [];

    Object.keys(deploymentInstancesData).forEach((instanceKey) => {
        let deploymentInstance = deploymentInstancesData[instanceKey];
        let deploymentInstanceInstall = instanceInstallationData
            .find((a) => a.name == instanceKey);

        let deploymentConfig = deploymentInstance;
        if (deploymentInstanceInstall.autoEnable && deploymentInstanceInstall.autoEnable === true) {
            deploymentConfig.disabled = false;

            promisesArr.push((async () => {
                await widgetsApi.putWidgetsDeployment(deploymentInstance.id, deploymentConfig);
                logFunc('Configured Widget Deployment: ' + deploymentInstance.name);
            })());
        }
    });

    return Promise.all(promisesArr);
}

export default {
    provisioningInfoKey: 'widget-deployment',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
