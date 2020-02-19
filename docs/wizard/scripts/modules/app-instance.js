import config from '../../config/config.js';

const platformClient = require('platformClient');
const integrationsApi = new platformClient.IntegrationsApi();


/**
 * Get existing apps based on the prefix
 * @returns {Promise.<Array>} PureCloud Integrations
 */
function getExisting(){
    let integrationsOpts = {
        'pageSize': 100
    };
    
    return integrationsApi.getIntegrations(integrationsOpts)
    .then((data) => {
        return(data.entities
            .filter(entity => entity.name
                .startsWith(config.prefix)));
    });  
}

/**
 * Delete all existing PremiumApp instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc){
    logFunc('Uninstalling Other App Instances...');

    return getExisting()
    .then(apps => {
        let del_app = [];

        if (apps.length > 0){
            // Filter results before deleting
            apps.map(entity => entity.id)
                .forEach(iid => {
                    del_app.push(integrationsApi.deleteIntegration(iid));
            });
        }

        return Promise.all(del_app);
    });
}

/**
 * Add PureCLoud instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the PureCloud object details of that type.
 */
function create(logFunc, data){
    let integrationPromises = [];
    let enableIntegrationPromises = [];
    let integrationsData = {};

    data.forEach((instance) => {
        let integrationBody = {
            body: {
                integrationType: {
                    id: config.appName
                }
            }
        };

        // Rename and add Group Filtering
        integrationPromises.push(
            integrationsApi.postIntegrations(integrationBody)
            .then((data) => {
                logFunc("Created instance: " + instance.name);
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
function configure(logFunc, installedData, userId){
    let instanceInstallationData = config.provisioningInfo['app-instance'];
    let appInstancesData = installedData['app-instance'];

    let promisesArr = [];

    Object.keys(appInstancesData).forEach((instanceKey) => {
        let appInstance = appInstancesData[instanceKey];
        let appInstanceInstall =  instanceInstallationData
                                            .find((a) => a.name == instanceKey);

        let integrationConfig = {
            body: {
                name: config.prefix + instanceKey,
                version: 1, 
                properties: {
                    url: appInstanceInstall.url,
                    sandbox: 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts',
                    displayType: appInstanceInstall.type,
                    featureCategory: '', 
                    groupFilter: appInstanceInstall
                                    .groups.map((groupName) => 
                                        installedData.group[groupName].id)
                                    .filter(g => g != undefined)
                },
                advanced: {},
                notes: '',
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
            .catch((err) => console.err(err))
        );
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