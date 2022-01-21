# Modules

## Description

A module represents a type of Genesys Cloud resource like a Role, a Group, etc.

## Virtual Functions

Each module should have one file with the the following async functions: getExisting, remove, create, and configure.
We recommend looking at the existing modules before creating your own.

```javascript
/**
 * Gets the existing _____ on Genesys Cloud based on Prefix
 * @return {Promise.<Array>} Genesys Cloud Group Objects
 */
async function getExisting() { }
```

```javascript
/**
 * Delete existing _______ from Genesys Cloud org
 * @param {Function} logFunc logs any messages
 * @returns {Promise}
 */
async function remove(logFunc) { }
```

```javascript
/**
 * Add Genesys Cloud ______ based on installation data
 * @param {Function} logFunc logger for messages
 * @param {Object} data the installation data for this type
 * @returns {Promise.<Object>} were key is the unprefixed name and the values
 *                          is the Genesys Cloud object details of that type.
 */
async function create(logFunc, data) { }
```

```javascript
/**
 * Further configuration needed by this object
 * Called after eveything has already been installed
 * @param {Function} logFunc logger for messages
 * @param {Object} installedData contains everything that was installed by the wizard
 * @param {String} userId User id if needed
 */
async function configure(logFunc, installedData, userId) { }
```

## Module export

These functions should also be exported by the script module and a 'provisioningInfoKey' key which identifies the keyword for the resource that should match the key word from the installationData in config.

Example:
```javascript
export default {
    provisioningInfoKey: 'group',

    getExisting: getExisting,
    remove: remove,
    create: create,
    configure: configure
}
```

## Add Module to Wizard

When adding a module, also add the import to [wizard.js](../wizard.js) and add the reference to the modules array.

```javascript
// Module scripts
import roleModule from './modules/role.js';
import groupModule from './modules/group.js';
import appInstanceModule from './modules/app-instance.js';
import OAuthClientModule from './modules/oauth-client.js';
import dataTableModule from './modules/data-table.js';
import interactionWidget from './modules/interaction-widget.js';
import wsDataActions from './modules/ws-data-actions.js';
import widgetDeployment from './modules/widget-deployment.js';
// -->> Add your modules here...
```

## post-custom-setup.js

[wizard.js](../post-custom-setup.js) is a special and reserved file that does not need to follow the other module requirements.

You can write code in the file that will be run after every object has been installed. (eg. Sending credentials or installation data to another system)
