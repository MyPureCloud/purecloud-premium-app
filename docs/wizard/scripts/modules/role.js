import config from '../../config/config.js';

const platformClient = require('platformClient');
const authorizationApi = new platformClient.AuthorizationApi();


/**
 * Get existing roles in purecloud based on prefix
 * @returns {Promise.<Array>} PureCloud Roles
 */
function getExisting(){
    let authOpts = { 
        'name': config.prefix + "*", // Wildcard to work like STARTS_WITH 
        'userCount': false
    };

    return authorizationApi.getAuthorizationRoles(authOpts);
}

/**
 * Delete existing roles from PureCloud
 * @returns {Promise}
 */
function remove(){
    return getExisting()
    .then(roles => {
        let del_role = [];

        if(roles.total > 0){
            roles.entities.map(r => r.id).forEach(rid => {
                del_role.push(authorizationApi.deleteAuthorizationRole(rid));
            });
        }
        
        return Promise.all(del_role);
    });
}

/**
 * Add PureCLoud roles based on installation data
 * @param {Function} logFunc logger function
 * @param {Object} data the installation data as defined in the config
 * @returns {Promise}
 */
function create(logFunc, data){
    let rolePromises = [];
    let roleData = {}; // Object of "rolename": (Role Object)

    // Create the roles
    data.forEach((role) => {
        let roleBody = {
            name: config.prefix + role.name,
            description: '',
            permissionPolicies: role.permissionPolicies
        };

        // Assign role to user
        let roleId = null;
        rolePromises.push(
            authorizationApi.postAuthorizationRoles(roleBody)
            .then((data) => {
                logFunc('Created role: ' + role.name);

                roleData[role.name] = data;
            })
            .catch((err) => console.log(err))
        );
    });

    return Promise.all(rolePromises)
    .then(() => roleData);
}

/**
 * 
 * @param {Function} logFunc logger function
 * @param {Object} installedData Complete installation data of the wizard
 * @param {*} userId 
 */
function configure(logFunc, installedData, userId){
    // Assign the role to the user
    // Required before you can assign the role to an Auth Client.
    let promiseArr = [];
    let roleData = installedData.role;

    Object.keys(roleData).forEach((roleKey) => {
        promiseArr.push(
            authorizationApi.putAuthorizationRoleUsersAdd(
                roleData[roleKey].id, 
                [userId]
            )
            .then((data) => {
                logFunc('Assigned ' + roleData[roleKey].name + ' to user');
            })
        );
    });
    
    return Promise.all(promiseArr);
}

export default {
    provisioningInfoKey: 'role',
    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}

