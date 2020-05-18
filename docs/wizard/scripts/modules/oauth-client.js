import config from '../../config/config.js';

const platformClient = require('platformClient');
const oAuthApi = new platformClient.OAuthApi();
const authorizationApi = new platformClient.AuthorizationApi();
const usersApi = new platformClient.UsersApi();

 /**
 * Get existing authetication clients based on the prefix
 * @returns {Promise.<Array>} Array of PureCloud OAuth Clients
 */
function getExisting(){
    return oAuthApi.getOauthClients()
    .then((data) => {
        console.log('==================================');
        console.log(data);
        return(data.entities
            .filter(entity => {
                if(entity.name)
                    return entity.name.startsWith(config.prefix);
                else
                    return false;
            }));
    });
}

/**
 * Delete all existing PremiumApp instances
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc){
    logFunc('Uninstalling OAuth Clients...');

    return getExisting()
    .then((instances) => {
        let del_clients = [];

        if (instances.length > 0){
            // Filter results before deleting
            instances.map(entity => entity.id)
                .forEach(cid => {
                    del_clients.push(oAuthApi.deleteOauthClient(cid));
            });
        }

        return Promise.all(del_clients);
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
    let authData = {};

    // Assign employee role to the oauth client because required
    // to have a role id on creation
    return authorizationApi.getAuthorizationRoles({
        name: 'employee'
    })
    .then((result) => {
        let employeeRole = result.entities[0];

        let authPromises = [];
        
        data.forEach((oauth) => {
            let oauthClient = {
                name: config.prefix + oauth.name,
                description: oauth.description,
                authorizedGrantType: oauth.authorizedGrantType,
                roleIds: [employeeRole.id]
            };

            authPromises.push(
                oAuthApi.postOauthClients(oauthClient)
                .then((data) => {
                    authData[oauth.name] = data;

                    logFunc('Created ' + data.name + ' auth client');
                })
                .catch((err) => console.log(err))
            );

            
        })

        return Promise.all(authPromises);
    })
    .then(() => authData);
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
function configure(logFunc, installedData, userId){
    let promiseArr = [];
    let oauthData = installedData['oauth-client'];

    Object.keys(oauthData).forEach((oauthKey) => {
        let promise = new Promise((resolve, reject) => {
            let oauth = oauthData[oauthKey];
            let oauthInstall = config.provisioningInfo['oauth-client']
                                .find((info) => info.name == oauthKey);

            let timer = setInterval(() => {
                usersApi.getUsersMe({
                    expand: ['authorization']
                })
                .then((result) => {
                    console.log(result);
                    let userRoleIds = result.authorization.roles.map(u => u.id);
                    let userAssigned = true;

                    // Check if all roles for these client is already assigned
                    // to the user
                    oauthInstall.roles.forEach((r) => {
                        if(!userRoleIds.includes(installedData.role[r].id)){
                            userAssigned = false;
                        }
                    });

                    if(userAssigned){
                        clearInterval(timer);

                        oAuthApi.putOauthClient(
                            oauthData[oauthKey].id,
                            {
                                name: oauth.name,
                                authorizedGrantType: oauth.authorizedGrantType,
                                roleIds: oauthInstall.roles.map(
                                        (roleName) => installedData.role[roleName].id)
                                    .filter(g => g != undefined)
                            }
                        )
                        .then(() => {
                            resolve();
                        })
                        .catch((e) => reject(e));
                    }
                })
                .catch(e => {
                    clearInterval(timer);

                    console.error(e);
                });
            }, 3000);
        });

        promiseArr.push(promise);
    });

    return Promise.all(promiseArr);
}


export default {
    provisioningInfoKey: 'oauth-client',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}