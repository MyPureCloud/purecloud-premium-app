import config from '../../config/config.js';

const platformClient = require('platformClient');
const architectApi = new platformClient.ArchitectApi();


/**
 * Get existing data tables based on the prefix
 * @returns {Promise.<Array>} PureCloud Integrations
 */
function getExisting(){
    return architectApi.getFlowsDatatables({ 
        pageSize: 100
    })
    .then((result) => {
        return result.entities.filter((dt) => 
                    dt.name.startsWith(config.prefix));
    });
}

/**
 * Delete all existing data tables
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
function remove(logFunc){
    logFunc('Uninstalling Data Tables...');

    return getExisting()
        .then(dts => {
            let del_dataTable = [];

            if(dts.length > 0){
                dts.map(dt => dt.id).forEach(dt_id => {
                    del_dataTable.push(
                        architectApi.deleteFlowsDatatable(dt_id,{
                            'force': true
                        }));
                });
            }
            
            return Promise.all(del_dataTable);
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
    let dataTablePromises = [];
    let dataTableData = {};

    // Create the data tables
    data.forEach((dt) => {
        let dataTableBody = {
            '$schema': 'http://json-schema.org/draft-04/schema#',
            'additionalProperties': false,
            'name': config.prefix + dt.name,
            'type': 'object',
            'schema': {
                '$schema': 'http://json-schema.org/draft-04/schema#',
                'type': 'object',
                'additionalProperties': false,
                'required': ['key']
            },
            'description': dt.description
        };

        // Create properties object with reference key
        let properties = {
            'key': {
                'title': dt.referenceKey,
                'type': 'string',
                '$id': '/properties/key',
                'displayOrder': 0
            }
        }

        // Build the custom fields
        dt.customFields.forEach((field, i) => {
            let tempSchema = {
                'title': field.name,
                'type': field.type,
                '$id': '/properties/' + field.name,
                'displayOrder': i + 1
            }
            // Add default if specified
            if(field.default) tempSchema.default = field.default;

            properties[field.name] = tempSchema;
        })
        dataTableBody.schema['properties'] = properties;

        dataTablePromises.push(
            architectApi.postFlowsDatatables(dataTableBody)
            .then((resdtult) => {
                logFunc('Created Data Table: ' + dt.name);
                dataTableData[dt.name] = dt.id;
            })
        );
    });

    return Promise.all(dataTablePromises)
    .then(() => dataTableData);
}

/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
function configure(logFunc, installedData, userId){
    return Promise.resolve();
}

export default {
    provisioningInfoKey: 'data-table',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}