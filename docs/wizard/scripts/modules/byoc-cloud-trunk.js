import config from '../../config/config.js';

const platformClient = require('platformClient');
const telephonyProvidersEdgeApi = new platformClient.TelephonyProvidersEdgeApi();
const organizationApi = new platformClient.OrganizationApi();

/**
 * Get existing trunks based on the prefix
 * @returns {Promise.<Array>} Genesys Cloud Integrations
 */
async function getExisting() {
    let trunks = []

    // Internal recursive function for calling 
    // next pages (if any) of the trunks
    let _getTrunks = async (pageNum) => {
        let data = await telephonyProvidersEdgeApi.getTelephonyProvidersEdgesTrunkbasesettings({
            pageSize: 100,
            pageNumber: pageNum,
            name: config.prefix + "*"
        });

        if (data.pageCount > 0) {
            data.entities
                .filter((tr) =>
                    tr.name.startsWith(config.prefix))
                .forEach(trunk =>
                    trunks.push(trunk));

            if (pageNum < data.pageCount) {
                return _getTrunks(pageNum + 1);
            }
        }
    }

    try {
        await _getTrunks(1)
    } catch (e) {
        console.error(e)
    }

    return trunks;
}

/**
 * Delete all existing trunks
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Trunks...');

    let instances = await getExisting();
    let del_trunks = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_trunks.push(
                telephonyProvidersEdgeApi.deleteTelephonyProvidersEdgesTrunkbasesetting(entity.id)
            );
        });
    }

    return Promise.all(del_trunks);
}

/**
 * Add Genesys Cloud instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
async function create(logFunc, data) {
    let trunkPromises = [];
    let trunkData = {};

    // Create the trunks
    data.forEach((tr) => {
        let trunkMetabaseId = "external_sip_pcv_byoc_carrier.json";
        organizationApi.getOrganizationsMe()
            .then((currentOrg) => {
                telephonyProvidersEdgeApi.getTelephonyProvidersEdgesTrunkbasesettingsTemplate(trunkMetabaseId)
                    .then((trunkTemplate) => {
                        trunkTemplate.name = config.prefix + tr.name;
                        trunkTemplate.properties.trunk_label.value.instance = config.prefix + tr.name;
                        trunkTemplate.properties.trunk_sip_termination_uri.value.instance = tr.inboundSIPTerminationIdentifier && tr.inboundSIPTerminationIdentifier != '' ? currentOrg.thirdPartyOrgName + tr.inboundSIPTerminationIdentifier : '';
                        Object.keys(tr.properties).forEach(propKey => {
                            trunkTemplate.properties[propKey].value.instance = tr.properties[propKey];
                        });
                        trunkPromises.push((async () => {
                            let result = await telephonyProvidersEdgeApi.postTelephonyProvidersEdgesTrunkbasesettings(trunkTemplate);

                            logFunc('Created Trunk: ' + tr.name);
                            trunkData[tr.name] = result;
                        })());

                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    });

    await Promise.all(trunkPromises)
    return trunkData;
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
async function configure(logFunc, installedData, userId) {
    return Promise.resolve();
}

export default {
    provisioningInfoKey: 'byoc-cloud-trunk',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}