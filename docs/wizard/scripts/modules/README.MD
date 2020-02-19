A module represents a type of PureCloud resource like a Role, a Group, etc.

Each module should have one file with the the following functions: getExisting(), remove(), create(), and configure().

These functions should also be exported by the script module and a 'provisioningInfoKey' key which identifies the keyword for the resource that should match the key word from the installationData in config.

When adding a module, also add the import to wizard.js and add the reference to the modules array.