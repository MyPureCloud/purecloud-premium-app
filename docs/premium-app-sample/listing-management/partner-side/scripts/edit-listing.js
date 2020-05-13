import view from './view.js';
import modal from '../../components/main.js';
import config from '../../config/config.js';
import globalConfig from '../../../config/global-config.js';
import validators from '../../config/validators.js';
import assignValidator from './util/assign-validator.js';
import fieldInterface from './util/field-interface.js';
import hardwareAddons from './special-fields/hardware-addons.js';
import useCases from './special-fields/use-cases.js';
import fileUploaders from './special-fields/file-uploaders.js';
import cheatChat from './cheat-chat.js';

//Load purecloud and create the ApiClient Instance
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, globalConfig.appName);

// Create API instances
const contentManagementApi = new platformClient.ContentManagementApi();
const groupsApi = new platformClient.GroupsApi();
const usersApi = new platformClient.UsersApi();
const architectApi = new platformClient.ArchitectApi();
const organizationApi = new platformClient.OrganizationApi();

// Id will be taken from query param but will be saved as state after 
// PC Auth
var urlParams = new URLSearchParams(window.location.search);

// Globals
let listingId = urlParams.get('id');
let readOnly = urlParams.get('readonly');
let listingRow = {};
let listingRowNotes = [];
let listingDetailsObject = {};
let premiumAppDetailsObject = {};
let listingRowAttachments = {};
let listingDataTable = null;
let validatorFunctions = {
    core: [],
    premium: []
};
let orgInfo = '';
let managerGroup = null;
let workspaceId = null;
let environment = '';
let isPremiumApp = false; // Don't set this manually, use the setPremiumAppStatus()

/**
 * Initial Setup for the page
 */
function setUp(){
    // Set up Cheat Chat
    return organizationApi.getOrganizationsMe()
    .then((org) => {
        orgInfo = org;
        
        // Load the listing details
        return getListingDataTable()
    })
    .then(() => {
        return loadListing();
    })
    .then(() => {
        cheatChat.setUp(orgInfo, environment, listingDataTable);

        if(readOnly == 'true'){
            view.setReadOnlyListing();
        }

        assignValidators();
        assignEventHandlers();
        validateAllFields();
        setupSpecialFields();
        setupPreviewWindow();
    });
}

/**
 * Open the listing document and put info on the fields
 */
function loadListing(){
    return architectApi.getFlowsDatatableRow(listingDataTable.id, listingId, {
        showbrief: false
    })
    .then((row) => {
        console.log(row);
        // Keep references to the cells data
        listingRow = row;
        listingDetailsObject = JSON.parse(listingRow.listingDetails);
        premiumAppDetailsObject = JSON.parse(listingRow.premiumAppDetails);
        listingRowAttachments = JSON.parse(listingRow.attachments);
        listingRowNotes = JSON.parse(listingRow.devFoundryNotes);
        workspaceId = listingRow.workspaceId;

        setPremiumAppStatus(premiumAppDetailsObject._isPremiumApp);

        view.fillEditListingFields(listingDetailsObject, premiumAppDetailsObject);
        view.showDevFoundryNotes(listingRowNotes);
    })
}

/**
 * Validate and then save the listing back to the data table 
 * @returns {Promise} 
 */
function saveListing(){
    // Validate files to be uploaded
    if(!validateAttachments()){
        modal.showInfoModal(
            'Error',
            'Please check your file uploads.',
            () => {
                modal.hideInfoModal();
            });
        return;
    }

    modal.showLoader('Saving Listing...');
    buildFields();
    

    // Listing Row. Turn the entire thing to string
    listingRow.listingDetails = JSON.stringify(listingDetailsObject);
    listingRow.premiumAppDetails = JSON.stringify(premiumAppDetailsObject); 
    console.log(listingRow);

    // Attachments
    modal.showLoader('Uploading Files...');
    return fileUploaders.uploadFiles(platformClient, client, workspaceId)
    .then((documents) => {
        console.log("Successfully Uploaded Files!");
        let attachments = listingRowAttachments;

        // NOTE: Special edge case here, clear all existing screenshots
        // if at least 1 screenshot is to be uploaded.
        let screenshotDoc = documents.find((doc) => {
            return doc.name.startsWith('screenshot')
        });
        if(screenshotDoc){
            for(let i = 0; i < validators.attachments.screenshots.maxFiles; i++){
                delete attachments[`screenshots-${i+1}`];
            }
        }

        // Modify the attachments object for new values
        documents.forEach(doc => {
            attachments[doc.name] = {
                sharingUri: doc.sharingUri,
                id: doc.id
            }    
        })

        listingRow.attachments = JSON.stringify(attachments);

        // Save to Data Table
        return architectApi.putFlowsDatatableRow(
                listingDataTable.id, 
                listingRow.key, {
                    body: listingRow
                });
    })
    .then(() => {
        modal.hideLoader();
        modal.showInfoModal('Success', 'Listing saved.', () => {
            modal.hideInfoModal();
        })

        console.log('Saved the listing!');
    })
    .catch((e) => console.error(e));
}


