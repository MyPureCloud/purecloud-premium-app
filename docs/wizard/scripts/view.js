import config from '../config/config.js';

const elLoadingModal = document.getElementById('loading-modal');

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
     * Hide the contents of the main section and replace it with the loading indicator
     */
    loadMain() {
        let elContent = document.querySelectorAll('#main-text')[0];
        let elLoading = document.querySelectorAll('#loading-container')[0];
        if(!elContent) return;
        if(!elLoading) return;

        elContent.style.display = 'none';
        elLoading.style.display = 'block';
    },

    /**
     * Show the contents of the main section and hide the loading indicator
     */
    unloadMain() {
        console.info('show-main');
        let elContent = document.querySelectorAll('#main-text')[0];
        let elLoading = document.querySelectorAll('#loading-container')[0];
        if(!elContent) return;
        if(!elLoading) return;

        elContent.style.display = 'block';
        elLoading.style.display = 'none';
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