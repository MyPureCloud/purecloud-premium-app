export default {
    clientID: 'e7de8a75-62bb-43eb-9063-38509f8c21af',

    // wizardUriBase: 'http://localhost:8080/wizard/',
    wizardUriBase: 'https://mypurecloud.github.io/purecloud-premium-app/wizard/',

    // The actual URL of the landing page of your web app or your web site (when wizard has been run).
    // previously - defined as premiumAppURL
    // redirectURLOnWizardCompleted: 'http://localhost:8080/premium-app-sample/index.html',
    redirectURLOnWizardCompleted: 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/index.html',

    // Genesys Cloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    // NOTE: During initial development please use ‘premium-app-example’.
    //            Once your premium app is approved an integration type will be created
    //            by the Genesys Cloud product team and you can update the name at that time.
    // previously - defined as appName
    premiumAppIntegrationTypeId: 'premium-app-example',

    // The minimum permission required for a user to access the Premium App.
    // NOTE: During initial development please use the default permission 
    //      'integration:examplePremiumApp:view'. Once your premium app is approved,
    //      the unique integration domain will be generated and this must be updated.
    // previously - defined as viewPermission
    premiumAppViewPermission: 'integration:examplePremiumApp:view',
    // Permissions required for running the Wizard App
    // all, premium, wizard, none (default)
    checkInstallPermissions: 'none',

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    defaultPcEnvironment: 'mypurecloud.com',
    defaultLanguage: 'en-us',
    // List available language assets - manage pcLangTag with possible formats like: en, en-US, en_US, en-CA, en_CA, ...
    // Values in lower case, using - or no separator
    availableLanguageAssets: {
        'en-us': 'English',
        'es': 'Español'
    },
    enableLanguageSelection: false,

    // The names of the query parameters to check in 
    // determining language and environment
    // Ex: www.electric-sheep-app.com?langTag=en-us&environment=mypurecloud.com
    languageQueryParam: 'langTag',
    genesysCloudEnvironmentQueryParam: 'environment',

    // Enable the optional 'Step 2' in the provisoning process
    // If false, it will not show the page or the step in the wizard
    enableCustomSetupPageBeforeInstall: true,
    // Enable the optional Post Custom Setup module in the install process
    // If true, it will invoke the postCustomSetup module (configure method) after the Genesys Cloud ones (provisioningInfo).
    enableCustomSetupStepAfterInstall: false,

    // Enable the dynamic build of the Install Summary on install.html page
    enableDynamicInstallSummary: false,

    // To be added to names of Genesys Cloud objects created by the wizard
    prefix: 'PREMIUM_EXAMPLE_',

    // These are the Genesys Cloud items that will be added and provisioned by the wizard
    provisioningInfo: {
        'role': [
            {
                'name': 'Role',
                'description': 'Generated role for access to the app.',
                'permissionPolicies': [
                    {
                        'domain': 'integration',
                        'entityName': 'examplePremiumApp',
                        'actionSet': ['*'],
                        'allowConditions': false
                    }
                ]
            }
        ],
        'group': [
            {
                'name': 'Supervisors',
                'description': 'Supervisors have the ability to watch a queue for ACD conversations.',
            }
        ],
        'app-instance': [
            {
                'name': 'Partner Enablement Tools',
                'url': 'https://genesysappfoundry.github.io/partner-enablement-tools/index.html?language={{pcLangTag}}&environment={{pcEnvironment}}',
                'type': 'standalone',
                'groups': ['Supervisors']
            }
        ],
        'oauth-client': [
            {
                'name': 'OAuth Client',
                'description': 'Generated Client that\'s passed to the App Backend',
                'roles': ['Role'],
                'authorizedGrantType': 'CLIENT_CREDENTIALS',

                /**
                 * This function is for other processing that needs
                 * to be done after creating an object.
                 * 'finally' is available for all the other
                 * resources configured in this config file.
                 * NOTE: Finally functions must return a Promise.
                 * For Client Credentials, normally it means
                 * passing the details to the backend.
                 * @param {Object} installedData the Genesys Cloud resource created
                 * @returns {Promise}    
                 */
                'finally': function (installedData) {
                    return new Promise((resolve, reject) => {
                        console.log('Fake Sending Credentials...');
                        setTimeout(() => resolve(), 2000);
                    });
                }
            }
        ]
    },

    // These are the necessary permissions that the user running the wizard must have to install or uninstall
    // Add your permissions to one of the modules, to post custom setup, or custom
    installPermissions: {
        'custom': [],
        'wizard': ['integrations:integration:view', 'integrations:integration:edit'],
        'postCustomSetup': [],
        'role': ['authorization:role:view', 'authorization:role:add', 'authorization:grant:add'],
        'group': ['directory:group:add'],
        'app-instance': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'interaction-widget': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'oauth-client': ['authorization:role:view', 'oauth:client:view', 'oauth:client:add', 'oauth:client:edit'],
        'widget-deployment': ['widgets:deployment:view', 'widgets:deployment:add', 'widgets:deployment:edit'],
        'ws-data-actions': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit', 'integrations:action:add', 'integrations:action:edit'],
        'data-table': ['architect:datatable:view', 'architect:datatable:add']
    },
    uninstallPermissions: {
        'custom': [],
        'wizard': [],
        'postCustomSetup': [],
        'role': ['authorization:role:delete'],
        'group': ['directory:group:delete'],
        'app-instance': ['integrations:integration:delete'],
        'interaction-widget': ['integrations:integration:delete'],
        'oauth-client': ['oauth:client:delete'],
        'widget-deployment': ['widgets:deployment:delete'],
        'ws-data-actions': ['integrations:integration:delete'],
        'data-table': ['architect:datatable:delete']
    },

    // These are the necessary scopes that the Vendor Wizard's OAuth Client (defined in Vendor's org) must have to allow the wizard to install or uninstall
    // This is for information only, to make it easier to find what the Vendor Wizard's OAuth Client (Implicit Grant type, Authorization Code Grant type) needs to be set with 
    installScopes: {
        'custom': [],
        'wizard': ['user-basic-info', 'integrations'],
        'postCustomSetup': [],
        'role': ['authorization'],
        'group': ['groups'],
        'app-instance': ['integrations'],
        'interaction-widget': ['integrations'],
        'oauth-client': ['authorization:readonly', 'user-basic-info', 'oauth'],
        'widget-deployment': ['widgets'],
        'ws-data-actions': ['integrations'],
        'data-table': ['architect']
    },
    uninstallScopes: {
        'custom': [],
        'wizard': [],
        'postCustomSetup': [],
        'role': ['authorization'],
        'group': ['groups'],
        'app-instance': ['integrations'],
        'interaction-widget': ['integrations'],
        'oauth-client': ['oauth'],
        'widget-deployment': ['widgets'],
        'ws-data-actions': ['integrations'],
        'data-table': ['architect']
    },

    /**
     * Sets and loads the language file based on the requestedLanguage parameter
     * @returns {Promise}
     */
    setPageLanguage(requestedLanguage) {
        // Manage pcLangTag with possible formats like: en, en-US, en_US, en-CA, en_CA, ...
        // Transform: replace _ with -, tolowercase
        // Check en-us, en-ca, ... - if not found, check en - if not found, use default language
        let langAssetCode = requestedLanguage.toLowerCase().replace('_', '-');
        if (Object.keys(this.availableLanguageAssets).includes(langAssetCode) === false) {
            langAssetCode = langAssetCode.split('-')[0];
            if (Object.keys(this.availableLanguageAssets).includes(langAssetCode) === false) {
                langAssetCode = this.defaultLanguage;
            }
        }

        if (this.enableLanguageSelection == true) {
            // Check if the langague select has been added already
            if (!document.getElementById('language-select')) {
                let contentHeader = document.getElementById('content-header-text');
                if (contentHeader) {
                    let languageHTML = "<span class='txt-language-selection' style='position: absolute; right: 80px;'>Language</span><select id='language-select' style='position: absolute; right: 3px;'>";
                    Object.keys(this.availableLanguageAssets).forEach(langKey => {
                        if (langKey == langAssetCode) {
                            languageHTML = languageHTML + "<option value='" + langKey + "' selected>" + this.availableLanguageAssets[langKey] + "</option>";
                        } else {
                            languageHTML = languageHTML + "<option value='" + langKey + "'>" + this.availableLanguageAssets[langKey] + "</option>";
                        }
                    });
                    languageHTML = languageHTML + "</select>";
                    contentHeader.innerHTML = contentHeader.innerHTML + languageHTML;
                    var selectElem = document.getElementById('language-select');
                    var thisConfig = this;
                    // When a new language is selected
                    selectElem.addEventListener('change', function () {
                        var selectedLang = selectElem.options[selectElem.selectedIndex].value;
                        localStorage.setItem(thisConfig.premiumAppIntegrationTypeId + ':language', selectedLang);
                        thisConfig.setPageLanguage(selectedLang)
                            .then(() => {
                                console.log('Localization applied: ', selectedLang);
                            })
                            .catch((e) => {
                                console.error(e);
                            });
                    })
                }
            }
        }

        return new Promise((resolve, reject) => {
            let fileUri =
                `${this.wizardUriBase}assets/languages/${langAssetCode}.json`;
            $.getJSON(fileUri)
                .done(data => {
                    Object.keys(data).forEach((key) => {
                        let els = document.querySelectorAll(`.${key}`);
                        for (let i = 0; i < els.length; i++) {
                            els.item(i).innerText = data[key];
                        }
                    })
                    resolve();
                })
                .fail(xhr => {
                    console.log('Language file not found.');
                    resolve();
                });
        });
    }

};