/**
 * Builds the fields of the Core and Premium App Details.
 * Sets it to the global listingDetailsObject and premiumAppDetailsObject
 */
function buildFields(){
    // Build the "normal" fields
    let listingDetails = validators.listingDetail;
    Object.keys(listingDetails).forEach((key) => {
        listingDetailsObject[key] = fieldInterface.getFieldValue(
                                    listingDetails[key].type, 
                                    listingDetails[key].fieldId);
    });
    // Premium App Basic Fields
    let premiumAppRules = validators.premiumAppDetails;
    Object.keys(premiumAppRules).forEach((key) => {
        premiumAppDetailsObject[key] = fieldInterface.getFieldValue(
                                    premiumAppRules[key].type, 
                                    premiumAppRules[key].fieldId);
    });
    premiumAppDetailsObject._isPremiumApp = isPremiumApp;

    // Special fields
    buildSpecialFields();
}

/**
 * Get and store the reference to the data table for listings
 */
function getListingDataTable(){
    return architectApi.getFlowsDatatables({
        pageSize: 100
    })
    .then((results) => {
        listingDataTable = results.entities.find(
                        (dt) => dt.name.startsWith(config.prefix));

        if(listingDataTable){
            console.log('Data table detected.');
        } else {
            throw new Error('Data Table not found');
        }
    })
}

/**
 * Loop through the rules defined in config/validators.js
 * and attach the event listeners that will respond to the validation.
 */
function assignValidators(){
    // Listing Details
    let listingDetails = validators.listingDetail;
    Object.keys(listingDetails).forEach((key) => {
        validatorFunctions.core.push(assignValidator(listingDetails[key]));
    });

    // Premium App
    let premiumAppRules = validators.premiumAppDetails;
    Object.keys(premiumAppRules).forEach((key) => {
        console.log(key);
        validatorFunctions.premium.push(assignValidator(premiumAppRules[key]));
    });
}

/**
 * Run the validators of all fields, happens at start ofpage
 * and before saving
 */
function validateAllFields(){
    let allValid = true;

    // Basic Fields Core
    validatorFunctions.core.forEach((validator) => {
        if(!validator.func.apply(validator.context)){
            allValid = false;
        }
    });
    if(isPremiumApp){
        // Basic Fields Premium
        validatorFunctions.premium.forEach((validator) => {
            if(!validator.func.apply(validator.context)){
                allValid = false;
            }
        });
    }
    

    //Special Fields
    if(!validateSpecialFields()) allValid = false;

    // Attachments
    if(!validateAttachments()) allValid = false;

    return allValid;
}

/**
 * Calls all setup functions for the special fields
 */
function setupSpecialFields(){
    // Setup some functionalities of the 'special' fields
    hardwareAddons.setup();
    useCases.setup();
    fileUploaders.setup(platformClient, client, listingRowAttachments);
}

/**
 * Builds the JSON parts and put to the global listingDetailsObject
 */
function buildSpecialFields(){
    // Build the Hardware Addons Field
    listingDetailsObject.hardwareAddons = hardwareAddons.buildField();

    // Build the useCaes field
    listingDetailsObject.useCases = useCases.buildField();
}

/**
 * Run validation for special fields
 * @returns {Boolean}
 */
