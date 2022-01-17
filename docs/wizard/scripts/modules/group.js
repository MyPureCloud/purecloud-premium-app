import config from '../../config/config.js';

const platformClient = require('platformClient');
const groupsApi = new platformClient.GroupsApi();

/**
 * Gets the existing groups on Genesys Cloud based on Prefix
 * @return {Promise.<Array>} Genesys Cloud Group Objects
 */
function getExisting() {
    let groups = []

    // Internal recursive function for calling 
    // next pages (if any) of the groups
    let _getGroups = (pageNum) => {
        return groupsApi.postGroupsSearch({
            pageSize: 100,
            pageNumber: pageNum,
            query: [
                {
                    fields: ['name'],
                    value: config.prefix,
                    type: 'STARTS_WITH'
                }
            ]
        })
            .then((data) => {
                if (data.pageCount > 0) {
                    data.results
                        .forEach(group =>
                            groups.push(group));

                    if (pageNum < data.pageCount) {
                        return _getGroups(pageNum + 1);
                    }
                }
            });
    }

    return _getGroups(1)
        .then(() => {
            return groups;
        })
        .catch(e => console.error(e));
}

/**
 * Delete existing groups from Genesys Cloud org
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc) {
    logFunc('Uninstalling Groups...');

    return getExisting()
        .then((instances) => {
            let del_groups = [];

            if (instances.length > 0) {
                instances.forEach(entity => {
                    del_groups.push(groupsApi.deleteGroup(entity.id));
                });
            }

            return Promise.all(del_groups);
        });
}

/**
 * Add Genesys Cloud groups based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
function create(logFunc, data) {
    let groupPromises = [];
    let groupData = {};

    data.forEach((group) => {
        let groupBody = {
            name: config.prefix + group.name,
            description: group.description,
            type: 'official',
            rulesVisible: true,
            visibility: "public"
        };
        console.log(groupBody);

        groupPromises.push(
            groupsApi.postGroups(groupBody)
                .then((data) => {
                    logFunc('Created group: ' + group.name);
                    groupData[group.name] = data;
                })
                .catch((err) => console.log(err))
        );
    });

    return Promise.all(groupPromises)
        .then(() => groupData);
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
function configure(logFunc, installedData, userId) {
    let promiseArr = [];
    let groupData = installedData.group;

    Object.keys(groupData).forEach((groupKey) => {
        promiseArr.push(
            groupsApi.postGroupMembers(
                groupData[groupKey].id,
                {
                    memberIds: [userId],
                    version: 1
                }
            )
        );
    });

    return Promise.all(promiseArr);
}

export default {
    provisioningInfoKey: 'group',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
