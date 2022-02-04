/**
 * Various "enums" and mapping
 */

import config from "../config/config.js";

/**
 * For use in the main.js module. Determines the different 'pages' of the SPA
 * Value is the display name
 */
export const PAGES = {
    'ERROR': 'Error',
    'INDEX_PAGE': 'Home',
    'CUSTOM_SETUP': 'Custom Setup',
    'INSTALL_DETAILS': 'Install Details',
    'DONE': 'Installation Done',
    'UNINSTALL': 'Uninstall',
}

/**
 * Mapping of the provisingKey in each module to the URL to reach the resource
 */
export const GC_OBJECT_BASE_URL_MAP = {
    'app-instance': `/admin/#/integrations/apps/${config.premiumAppIntegrationTypeId}/`,
    'data-table': '/directory/#/admin/routing/datatables/',
    'group': '/directory/#/admin/directory/groups/',
    'interaction-widget': '/directory/#/admin/integrations/apps/embedded-client-app-interaction-widget/',
    'oauth-client': '/directory/#/admin/integrations/oauth/',
    'role': '/directory/#/admin/directory/rolesV2/',
    'widget-deployment': '/directory/#/admin/integrations/widgets/',
    'ws-data-actions': '/directory/#/admin/integrations/apps/custom-rest-actions/'
}