function validateSpecialFields(){
    let valid = true;

    // TODO: Hardware Add-ons
    // TODO: Use Cases

    return valid;
}

/**
 * Run validation for attachment files
 * @returns {Boolean}
 */
function validateAttachments(){
    let valid = true;

    // Attachemnt fields
    if(!fileUploaders.validateFields(isPremiumApp)) valid = false;

    return valid;
}

function submitListing(){
    modal.showYesNoModal(
    'Confirmation', 
    'Are you sure you\'re ready to submit this for approval? This will save the listing before submission',
    () => {
        modal.hideYesNoModal();
        // Validate fields first
        if(!validateAllFields()){
            modal.showInfoModal(
                'Error',
                'Some fields are incorrect. Please review.',
                () => {
                    modal.hideInfoModal();
                });

            return;
        }

        saveListing()
        .then(() => {
            modal.hideInfoModal();
            modal.showLoader('Submitting Listing to DevFoundry...'); 
            return cheatChat.submitListing(listingRow);
        })
        .then(() => {
            listingRow.status = 'PENDING_APPROVAL';

            return architectApi.putFlowsDatatableRow(
                listingDataTable.id,
                listingRow.key, 
                { body: listingRow });
        })
        .then(() => {
            modal.hideLoader();
            modal.showInfoModal('Success', 'Successfully submitted ' 
            + 'the listing request.',
            () => {
                modal.hideInfoModal();
                window.location.href = config.redirectUriBase;
            });
        })
        .catch((e) => console.error(e));
        
        modal.hideYesNoModal();
    }, 
    () => {
        modal.hideYesNoModal();
    })
}

function setPremiumAppStatus(status){
    isPremiumApp = status;
    if(isPremiumApp){
        view.showPremiumAppFields();
        validateAllFields();
    }else{
        view.hidePremiumAppFields();
    }
}

/**
 * Send a message to the preview listing iframe to update it 
 * with the listings' info
 */
function updatePreviewListing(){
    // Get current value of the fields
    buildFields();

    view.reloadPreviewWindow();
}

function setupPreviewWindow(){
    view.setupPreviewWindow({
        listingDetails: listingDetailsObject,
        premiumAppDetails: premiumAppDetailsObject,
        listingRowAttachments: listingRowAttachments
    }, config.root);
}

/**
 * Assign event handlers to the static buttons
 * and other elements
 */
function assignEventHandlers(){
    // Preview Listing Iframe load the src
    document.getElementById('preview-listing-iframe').src = 
            config.root + '/components/listing-preview/index.html';

    // Save
    document.getElementById('btn-save')
            .addEventListener('click', function(e){
                e.preventDefault(); // Prevent submitting form
                saveListing();
            });
    
    // Cancel
    document.getElementById('btn-cancel')
            .addEventListener('click', function(e){
                e.preventDefault(); // Prevent submitting form
                window.location.href = config.redirectUriBase;
            });

    // Submit
    document.getElementById('btn-submit')
            .addEventListener('click', function(e){
                e.preventDefault(); // Prevent submitting form

                submitListing();
            });

    // Premium App Checkbox
    document.getElementById('cb-p-app-isPremiumApp')
    .addEventListener('change', function(){
        // Call setter only if it's a togglet to prevent infinite loop
        if(this.checked != isPremiumApp){
            setPremiumAppStatus(this.checked);
        }
    })
}


// Add modals to DOM
modal.setup();
modal.showLoader('Loading Listing...');

// Default view setup for the page
view.finalizeToolView();

// Authenticate
environment = localStorage.getItem(globalConfig.appName + ':environment');
if(!environment){
    throw new Error('Environment not found from localstorage.');
}
let clientId = globalConfig.clientIDs[environment]; 
client.loginImplicitGrant(clientId, 
                    window.location.href.split('?')[0],
                    {state: listingId})
.then((data) => {
    listingId = client.authData.state;
    console.log('PureCloud Auth successful.');

    // Checks if the query params are already in the URL, if not readd it
    if(!window.location.href.includes('?')){
        history.pushState({}, '', window.location.href + '?id=' + listingId);
    }

    
    return setUp(); 
})
.then(() => {
    modal.hideLoader();
})    
.catch((e) => {
    console.error(e);
});

console.log(client);