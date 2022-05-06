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