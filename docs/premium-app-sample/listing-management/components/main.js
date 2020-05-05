import infoModal from './modals/info-modal.js';
import newListingModal from './modals/new-listing-modal.js';
import yesNoModal from './modals/yes-no-modal.js';
import loadingModal from './modals/loading-modal.js';

export default {
    /**
     * Add the modals to the DOM
     */
    setup(){
        const newListingModalEl = newListingModal.new();
        const newYesNoModalEl = yesNoModal.new();
        const loadingModalEl = loadingModal.new();
        const infoModalEl = infoModal.new();

        document.body.appendChild(newListingModalEl);
        document.body.appendChild(newYesNoModalEl);
        document.body.appendChild(loadingModalEl);
        document.body.appendChild(infoModalEl);
    },

    /**
     * Show the modal for creating a new listing
     */
    showCreationModal(){
        newListingModal.show();
    }, 

    /**
     * Hide the modal for creating a new listing
     */
    hideCreationModal(){
        newListingModal.hide();
    }, 

    /**
     * Show a message box that asks a yes/no question
     * @param {String} title title of the box
     * @param {String} question Question or prompt
     * @param {Function} yesCb callback function for Yes
     * @param {Function} noCb callback function for No
     */
    showYesNoModal(title, question, yesCb, noCb){
        yesNoModal.show(title, question, yesCb, noCb);
    },

    /**
     * Hides the yes/no question modal
     */
    hideYesNoModal(){
        yesNoModal.hide();
    },

    /**
     * Shows the modal for loading things
     * @param {String} message loading message
     */
    showLoader(message){
        loadingModal.show(message);
    },

    /**
     * Hide the loading modal
     */
    hideLoader(){
        loadingModal.hide();
    },

    /**
     * Just an info modal
     * // TODO: Maybe have different typees like warning or something
     * @param {String} title title of the message box
     * @param {String} message message in the message box
     * @param {Function} cb When the user press ok
     */
    showInfoModal(title, message, cb){
        infoModal.show(title, message, cb);
    },

    /**
     * Hide the info modal
     */
    hideInfoModal(){
        infoModal.hide();
    }
}