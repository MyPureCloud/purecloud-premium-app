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
    'widget-instance': `/admin/#/integrations/apps/${config.premiumWidgetIntegrationTypeId}/`,
    'data-table': '/directory/#/admin/routing/datatables/',
    'group': '/directory/#/admin/directory/groups/',
    'interaction-widget': '/directory/#/admin/integrations/apps/embedded-client-app-interaction-widget/',
    'oauth-client': '/directory/#/admin/integrations/oauth/',
    'role': '/directory/#/admin/directory/rolesV2/',
    'widget-deployment': '/directory/#/admin/integrations/widgets/',
    'ws-data-actions': '/directory/#/admin/integrations/apps/custom-rest-actions/',
    'gc-data-actions': '/directory/#/admin/integrations/apps/purecloud-data-actions/'
}

// Some resources do not allow direct access to the instance using their GUID
export const GC_CATEGORY_URL_MAP = {
    'byoc-cloud-trunk': '/directory/#/engage/telephonyAdmin/trunks/external',
    'open-messaging': '/directory/#/admin/messaging/platforms'
}

export const GC_CATEGORY_LABEL = {
    'app-instance': 'Premium App Instances',
    'widget-instance': 'Premium Widget Instances',
    'data-table': 'Architect Data Tables',
    'group': 'Groups',
    'interaction-widget': 'Interaction Widgets',
    'oauth-client': 'OAuth Clients (Client Credentials Grant)',
    'role': 'Role',
    'widget-deployment': 'Widget Deployments (Chat v2)',
    'ws-data-actions': 'Web Services Data Action Integrations',
    'gc-data-actions': 'Genesys Cloud Data Action Integrations',
    'byoc-cloud-trunk': 'BYOC Cloud Trunks',
    'open-messaging': 'Open Messaging Integrations',
    'post-custom-setup': 'Post Setup'
}
