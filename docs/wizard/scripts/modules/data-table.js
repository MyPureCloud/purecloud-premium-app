import config from '../../config/config.js';

const platformClient = require('platformClient');
const architectApi = new platformClient.ArchitectApi();


/**
 * Get existing data tables based on the prefix
 * @returns {Promise.<Array>} Genesys Cloud Integrations
 */
async function getExisting() {
    let dataTables = []

    // Internal recursive function for calling 
    // next pages (if any) of the data tables
    let _getDataTables = async (pageNum) => {
        let data = await architectApi.getFlowsDatatables({
                            pageSize: 100,
                            pageNumber: pageNum,
                            name: config.prefix + "*"
                        });
        
        if (data.pageCount > 0) {
            data.entities
                .filter((dt) =>
                    dt.name.startsWith(config.prefix))
                .forEach(table =>
                    dataTables.push(table));

            if (pageNum < data.pageCount) {
                return _getDataTables(pageNum + 1);
            }
        }
    }

    try {
        await _getDataTables(1)
    } catch(e) {
        console.error(e)
    }

    return dataTables;

}

/**
 * Delete all existing data tables
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) {
    logFunc('Uninstalling Data Tables...');

    let instances = await getExisting();
    let del_tables = [];

    if (instances.length > 0) {
        instances.forEach(entity => {
            del_tables.push(
                architectApi.deleteFlowsDatatable(entity.id, {
                    'force': true
                }));
        });
    }

    return Promise.all(del_tables);
}

/**
 * Add Genesys Cloud instances based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
async function create(logFunc, data) {
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
            if (field.default) tempSchema.default = field.default;

            properties[field.name] = tempSchema;
        })
        dataTableBody.schema['properties'] = properties;

        dataTablePromises.push((async () => {
            let result = await architectApi.postFlowsDatatables(dataTableBody);

            logFunc('Created Data Table: ' + dt.name);
            dataTableData[dt.name] = result.id;
        })());
    });

    await Promise.all(dataTablePromises)
    return dataTableData;
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
    provisioningInfoKey: 'data-table',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}