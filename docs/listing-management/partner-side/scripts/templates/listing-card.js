import config from '../../../config/config.js';
import globalConfig from '../../../../config/global-config.js';
import listingStatus from  '../../../config/listing-status.js';

let t = document.createElement('template');
t.innerHTML = 
`
<div class="card listing-card">
  <div class="card-header">
    <span class="listing-name">Listing Name</span>
  </div>
  <div class="card-body">
    <div>
      Description: <span class="listing-description">Description of Listing</span>
    </div>
    <div>
        Status: <span class="listing-status">---</span>
    </div>
    <div>
        <span class="devfoundry-comment-notif">
            ----- Genesys commented on this Listing -----
        </span>
    </div>
    <hr>
    <div>
        <a class="btn btn-primary btn-view-listing">
            View
        </a>
        <a class="btn btn-primary btn-edit-listing">
            Edit
        </a>
        <a class="btn btn-primary btn-delete-listing">
            Delete
        </a>
    </div>
  </div>
</div>
`;

export default {
    new(dataTableRow){
        let el = document.importNode(t.content, true);

        let appDetails = JSON.parse(dataTableRow.listingDetails);
        let devFoundryNotes = JSON.parse(dataTableRow.devFoundryNotes);
        let status = dataTableRow.status;

        // Name
        let listingNameEl = el.querySelectorAll('.listing-name')[0];
        listingNameEl.innerText = appDetails.name;

        // Description
        let listingDescEl = el.querySelectorAll('.listing-description')[0];
        listingDescEl.innerText = 
            appDetails.shortDescription ? appDetails.shortDescription : '';

        // Status
        let listingStatusEl = el.querySelectorAll('.listing-status')[0];
        listingStatusEl.innerText = listingStatus[status];

        // DevFoundry Notes
        let elDevNotes = el.querySelectorAll('.devfoundry-comment-notif')[0];
        if(devFoundryNotes.length > 0){
            elDevNotes.style.display = 'block';
        }

        // Button Visibilities (Normally OFF)
        let btnDelete = el.querySelectorAll('.btn-delete-listing')[0];
        let btnEdit = el.querySelectorAll('.btn-edit-listing')[0];
        let btnView = el.querySelectorAll('.btn-view-listing')[0];
        btnDelete.style.display = 'none';
        btnEdit.style.display = 'none';
        btnView.style.display = 'none';
        
        // Show delete always when testing
        if(globalConfig.isTestEnvironment)  btnDelete.style.display = '';

        switch(status){
            case 'IN_PROGRESS':
                btnDelete.style.display = '';
                btnEdit.style.display = '';
                break;
            case 'PENDING_APPROVAL':
                btnView.style.display = '';
                break;
            case 'FOR_REVISION':
                btnEdit.style.display = '';
                break;
            case 'APPROVED':
                btnEdit.style.display = '';
                break;
            case 'LIVE':
                btnEdit.style.display = '';
                break;
            default:
                break;
        }

        // Delete Button
        if(btnDelete.style.display != 'none'){
            btnDelete.onclick = function(){
                showListingDeletionModal(dataTableRow.key);
            };
        }

        // Edit Button
        if(btnEdit.style.display != 'none'){
            btnEdit.onclick = function(){
                window.location.href = 
                    config.redirectUriBase + 
                    'edit-listing.html' +
                    '?id=' + dataTableRow.key;
            };
        }

        // View Button
        if(btnView.style.display != 'none'){
            btnView.onclick = function(){
                window.location.href = 
                    config.redirectUriBase + 
                    'edit-listing.html' +
                    '?id=' + dataTableRow.key +
                    '&readonly=true';
            };
        }

        return el;
    }
};;