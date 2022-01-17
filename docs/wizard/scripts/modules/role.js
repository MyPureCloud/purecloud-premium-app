import config from '../../config/config.js';

const platformClient = require('platformClient');
const authorizationApi = new platformClient.AuthorizationApi();


/**
 * Get existing roles in Genesys Cloud based on prefix
 * @returns {Promise.<Array>} Genesys Cloud Roles
 */
function getExisting() {
    let roles = []

    // Internal recursive function for calling 
    // next pages (if any) of the integrations
    let _getRoles = (pageNum) => {
        return authorizationApi.getAuthorizationRoles({
            pageSize: 100,
            pageNumber: pageNum,
            name: config.prefix + "*",
            userCount: 'false'
        })
            .then((data) => {
                data.entities
                    .forEach(role =>
                        roles.push(role));

                if (data.nextUri) {
                    return _getRoles(pageNum + 1);
                }
            });
    }

    return _getRoles(1)
        .then(() => {
            return roles;
        })
        .catch(e => console.error(e));
}

/**
 * Delete existing roles from Genesys Cloud
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc) {
    logFunc('Uninstalling Roles...');

    return getExisting()
        .then((instances) => {
            let del_roles = [];

            if (instances.length > 0) {
                instances.forEach(entity => {
                    del_roles.push(authorizationApi.deleteAuthorizationRole(entity.id));
                });
            }

            return Promise.all(del_roles);
        });
}

/**
 * Add Genesys Cloud roles based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
function create(logFunc, data) {
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
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
function configure(logFunc, installedData, userId) {
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

