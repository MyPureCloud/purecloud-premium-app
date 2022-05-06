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

function activateMarker(markerNumber){
    const marker1 = document.getElementById('marker-step-1');
    const marker2 = document.getElementById('marker-step-2');
    const marker3 = document.getElementById('marker-step-3');
    const marker4 = document.getElementById('marker-step-4');

    switch (markerNumber) {
        case 1:
            marker1.className = 'step step--incomplete step--active';               
            marker2.className = 'step step--incomplete step--inactive';               
            marker3.className = 'step step--incomplete step--inactive';               
            if(marker4) marker4.className = 'step step--incomplete step--inactive';  
            break;
        case 2:
            marker1.className = 'step step--complete step--inactive';               
            marker2.className = 'step step--incomplete step--active';               
            marker3.className = 'step step--incomplete step--inactive';               
            if(marker4) marker4.className = 'step step--incomplete step--inactive';  
            break;
        case 3:
            marker1.className = 'step step--complete step--inactive';               
            marker2.className = 'step step--complete step--inactive';               
            marker3.className = 'step step--incomplete step--active';               
            if(marker4) marker4.className = 'step step--incomplete step--inactive';
            break;
        case 4:
            marker1.className = 'step step--complete step--inactive';               
            marker2.className = 'step step--complete step--inactive';               
            marker3.className = 'step step--complete step--inactive';               
            if(marker4) marker4.className = 'step step--incomplete step--active';
            break;
    }
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
     * SModify the laoding modal message but doesn't affect visibility.
     * @param {String} message 
     */
    setLoadingModal(message) {
        console.info(`modal: ${message}`);
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
     * @param {String} titleClass (Optional) classname to add to the element. (For use in on-the-fly translation)
     * @param {String} msgClass (Optional) classname to add to the element. (For use in on-the-fly translation)
     * @param {Function} extraContentFunc (Optional) Function that returns an element to be added to #additional-error-content
     */
    setError(title, message, titleClass, msgClass, extraContentFunc){
        const elemTitle = document.getElementById('error-title');
        const elemMessage = document.getElementById('error-message');

        if(title) {
            elemTitle.className = '';
            if(titleClass) elemTitle.classList.add(titleClass);
            elemTitle.innerText = title
        };
        if(message) {
            elemMessage.className = '';
            if(msgClass) elemMessage.classList.add(msgClass);
            elemMessage.innerText = message;
        }

        if(extraContentFunc && typeof extraContentFunc == 'function'){
            const extraContainer = document.getElementById('additional-error-content');
            const extraElem = extraContentFunc();

            if(!extraElem instanceof Element) return;

            // Clear out all children elements of the container
            while (extraContainer.firstChild) {
                extraContainer.removeChild(extraContainer.lastChild);
            }
        
            // Add the extra content
            extraContainer.appendChild(extraElem);
        }
    },

    /**
     * Show contents of the specific page
     */
    displayPage(page){
        hideAllPages();

        switch(page){
            case PAGES.INDEX_PAGE:
                activateMarker(1);
                indexPage.style.display = 'block';
                break;
            case PAGES.CUSTOM_SETUP:
                activateMarker(2);

                customSetupPage.style.display = 'block';
                break;
            case PAGES.INSTALL_DETAILS:
                activateMarker(config.enableCustomSetupPageBeforeInstall ? 3 : 2);

                installDetailsPage.style.display = 'block';
                break;
            case PAGES.DONE:
                activateMarker(config.enableCustomSetupPageBeforeInstall ? 4 : 3);

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
        if (!config.enableCustomSetupPageBeforeInstall) {
            try {
                const parent = document.querySelectorAll('.steps')[0];
                const customMarker = document.getElementById('marker-step-2');
                parent.removeChild(customMarker);

                document.getElementById('marker-step-3').id = 'marker-step-2';
                document.getElementById('marker-step-4').id = 'marker-step-3';
            } catch(e) {
                console.error('Steps progress bar caused some unknown issue.')
                console.error(e);
            }
        }
    }
}