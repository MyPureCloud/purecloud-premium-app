import config from '../../config/config.js';

const platformClient = require('platformClient');
const groupsApi = new platformClient.GroupsApi();

/**
 * Gets the existing groups on PureCloud based on Prefix
 * @return {Promise.<Array>} PureCloud Group Objects
 */
function getExisting(){
    // Query bodies
    let groupSearchBody = {
        query: [
            {
                fields: ['name'],
                value: config.prefix,
                operator: 'OR',
                type: 'STARTS_WITH'
            }
        ]
    };

    return groupsApi.postGroupsSearch(groupSearchBody);
}

/**
 * Delete existing groups from PureCloud org
 * @returns {Promise}
 */
function remove(){
    return getExisting()
    .then(groups => {
        let del_group = [];

        if(groups.total > 0){
            groups.results.map(grp => grp.id).forEach(gid => {
                del_group.push(groupsApi.deleteGroup(gid));
            });
        }

        return Promise.all(del_group);
    });
}

/**
 * Add PureCloud groups based on installation data
 * @returns {Promise.<Object>} Group Data Object {"grp-name": "grp-id"}
 */
function create(logFunc, data){
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

function configure(logFunc, installedData, userId){
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

export default{
    provisioningInfoKey: 'group',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
