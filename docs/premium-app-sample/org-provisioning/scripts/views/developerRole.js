import formModal from '../components/modals/form-modal.js'
import universalModal from '../components/modals.js'
import createDeveloperRoleFunctions from '../pages/developerRole.js'

const createDeveloperRoleView = {

    /**
     * eventlistener for developer role button
     * @returns {function} developer role modal
     */
    btnEventListener() {
        document.getElementById("btnDeveloperRole").addEventListener('click', function () {
            console.log('hello')
            universalModal.showloadingModal('Getting users name...');
            createDeveloperRoleView.displayDeveloperModal();  
        }, false)
    },

    /**
     * triggers functions that create developer role
     * @return {function}
     */
    btnCreateDev() {
        universalModal.showloadingModal('Fetching all default permission...');
        createDeveloperRoleFunctions.createDevUser()
    },

    /**
     * modify and call success modal
     * @param {string} title 
     * @param {string} message 
     * @param {string} nextAction 
     * @param {string} btnID 
     * @return {modal} success function
     */
    displaySuccessModal(title, message, nextAction, btnID) {
        universalModal.showNewModal(successModal);
        successModal.show(title,message, nextAction, btnID)
        this.btnEventListeners(btnID);  
    },

    /**
     * modify and display failed modal
     * @param {string} title 
     * @param {string} message 
     * @param {string} nextAction 
     * @returns {modal} failed modal
     */
    displayFailedModal(title, message, nextAction) {
        universalModal.hideLoadingModal();
        universalModal.showNewModal(errorModal);
        errorModal.show(title, message, nextAction)
    },

    /**
     * append developer role modal body
     * @returns {modal}
     */
    displayDeveloperModal () {
        let temporaryBody = 
        `
        <p class="card-text">
          <div class="form-group-inline">
            <label>Select a user you want to assign a Developer role</label>
            <select type="text" class="form-control" id="selectUser" required>
                <option value ="" selected>Select User</option>
            </select>
            <div class="invalid-feedback"> Please select a User. </div>
          </div>
        </p>
        `
        universalModal.showNewModal(formModal);
        formModal.show('Create a Developer Role', temporaryBody, 'Next', 'btnCreateDev');
        createDeveloperRoleFunctions.getOrgUser();
        universalModal.validateForm('devValidation');
    }   
}

export default createDeveloperRoleView