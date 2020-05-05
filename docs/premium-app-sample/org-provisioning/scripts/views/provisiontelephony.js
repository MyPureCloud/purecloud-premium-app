
import provisionTelephonyFunctions from '../pages/provisiontelephony.js'
import formModal from '../components/modals/form-modal.js'
import errorModal from '../components/modals/error-modal.js'
import successModal from '../components/modals/success-modal.js'
import universalModal from '../components/modals.js'
import infoModal from '../components/modals/info-modal.js'

const provisionTelephonyViews = {
    
    /**
     * Pass value to btnEventListeners event listener and test it to meet it's corresponding function base on condition.
     * @param {ID} btnID
     * @returns {function} Depends on parameter and condition.
     */
    btnEventListeners(btnID) {
        document.getElementById(btnID).addEventListener('click', function () {
            switch(btnID) {
                case 'btnByocEnable':
                    provisionTelephonyViews.selectTelephony();
                    break;
                case 'btnLearnMore':
                    provisionTelephonyViews.tbdButtonFunction();
                    break;
                case 'btnDisplaySiteModal':
                    provisionTelephonyViews.displaySiteModal();
                    break;
                case 'btnTrunkModal':
                    provisionTelephonyViews.displaySipTrunkModal();
                    break;
                case 'btnClose':
                    universalModal.hideLoadingModal();
                    break;
                case 'btnStartProvision':
                    provisionTelephonyViews.displayLocationModal();
                    break;
                case 'btnTwillio':
                    provisionTelephonyFunctions.determineSipEndpoint(this.getAttribute('id'));
                    provisionTelephonyViews.displayProvisioningModal();
                    break;
                case 'btnNexmo':
                    provisionTelephonyViews.tbdButtonFunction();
                // temporarily commented out --------------------------------------------------------
                    // provisionTelephonyFunctions.determineSipEndpoint(this.getAttribute('id'));
                    // provisionTelephonyViews.displayProvisioningModal();
                    break;
                case 'btnProvisionTelephony':
                    provisionTelephonyFunctions.listProducts();
                    break;
                case 'btnDisplaySimulateCall':
                  provisionTelephonyViews.displaySimulateCallModal();
                      break;
            }    
        }, false)
    },  
    btnCreateSIPTrunk() {
        universalModal.showloadingModal('Sip Trunk is being created...');
        provisionTelephonyFunctions.createTrunk();
    },
    btnCreateLocation() {
        universalModal.showloadingModal('Location is being created...');
        provisionTelephonyFunctions.createLocation();
    },
    btnCreateSite() {
        universalModal.showloadingModal('Getting Telephony Providers Edges Sites...');
        provisionTelephonyFunctions.getEdgeSite();
    },

    /**
     * Modify success modal's content and displays it.
     * @param {String} title 
     * @param {String} message 
     * @param {String} nextAction 
     * @param {String} btnID
     * @returns {modal} success modal
     */
    displaySuccessModal(title, message, nextAction, btnID) {
        universalModal.showNewModal(successModal);
        successModal.show(title,message, nextAction, btnID)
        console.log(btnID)
        this.btnEventListeners(btnID);  
    },

    /**
     * Modify error modal's content and displays it.
     * @param {String} title 
     * @param {String} message 
     * @param {String} nextAction 
     */
    displayFailedModal(title, message, nextAction) {
        universalModal.hideLoadingModal();
        universalModal.showNewModal(errorModal);
        errorModal.show(title, message, nextAction)
    },

    /**
     * Choose telephony between Twillio and Nexmo, Nexmo is not yet functional.
     * @returns {modal} info modal
     * @returns {function} trigger btnEventListeners
     */
    selectTelephony() {
        let temporaryBody = 
        `
        <div class="card-deck" style="text-align: center;">
          <button type="button" id="btnTwillio" class="card bg-primary-modified card-body" data-dismiss="modal" data-toggle="modal" style="color: white; text-align: center !important;">    
            <p class="card-text" style="text-align: center !important;"> 
              <a href="#" style="color: white; text-align: center !important;"> Twillio </a> 
            </p>  
          </button>
          <button type="button" id="btnNexmo" class="card bg-primary-modified" data-dismiss="modal" data-toggle="modal" style="color: white;">
            <div class="card-body text-center">
              <p class="card-text"> 
                <a href="#" style="color: white;"> Nexmo </a> 
              </p>
            </div>
          </button>
        </div> 
        `;    
        universalModal.showNewModal(formModal);
        document.getElementById('form-modal').querySelector('.modal-footer').style.display = 'none'
        formModal.show('Select Telephony', temporaryBody, '', '');
        this.btnEventListeners('btnTwillio');
        this.btnEventListeners('btnNexmo');
    },

    /**
     * Access info modal, modify its content. Inform user on what will be provisioned. Display as Provisioning Modal.
     * @returns {modal} Provisioning Modal
     * @returns {function} Trigger btnEventListeners
     */
    displayProvisioningModal() {
        let temporaryBody = 
        `
        <p class="card-text">
          <p>We will be provisioning the following items:</p>
          <p>Create a Location</p>
          <p>Create a Site</p>
          <p>Create a BYOC SIP Trunk to Twilio</p>
        </p> 
        `
        universalModal.showNewModal(infoModal);
        infoModal.show('Provision Telephony - Twilio', temporaryBody, 'Next', 'btnStartProvision');
        this.btnEventListeners('btnStartProvision');
    },

    /**
     * Access form modal, input form contents that will be filled up by users in creating Sip Trunk. And displays the modal.
     * @returns {modal} Sip Trunk Modal
     * @returns {function} Triggers btnEventListeners
     * @returns {function} Validate input
     */
    displaySipTrunkModal() {

        let temporaryBody = 
        `
        <div class="card-text">
        <p>Create BYOC SIP Trunk</p>
        <p>Now I’ll provision a SIP trunk for your new site that is linked to your Twilio SIP trunk. I need the following information:</p>
          <div class="form-group-inline ">
            <div style="align-items: initial; display: flex;">
              <label>External Trunk Name:</label>
              <a href="#" data-toggle="tooltip" title="Enter your desired trunk name &#10 e.g: Dev Cloud">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtSIPExternalTrunk" required>
            <div class="invalid-feedback">This field is required</div>
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label style="font-size: 14px">Inbound SIP Termination Identifier:</label>
              <a href="#" data-toggle="tooltip"
                title="Your termination URI is unique within your PureCloud Organization"s region. &#10The termination URI will be used by the 3rd party PBX or Carrier to direct SIP traffic to PureCloud ">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtInboundSIP" required>
            <div class="invalid-feedback">This field is required</div>
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>SIP Servers or Proxies:</label>
              <a href="#" data-toggle="tooltip"
                title="This is a list of SIP servers or intermediate proxies where all outgoing &#10request should be sent to, regardless of the destination address of the request.&#10 If no port is specified, the inbound listen port will be used.">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtSIPServers" required>
            <div class="invalid-feedback">This field is required</div>
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>User Name:</label>
              <a href="#" data-toggle="tooltip" title="User name to send when trunk is challenged for the realm.">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtUserName">
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Password:</label>
              <a href="#" data-toggle="tooltip" title="Password to send when trunk is challenged for the realm.">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="password" class="form-control" id="txtSIPPassword">
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Realm:</label>
              <a href="#" data-toggle="tooltip" title="Realm must match the username and password to be sent.">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtSIPRealm">
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Address:</label>
              <a href="#" data-toggle="tooltip"
                title="Specific overriding caller ID adddress to use as the outgoing origination address. &#10May be a URI or raw phone number">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtSIPCallingAddress" required>
            <div class="invalid-feedback">This field is required</div>
          </div>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Name:</label>
  
              <a href="#" data-toggle="tooltip"
                title="Specific overriding caller ID name to use as the outgoing origination address. &#10May be a URI or raw phone number">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" id="txtSIPCallingName">
          </div>        
      </div> 
        `
        universalModal.showNewModal(formModal);
        formModal.show('Provision Telephony - Twilio', temporaryBody, 'Next', 'btnCreateSIPTrunk');
        universalModal.validateForm('trunkValidation');
        this.btnEventListeners('trunkValidation'); 
    },

    /**
     * modify form modal and append Location modal information
     * @returns {modal} Location Modal
     * @returns {function} assign information to modal
     * @returns {function} validate input
     */
    displayLocationModal () {
        let temporaryBody = 
        `
        <p class="card-text">
          <p>Create a Location</p>
          <p>To create a location we need the following information:</p>
          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Name of location:</label>
              <a href="#" data-toggle="tooltip" title="Enter your desired location name &#10 e.g: Headquarters ">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" name="txtLocation" id="location" required>
            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Address:</label>
              <a href="#" data-toggle="tooltip" title="Please make sure that you will input a verified address">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" name="txtAddress" id="address" required>
            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>City:</label>
              <a href="#" data-toggle="tooltip" title="City">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" name="txtCity" id="city" required>

            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>State/Province/Region: </label>
              <a href="#" data-toggle="tooltip" title="State or Province">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" name="txtState" id="state" required>

            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Zip / Postal Code:</label>
              <a href="#" data-toggle="tooltip" title="Zip or Postal Code">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <input type="text" class="form-control" name="txtZip" id="zip" required>

            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Country:</label>
              <a href="#" data-toggle="tooltip" title="Country">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <select type="text" class="form-control" id="selectCountry" required>
              <option value="" disabled selected>Choose Country</option>
            </select>
            <div class="invalid-feedback"> Please select a Country. </div>
          </div>

          <div class="input-field form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Emergency Number:</label>
              <a href="#" data-toggle="tooltip"
                title="Please make sure to follow the number format E.164 &#10 e.g: +12345678911">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <label for="emergencyNumber" class="static-value"></label>
            <input type="tel" minlength="10" maxlength="13" required id="emergencyNumber" class="form-control"
              name="emergencyNumberInput" placeholder="+XX XXX XXX XXXX" required>
            <div class="invalid-feedback">This field is required!</div>
          </div>
        </p>
        `
        universalModal.showNewModal(formModal);
        provisionTelephonyFunctions.countryList();
        formModal.show('Provision Telephony - Twilio', temporaryBody, 'Next', 'btnCreateLocation'); 
        universalModal.validateForm('locationValidation');
    },

    /**
     * modify form modal and append Site modal information
     * @returns {modal} Site Modal
     * @returns {function} assign information to modal
     * @returns {function} validate input
     */
    displaySiteModal () {
        let temporaryBody = 
        `
        <p class="card-text">
          <p>Create a Site</p>
          <p>To create a site we need the following information:</p>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Site Name:</label>
              <a href="#" data-toggle="tooltip" title="Enter your desired site name &#10 e.g: Daily City">
                <i class="material-icons"> help </i>
              </a>
            </div>

            <input type="text" class="form-control" name="txtSiteName" id="siteName" required>
            <div class="invalid-feedback">This field is required!</div>
          </div>

          <div class="form-group-inline">
            <div style="align-items: initial; display: flex;">
              <label>Time Zone:</label>
              <a href="#" data-toggle="tooltip" title="Select a Time Zone">
                <i class="material-icons"> help </i>
              </a>
            </div>
            <select type="text" class="form-control" id="timeZone" required>
              <option value="" selected>Choose Time Zone</option>
            </select>
            <div class="invalid-feedback"> Please select a Time zone. </div>
          </div>
        </p>
        `
        universalModal.showNewModal(formModal);
        provisionTelephonyFunctions.getTimezone();
        formModal.show('Provision Telephony - Twilio', temporaryBody, 'Next', 'btnCreateSite');
        universalModal.validateForm('siteValidation');
    },

    /**
     * Displays instruction on how to simulate the newly created trunk.
     * @returns {modal} Simulation instruction
     */
    displaySimulateCallModal() {
      let temporaryBody = 
      `
      <p class="card-text">
        <p>Please go to the newly created Site under Admin->Telephony->Sites and on the “Simulate Call” tab 
        please try to simulate an outbound call to verify that all of the telephony components are probably working.</p>
      </p> 
      `
      universalModal.showNewModal(infoModal);
      infoModal.show('Provision Telephony - Twilio', temporaryBody, 'Dismiss', '');
     
  },

    /**
     * Temporary function for unavailable buttons
     * @returns {alert} 
     */

    tbdButtonFunction() {
        alert("This function is currently unavailable!")
    }

    
}


export default provisionTelephonyViews

