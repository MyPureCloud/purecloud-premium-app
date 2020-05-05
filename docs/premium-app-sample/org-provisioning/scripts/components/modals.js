import loadingModal from './modals/loading-modal.js';
import provTelephony from '../views/provisiontelephony.js';
import devRole from '../views/developerRole.js';
import archFlow from '../views/architectflow.js';
import formModal from './modals/form-modal.js';
const manipulateModals={
    
    /**
     * set up loading element
     * @returns {element}
     */
    setupLoadingEl() {
        const newLoadingEl = loadingModal.new();
        document.body.appendChild(newLoadingEl);
    },

    /**
     * show loading modal
     * @param {string} message 
     * @returns {modal} loading
     */
    showloadingModal(message) {
        loadingModal.show(message);
    },

    /**
     * hide loding modal
     * @returns {function} hide loading modal
     */
    hideLoadingModal(){
        loadingModal.hide();
    },

    /**
     * update modal message
     * @param {string} message
     * @returns {function} 
     */
    updateLoadingModal(message){
        loadingModal.updateText(message);
    },

    /**
     * function to open new modal and delete previous modal
     * @param {modal} appendThisModal
     * @returns {modal} 
     */
    showNewModal(appendThisModal) {
        let formModal = document.getElementById('form-modal')
        let successModal= document.getElementById('success-modal')
        let infoModal= document.getElementById('info-modal')
        let errorModal = document.getElementById('error-modal')
        this.hideLoadingModal();
        if (typeof(formModal) != 'undefined' && formModal != null) {
            formModal.remove();
        }
        if (typeof(successModal) != 'undefined' && successModal != null) {
            successModal.remove();
        }
        if (typeof(errorModal) != 'undefined' && errorModal != null) {
            errorModal.remove();
        }
        if (typeof(infoModal) != 'undefined' && infoModal != null) {
            infoModal.remove();
        }
        let newModal = appendThisModal.new();
        document.body.appendChild(newModal);
    },

    /**
     * validates form modal
     * @param {string} nextAction 
     * @returns {function}
     */
    validateForm(nextAction) {
        let forms = document.getElementsByClassName('needs-validation');
        let validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
            if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                formModal.hide();
                if(nextAction ==='locationValidation') {
                    provTelephony.btnCreateLocation();
                }else if(nextAction ==='siteValidation') {
                    provTelephony.btnCreateSite();
                }else if(nextAction ==='trunkValidation') {
                    provTelephony.btnCreateSIPTrunk();
                }else if(nextAction ==='devValidation') {
                    devRole.btnCreateDev();
                }else if(nextAction ==='archValidation') {
                    archFlow.btnDownloadFlowEventListener();
                }
            }
            form.classList.add('was-validated');
        }, false);
        });
    },
}

export default manipulateModals