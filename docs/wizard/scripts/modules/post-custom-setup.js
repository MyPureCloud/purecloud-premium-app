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
    return new Promise((resolve, reject) => {
        logFunc('Post Custom Setup...');

        // Example with a forced wait
        /*
        let waitTimer = new Promise((resolve, reject) => {
            console.log('Wait for something...');
            setTimeout(() => resolve(), 3000);
        })
            .then(() => {
                // TODO - Add your code for post custom setup
                resolve({status: true, cause: ''});
            });
        */

        // successful
        // resolve({status: true, cause: ''})
        // failure
        // resolve({status: false, cause: 'detailed reason or empty string'})

        // TODO - Add your code for post custom setup
        // resolve({status: false, cause: 'Rejected because of XYZ'});
        resolve({status: true, cause: ''});
    });
}

export default {
    provisioningInfoKey: 'post-custom-setup',

    configure: configure
}