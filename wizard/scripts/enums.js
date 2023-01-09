/**
 * Various "enums" and mapping
 */

/**
 * For use in the main.js module. Determines the different 'pages' of the SPA
 * Value is the display name
 */
export const PAGES = {
  ERROR: "Error",
  INDEX_PAGE: "Home",
  CUSTOM_SETUP: "Custom Setup",
  INSTALL_DETAILS: "Install Details",
  DONE: "Installation Done",
  UNINSTALL: "Uninstall",
};

/**
 * Mapping of the provisingKey in each module to the URL to reach the resource
 */
export const GC_OBJECT_BASE_URL_MAP = {
  "oauth-client": "/directory/#/admin/integrations/oauth/",
  role: "/directory/#/admin/directory/rolesV2/",
};

export const GC_CATEGORY_URL_MAP = {};

export const GC_CATEGORY_LABEL = {
  "oauth-client": "OAuth Clients (Authorization Code)",
  role: "Role",
  "post-custom-setup": "Post Setup",
};
