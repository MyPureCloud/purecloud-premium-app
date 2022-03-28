import config from '../../config/config.js';

const platformClient = require('platformClient');
const telephonyProvidersEdgeApi = new platformClient.TelephonyProvidersEdgeApi();
const usersApi = new platformClient.UsersApi();

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
    let currentUser = null;

    // Create the trunks
    data.forEach((tr) => {
        let trunkMetabaseId = "external_sip_pcv_byoc_carrier.json";
        usersApi.getUsersMe({
            expand: ['organization']
        })
            .then((me) => {
                currentUser = me;

                telephonyProvidersEdgeApi.getTelephonyProvidersEdgesTrunkbasesettingsTemplate(trunkMetabaseId)
                    .then((trunkTemplate) => {
                        trunkTemplate.name = config.prefix + tr.name;
                        trunkTemplate.properties.trunk_label.value.instance = config.prefix + tr.name;
                        trunkTemplate.properties.trunk_enabled.value.instance = tr.autoEnable && tr.autoEnable === true ? true : false;
                        trunkTemplate.properties.trunk_transport_serverProxyList.value.instance = tr.sipServers ? tr.sipServers : [];
                        trunkTemplate.properties.trunk_transport_protocolVariant.value.instance = tr.protocol && tr.protocol != '' ? tr.protocol.toLowerCase() : 'udp';
                        trunkTemplate.properties.trunk_access_acl_allowList.value.instance = tr.sipACL ? tr.sipACL : [];
                        trunkTemplate.properties.trunk_recording_enabled.value.instance = tr.enableRecording && tr.enableRecording === true ? true : false;
                        trunkTemplate.properties.trunk_consult_recording_enabled.value.instance = tr.enableRecordingConsult && tr.enableRecordingConsult === true ? true : false;
                        trunkTemplate.properties.trunk_recording_audioFormat.value.instance = tr.enableRecordingAudioFormat && tr.enableRecordingAudioFormat != '' ? tr.enableRecordingAudioFormat : 'audio/opus';
                        trunkTemplate.properties.trunk_recording_levelControlEnabled.value.instance = tr.enableRecordingAutomaticLevelControl && tr.enableRecordingAutomaticLevelControl === true ? true : false;
                        trunkTemplate.properties.trunk_recording_externalTransfersEnabled.value.instance = tr.enableRecordingOnExternalTransfer && tr.enableRecordingOnExternalTransfer === true ? true : false;
                        trunkTemplate.properties.trunk_recording_dualChannel.value.instance = tr.enableRecordingDualChannel && tr.enableRecordingDualChannel === true ? true : false;
                        trunkTemplate.properties.trunk_sip_conversationHeader.value.instance = tr.enableConversationHeaders && tr.enableConversationHeaders === true ? true : false;
                        if (tr.enableSIPDigest && tr.enableSIPDigest === true) {
                            trunkTemplate.properties.trunk_sip_authentication_credentials_realm.value.instance = tr.sipDigestRealm && tr.sipDigestRealm != '' ? tr.sipDigestRealm : '';
                            trunkTemplate.properties.trunk_sip_authentication_credentials_username.value.instance = tr.sipDigestUsername && tr.sipDigestUsername != '' ? tr.sipDigestUsername : '';
                            trunkTemplate.properties.trunk_sip_authentication_credentials_password.value.instance = tr.sipDigestPassword && tr.sipDigestPassword != '' ? tr.sipDigestPassword : '';
                        }
                        trunkTemplate.properties.trunk_sip_uuiEnabled.value.instance = tr.enableUUI && tr.enableUUI === true ? true : false;
                        trunkTemplate.properties.trunk_sip_uuiHeader.value.instance = tr.uuiType && tr.uuiType != '' ? tr.uuiType : 'User-to-User';
                        trunkTemplate.properties.trunk_sip_uuiEncoding.value.instance = tr.uuiEncoding && tr.uuiEncoding != '' ? tr.uuiEncoding : 'Hex';
                        trunkTemplate.properties.trunk_sip_uuiPd.value.instance = tr.uuiProtocolDiscriminator && tr.uuiProtocolDiscriminator != '' ? tr.uuiProtocolDiscriminator : '00';
                        trunkTemplate.properties.trunk_language.value.instance = tr.language && tr.language != '' ? tr.language : 'en-US';
                        trunkTemplate.properties.trunk_outboundIdentity_callingAddress_omitPlusPrefix.value.instance = tr.callingAddressOmitPrefix && tr.callingAddressOmitPrefix === true ? true : false;
                        trunkTemplate.properties.trunk_outboundIdentity_calledAddress_omitPlusPrefix.value.instance = tr.calledAddressOmitPrefix && tr.calledAddressOmitPrefix === true ? true : false;
                        trunkTemplate.properties.trunk_outboundIdentity_callingName.value.instance = tr.outboundNameOverrideCallerName && tr.outboundNameOverrideCallerName != '' ? tr.outboundNameOverrideCallerName : '';
                        trunkTemplate.properties.trunk_outboundIdentity_callingName_overrideMethod.value.instance = tr.outboundNameOverrideMethod && tr.outboundNameOverrideMethod != '' ? tr.outboundNameOverrideMethod : 'Always';
                        trunkTemplate.properties.trunk_outboundIdentity_callingAddress.value.instance = tr.outboundAddressOverrideCallerID && tr.outboundAddressOverrideCallerID != '' ? tr.outboundAddressOverrideCallerID : '';
                        trunkTemplate.properties.trunk_outboundIdentity_callingAddress_overrideMethod.value.instance = tr.outboundAddressOverrideMethod && tr.outboundAddressOverrideMethod != '' ? tr.outboundAddressOverrideMethod : 'Always';
                        trunkTemplate.properties.trunk_transfer_takeback_enabled.value.instance = tr.enableTakeBackAndTransfer && tr.enableTakeBackAndTransfer === true ? true : false;
                        trunkTemplate.properties.trunk_rlt_enabled.value.instance = tr.enableReleaseLinkTransfer && tr.enableReleaseLinkTransfer === true ? true : false;
                        trunkTemplate.properties.trunk_sip_termination_uri.value.instance = tr.inboundSIPTerminationIdentifier && tr.inboundSIPTerminationIdentifier != '' ? currentUser.organization.thirdPartyOrgName + tr.inboundSIPTerminationIdentifier : '';

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