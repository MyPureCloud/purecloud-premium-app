import config from '../../config/config.js';

const platformClient = require('platformClient');
const conversationsApi = new platformClient.ConversationsApi();


/**
* Get existing Open Messaging integrations based on the prefix
* @returns {Promise.<Array>} Array of Genesys Cloud OAuth Clients
*/
async function getExisting() {
    let integrations = []

    // Internal recursive function for calling 
    // next pages (if any) of the open messaging integrations
    let _getOpenMessagingIntegrations = async (pageNum) => {
        let data = await conversationsApi.getConversationsMessagingIntegrationsOpen({
            pageSize: 100,
            pageNumber: pageNum
        });

        if (data.pageCount > 0) {
            data.entities
                .filter((omi) =>
                    omi.name.startsWith(config.prefix))
                .forEach(integration =>
                    integrations.push(integration));

            if (pageNum < data.pageCount) {
                return _getOpenMessagingIntegrations(pageNum + 1);
            }
        }
    }

    try {
        await _getOpenMessagingIntegrations(1)
    } catch (e) {
        console.error(e)
    }

    return integrations;
}

/**
 * Delete all existing Open Messaging instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Open Messaging Integrations...');

    let instances = await getExisting();

    let del_integrations = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_integrations.push(conversationsApi.deleteConversationsMessagingIntegrationsOpenIntegrationId(entity.id));
        });
    }

    return Promise.all(del_integrations);
}

/**
 * Add Open Messaging instances based on installation data
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
            name: config.prefix + instance.name,
            outboundNotificationWebhookUrl: instance.outboundNotificationWebhookUrl || 'https://yourservice.com/messages',
            outboundNotificationWebhookSignatureSecretToken: instance.outboundNotificationWebhookSignatureSecretToken || 'OUTBOUND_NOTIFICATION_WEBHOOK_SIGNATURE_SECRET_TOKEN',
            webhookHeaders: instance.webhookHeaders || {}
        };

        integrationPromises.push((async () => {
            let result = await conversationsApi.postConversationsMessagingIntegrationsOpen(integrationBody);
            logFunc('Created Open Messaging Integration: ' + instance.name);
            integrationsData[instance.name] = result;
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
    return Promise.resolve();
}

export default {
    provisioningInfoKey: 'open-messaging',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
