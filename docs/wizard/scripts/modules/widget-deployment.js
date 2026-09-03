import config from '../../config/config.js';

const platformClient = require('platformClient');
const webdeploymentsApi = new platformClient.WebDeploymentsApi();

/**
* Get existing Widget Deployments based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
async function getExisting() {
  let data = await webdeploymentsApi.getWebdeploymentsDeployments();
  return data.entities.filter((entity) => entity.name.startsWith(config.prefix));
}

/**
* Delete all existing Widget Deployment instances, along with the
* Web Deployment Configuration each one references.
* @param {Function} logFunc logs any messages
* @returns {Promise}
*/
async function remove(logFunc) {
  logFunc('Uninstalling Widget Deployments...');

  let instances = await getExisting();

  let del_deployments = [];

  if (instances.length > 0) {
    instances.forEach(entity => {
      del_deployments.push((async () => {
        await webdeploymentsApi.deleteWebdeploymentsDeployment(entity.id);

        if (entity.configuration && entity.configuration.id) {
          await webdeploymentsApi.deleteWebdeploymentsConfiguration(entity.configuration.id);
        }
      })());
    });
  }

  return Promise.all(del_deployments);
}

/**
* Create the Web Deployment Configuration (Messenger settings) backing a
* Widget Deployment, then publish its draft so it can be referenced by
* a deployment.
* @param {Object} instance the installation data for this deployment
* @returns {Promise.<Object>} object with the configuration's id and published version
*/
async function createConfiguration(instance) {
  let configurationBody = {
    name: config.prefix + instance.name + ' Configuration',
    description: instance.description || '',
    languages: ['en-us'],
    defaultLanguage: 'en-us',
    messenger: {
      enabled: true,
      launcherButton: {
        visibility: 'OnDemand'
      }
    }
  };

  let configuration = await webdeploymentsApi.postWebdeploymentsConfigurations(configurationBody);
  let publishedVersion = await webdeploymentsApi.postWebdeploymentsConfigurationVersionsDraftPublish(configuration.id);

  return {
    id: configuration.id,
    version: publishedVersion.version
  };
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
    deploymentPromises.push((async () => {
      let configuration = await createConfiguration(instance);
      logFunc('Created Web Deployment Configuration for: ' + instance.name);

      if (instance.authentication) {
        // Authenticated deployments require an existing SSO/embedded-client
        // integration id (authentication_settings.integrationId) on the
        // configuration. This wizard doesn't provision that integration, so
        // authentication can't be turned on here - it must be configured
        // manually on the Configuration in Genesys Cloud after install.
        logFunc('WARNING: ' + instance.name + ' requested authentication, but the wizard cannot ' +
          'provision the required auth integration automatically. Configure it manually after install.');
      }

      let hasAllowedDomains = instance.allowedDomains && instance.allowedDomains.length > 0;

      let deploymentBody = {
        name: config.prefix + instance.name,
        description: instance.description || '',
        allowAllDomains: !hasAllowedDomains,
        allowedDomains: hasAllowedDomains ? instance.allowedDomains : [],
        status: 'Inactive',
        configuration: configuration
      };

      let result = await webdeploymentsApi.postWebdeploymentsDeployments(deploymentBody);
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
      deploymentConfig.status = 'Active';

      promisesArr.push((async () => {
        await webdeploymentsApi.putWebdeploymentsDeployment(deploymentInstance.id, deploymentConfig);
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
