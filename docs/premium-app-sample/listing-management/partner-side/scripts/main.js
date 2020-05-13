import view from './view.js';
import modal from '../../components/main.js';
import config from '../../config/config.js';
import globalConfig from '../../../config/global-config.js';
import blankCoreListingJSON from '../../config/core-listing-blank.js';
import blankPremiumAppJSON from '../../config/premium-app-listing-blank.js';
import cheatChat from './cheat-chat.js';

//Load purecloud and create the ApiClient Instance
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, globalConfig.appName);

// Create API instances
const contentManagementApi = new platformClient.ContentManagementApi();
const groupsApi = new platformClient.GroupsApi();
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const architectApi = new platformClient.ArchitectApi();
const organizationApi = new platformClient.OrganizationApi();

// Globals
let userMe = null; 
let managerGroup = null;
let listingDataTable = null;
let listingsStatus = null; 
let orgInfo = null;
let environment = '';


/**
 * Setup the the page and all authentication and data required
 * TODO: Setup is looking very familiar to edit-listing setup,
 *      might be worth modularizig setup.
 */
function setUp(){

    return usersApi.getUsersMe()
    .then((user) => {
        userMe = user;

        // Get org info ad set up Cheat Chat
        return organizationApi.getOrganizationsMe()
    })
    .then((org) => {
        orgInfo = org;

        // Get the id of the managers group and assign 
        return groupsApi.postGroupsSearch({
            "query": [
                {
                    "fields": ["name"],
                    "value": config.prefix,
                    "operator": "AND",
                    "type": "STARTS_WITH"
                }
            ]
        })
    })    
    .then((result) => {
        if(result.total > 0){
            console.log('Group detected.');
            managerGroup = result.results[0];
        } else {
            return new Promise((resolve, reject) => {
                modal.showInfoModal('Error', 
                'Manager group not found. There must be something wrong with ' +
                'your PET installation.',
                    () => {
                        reject('Manager group not found');
                    }
                )
            });
        }
        
        return checkUserAccess();
    })
    .then(userHasAccess => {
        let nextPromise = architectApi.getFlowsDatatables({
            pageSize: 100
        });
        
        // If user has no access then add them ot the group.
        if(!userHasAccess) {
            console.log('No access to group.');
            return groupsApi.postGroupMembers(managerGroup.id, {
                memberIds: [userMe.id],
                version: managerGroup.version
            })
            .then(() => {
                console.log('Added user to group.')
                return nextPromise;
            });
        } else {
            console.log('User has access to group.');
            // Check and store a reference to the data table for listings
            return nextPromise;
        }        
    })
    .then((results) => {
        listingDataTable = results.entities.find(
                        (dt) => dt.name.startsWith(config.prefix));

        if(listingDataTable){
            console.log('Data table detected.');
        } else {
            throw new Error('Data Table not found');
        }

        // Display the listings from the data table
        return reloadListings();
    })
    .then(() => {
        cheatChat.setUp(orgInfo, environment, listingDataTable);
    })
    .catch((e) => {
        console.error(e);
    });
}

/**
 * Check if user is part of the group for workspace access.
 */
function checkUserAccess(){
    return usersApi.getUsersMe({
        'expand': ['groups']
    })
    // Check if user is included in app group
    .then((user) => user.groups.map(g => g.id).indexOf(managerGroup.id) >= 0)
    .catch(e => console.error(e));
}

/**
 * Get current listing workspaces to display to page
 */
function reloadListings(){
    modal.showLoader('Loading listings...');

    return architectApi.getFlowsDatatableRows(listingDataTable.id, {
        pageSize: 100,
        showbrief: false
    })
    .then((rows) => {
        let listings = rows.entities;
        view.showListings('listing-cards-container', listings);

        console.log('Listed all listings');

        modal.hideLoader();
    })
    .catch((e) => {
        console.error(e);
    });
}

/**
 * Create a new listing workspace
 * @param {String} listingName 
 */
