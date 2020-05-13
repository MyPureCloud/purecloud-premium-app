import architectFlowFunctions from '../pages/architectflow.js'
import formModal from '../components/modals/form-modal.js'
import successModal from '../components/modals/success-modal.js'
import universalModal from '../components/modals.js'

const architectFlowViews = {

   /**
     * Trigger for btnInitiateArchitectDownload button click
     * @returns {function} Architect Flow Modal
     */
    btnInitiateArchitectDownloadEventListener() {
        document.getElementById("btnInitiateArchitectDownload").addEventListener("click", function () {
            architectFlowViews.displayArchitectFlowModal();
        }, false)
    },

    /**
     * Add list of queues dynamically to selectQueue dropdown
     * @returns {string and functions} queueId and queueText and modifyCallFlow 
     */
    selectQueueEventListener() {
        document.getElementById("selectQueue").addEventListener('change', function () {
            let selectedQueueId = selectQueue.options[selectQueue.selectedIndex].value;
            let selectedQueueText = selectQueue.options[selectQueue.selectedIndex].text;
            architectFlowFunctions.modifyCallFlow(selectedQueueId, selectedQueueText)
        })
    },


    /**
     * Trigger download of architect flow file in user's browser
     * @returns {string and function} filename,functions: downloadFlow,hideLoadingModal,showNewModal 
     */

    btnDownloadFlowEventListener() {    
            universalModal.showloadingModal("Downloading Architect Flow file...")
            let filename = "SampleCallFlow.i3InboundFlow";
            architectFlowFunctions.downloadFlow(filename);
            universalModal.hideLoadingModal();
            universalModal.showNewModal(successModal);
            successModal.show("Architect Flow", "Architect flow was successfully downloaded!","Finish", "")
    },

    /**
     * Access info modal, modify it's content and display it as Architect Flow Modal. And create download button.
     * @returns {Functions} getListofQueues,showNewModal,
     */
    displayArchitectFlowModal() {
        architectFlowFunctions.getListofQueues();
        let temporaryBody = 
        `
        <p class="card-text">
        <div class="form-group-inline">
          <label>Select queue you want to use for the flow</label>
          <select type="text" class="form-control" id="selectQueue" name="selectQueue" required>
            <option value ="" selected>Select Queue</option>
          </select>
          <div class="invalid-feedback"> Please select a Queue. </div>
        </div>
        </p>         
        `
        universalModal.showNewModal(formModal);
        formModal.show("Architect Flow", temporaryBody, "Download", "btnDownloadFlow")
        universalModal.validateForm('archValidation');
        architectFlowViews.selectQueueEventListener();
    },
}

export default architectFlowViews