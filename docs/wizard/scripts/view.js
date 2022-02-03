import config from '../config/config.js';
import { PAGES } from './enums.js'

const elLoadingModal = document.getElementById('loading-modal');

const indexPage = document.getElementById('index-page');
const customSetupPage = document.getElementById('custom-setup-page');
const installDetailsPage = document.getElementById('install-details-page');
const installDonePage = document.getElementById('installation-finished-page');
const errorPage = document.getElementById('error-page');
const uninstallPage = document.getElementById('uninstall-page');

function hideAllPages(){    
    indexPage.style.display = 'none';
    customSetupPage.style.display = 'none';
    installDetailsPage.style.display = 'none';
    installDonePage.style.display = 'none';
    errorPage.style.display = 'none';
    uninstallPage.style.display = 'none';
}

export default {
    /**
     * Show the loading modal 
     * @param {String} message 
     */
    showLoadingModal(message) {
        console.info(`modal: ${message}`);

        elLoadingModal.style.display = '';
        elLoadingModal.querySelectorAll('.modal-message')[0]
            .innerText = message ? message : '';
    },

    /**
     * Hide the loading modal
     */
    hideLoadingModal() {
        console.info('hide-modal');
        if(!elLoadingModal) return;
        elLoadingModal.style.display = 'none';
    },

    /**
     * Hide the language sleection
     */
    hideLanguageSelection(){
        const elemLangContainer = document.getElementById('language-container');
        elemLangContainer.style.display = 'none';
    },
    
    /**
     * Set the text in the error page
     * @param {String} title title of the error
     * @param {String} message messaage of the error
     */
    setError(title, message){
        const elemTitle = document.getElementById('error-title');
        const elemMessage = document.getElementById('error-message');

        if(title) elemTitle.innerText = title;
        if(message) elemMessage.innerText = message;
    },

    /**
     * Show contents of the specific page
     */
    displayPage(page){
        hideAllPages();
        switch(page){
            case PAGES.INDEX_PAGE:
                indexPage.style.display = 'block';
                break;
            case PAGES.CUSTOM_SETUP:
                customSetupPage.style.display = 'block';
                break;
            case PAGES.INSTALL_DETAILS:
                installDetailsPage.style.display = 'block';
                break;
            case PAGES.DONE:
                installDonePage.style.display = 'block';
                break;
            case PAGES.UNINSTALL:
                uninstallPage.style.display = 'block';
                break;
            case PAGES.ERROR:
                errorPage.style.display = 'block';
                break;
            default:
                hideAllPages();
                console.error('Unknown page');
                break;
        }
    },

    /**
     * Show the message that the product is available
     */
    showProductAvailable() {
        let elAvailable = document.getElementById('available');
        let elUnavailable = document.getElementById('unavailable');
        elAvailable.style.display = '';
        elUnavailable.style.display = 'none';
    },

    /**
     * Show the message that the product is unavailable.
     */
    showProductUnavailable() {
        let elAvailable = document.getElementById('available');
        let elUnavailable = document.getElementById('unavailable');
        elAvailable.style.display = 'none';
        elUnavailable.style.display = '';
    },

    /**
     * Show the username of the current user for greeting purposes
     */
    showUserName(userName) {
        let el = document.getElementById('username');
        if (el) {
            el.innerText = userName;
        }
    },


    setupPage() {
        if (!config.enableCustomSetupPageBeforeInstall && document.getElementById('progress-custom-setup')) {
            document.getElementById('progress-custom-setup')
                .style.display = 'none';
        }
    }
}