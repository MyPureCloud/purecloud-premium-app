import config from '../../config/config.js';

const platformClient = require('platformClient');

/**
 * Post Custom Setup
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {Object} current user
 * @returns {Promise.<Object>}
 */
async function configure(logFunc, installedData, user, gcClient) {
    return new Promise(async (resolve, reject) => {
        logFunc('Post Custom Setup...');

        resolve({ status: true, cause: 'SUCCESS' });

        // successful
        // resolve({status: true, cause: ''})
        // failure
        // resolve({status: false, cause: 'detailed reason or empty string'})

        /*
        try {
            let provisionBody = {
                apiEnvironment: gcClient.config.environment,
                apiBase: gcClient.config.basePath,
                apiAuth: gcClient.config.authUrl,
                orgId: user.organization.id,
                orgName: user.organization.name,
                requestorId: user.id,
                requestorName: user.name,
                requestorUsername: user.username,
                requestorEmail: user.email,
                oauthClientId: installedData['oauth-client'][config.provisioningInfo['oauth-client'][0].name].id,
                oauthClientSecret: installedData['oauth-client'][config.provisioningInfo['oauth-client'][0].name].secret,
                wsCredentialId: installedData['gc-data-actions'][config.provisioningInfo['gc-data-actions'][0].name].credentialId,
                wsCredentialType: installedData['gc-data-actions'][config.provisioningInfo['gc-data-actions'][0].name].credentialType,
                widgetDeploymentKey: installedData['widget-deployment'][config.provisioningInfo['widget-deployment'][0].name].id,
                openMessagingIntegrationId: installedData['open-messaging'][config.provisioningInfo['open-messaging'][0].name].id
            };

            // TODO - Add your code for post custom setup

            let backendResult = await fetch(new Request('/provision', {
                method: 'POST',
                body: JSON.stringify(provisionBody)
            }));

            // Receiving the HTTP POST, the backend can:
            // 1) The backend can verify that the request is coming from a legitimate customer
            //   (i.e. customer has a Genesys Cloud environment and has purchased the Premium Application)
            //   - Retrieve apiEnvironment (Genesys Cloud region: mypurecloud.com, mypurecloud.ie, ...), oauthClientId and oauthClientSecret (the wizard must create an OAuth client with Client Credentials grant first - config.provisioningInfo)
            //   - The backend validates the region is valid and attempts to connect to the Genesys Cloud environment (using provided oauthClientId and oauthClientSecret)
            //   - The backend can then verify that the Premium Application product (e.g. examplePremiumApp) has been purchased with [GET /api/v2/authorization/products](https://developer.genesys.cloud/devapps/api-explorer#get-api-v2-authorization-products)
            //     or can verify the Premium Application Integration Type (e.g. premium-app-example) with [GET /api/v2/integrations/types/{typeId}](https://developer.genesys.cloud/devapps/api-explorer#get-api-v2-integrations-types--typeId-)
            // 2) If granted access, the backend can create/modify/update 3rd party resources for this customer
            // 3) If necessary, the backend can perform updates in the customer's Genesys Cloud environment using the Platform API
            // 4) The backend returns the final status in case of Success or in case of Error

            if (backendResult.status === 200) {
                resolve({ status: true, cause: 'SUCCESS' });
            } else {
                resolve({ status: true, cause: 'ERROR - Request to backend failed because of XYZ' });
            }
        } catch (e) {
            console.error(e);
            resolve({ status: false, cause: 'ERROR - Request to backend failed' });
        }
        */

    });
}

export default {
    provisioningInfoKey: 'post-custom-setup',

    configure: configure
}