function createNewListing(listingName){
    modal.hideCreationModal();
    modal.showLoader('Creating listing...')

    let newWorkspaceId = null;

    // Create the workspace for the listing
    contentManagementApi.postContentmanagementWorkspaces({
        name: config.prefix + listingName
    })
    .then((workspace) => {
        newWorkspaceId = workspace.id;

        // Add group as member of workspace
        return contentManagementApi.putContentmanagementWorkspaceMember(
            newWorkspaceId,
            managerGroup.id,
            {
                "memberType": "GROUP"
            }
        );
    })
    .then((document) => {   
        console.log('Added group as member of workspace.');

        // Determine the last id of the latest listing
        return architectApi.getFlowsDatatableRows(listingDataTable.id, {
            pageSize: 100,
            showbrief: true
        })
    })
    .then((results) => {
        // NOTE: If all listings are deleted id'ing will restart to 1.
        // Will fix when it actually arrives, too edge case.
        let version = 1;

        // Get the highest id value then use the next one for the new listing
        if(results.entities.length > 0){
            let maxId = results.entities.reduce((max, current) => {
                let currentId = parseInt(current.key); 
                return (currentId > max) ? currentId : max;
            }, 1);

            version = maxId + 1;
        } 

        // Create the JSON for the app listing details
        let jsonInfo = blankCoreListingJSON;
        jsonInfo.name = listingName;
        let paJsonInfo = blankPremiumAppJSON;

        // Create the new row for the new listing
        return architectApi.postFlowsDatatableRows(listingDataTable.id, {
            key: version.toString(),
            listingDetails: JSON.stringify(jsonInfo),
            premiumAppDetails: JSON.stringify(paJsonInfo),
            attachments: '{}',
            workspaceId: newWorkspaceId
        });
    })
    .then(() => {
        console.log('Listing created.')

        modal.hideLoader();
        return reloadListings();
    })
    .catch(e => console.error(e));
}

/**
 * Delete the listing - it's entry on the data table and the
 * assosciated workspae
 * @param {String} id data table id of the listing
 */
function deleteListing(id){
    modal.showLoader('Deleting listing...');

    // Get the workspace info
    architectApi.getFlowsDatatableRow(listingDataTable.id, id, {
        showbrief: false
    })
    .then((row) => {
        let workspaceId = row.workspaceId;

        // Delete the workspace
        return contentManagementApi.deleteContentmanagementWorkspace(workspaceId);
    })
    .then(() => {
        console.log('Deleted workspace.');

        // Delete the row from the dat table
        return architectApi.deleteFlowsDatatableRow(listingDataTable.id, id)
    })
    .then(() => {
        console.log('Deleted the listing row.');

        modal.hideYesNoModal();
        modal.hideLoader();
        
        return reloadListings();
    })
    .catch(e => console.error(e));
}

/**
 * Display the modal confirmation for deleting a listing
 * @param {String} id workspaceId 
 */
function showListingDeletionModal(id){
    modal.showYesNoModal('Delete Listing', 
    'Are you sure you want  to delete this listing?',
    function(){
        deleteListing(id);
    },
    function(){
        modal.hideYesNoModal();
    })
}


// Global exposition
window.createNewListing = createNewListing;
window.showListingDeletionModal = showListingDeletionModal;

window.showCreationModal = modal.showCreationModal;
window.hideCreationModal = modal.hideCreationModal;

// Fix view with header, sidebar
view.finalizeToolView();

// Authenticate
environment = localStorage.getItem(globalConfig.appName + ':environment');
if(!environment){
    throw new Error('Environment not found from localstorage.');
}
let clientId = globalConfig.clientIDs[environment]; 
client.loginImplicitGrant(clientId, 
                        window.location.href.split('?')[0])
.then(() => {
    console.log('PureCloud Auth successful.');

    // Add modals to DOM
    modal.setup();

    modal.showLoader('Please wait...');
    
    return setUp(); 
})
.then(() => {
    modal.hideLoader();
})    
.catch((e) => {
    console.error(e);
});