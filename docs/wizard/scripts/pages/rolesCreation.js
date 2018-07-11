
/**
 * Roles creation page
 * @param {*} event 
 */
export default function loadRolesCreation(event){
    let assignEventHandler = function(){
        // If add Role Button pressed then stage the role name 
        // from the form input
        this._setButtonClick(this, '#btn-add-role', () => {
            if ($('#txt-role-name').hasClass('is-danger')){
                alert('Check your inputs.');
                return;
            }

            let roleName = $('#txt-role-name').val().trim();
            let roleDescription = $('#txt-role-description').val().trim();
            this.app.stageRole(roleName, roleDescription, this.app.premiumAppPermission, true)

            // Clear fields
            $('#txt-role-name').val('');
            $('#txt-role-description').val('');

            this._renderModule(this._getTemplate('wizard-role-content'), this.app.stagingArea, 'wizard-content')
            .then($.proxy(assignEventHandler, this));
        });

        // Input validation for txt role name
        $('#txt-role-name').addClass('is-danger')
        this._setValidateInput('#txt-role-name');

        // Next button to Apps Creation
        this._setButtonClick(this, '#btn-next', this._getPageSetter('rolesAssignment'));

        // Back to check Installation
        this._setButtonClick(this, '#btn-prev', this._getPageSetter('installStatusPage'));

        // Assign deletion for each role entry
        for(let i = 0; i < this.app.stagingArea.roles.length; i++){
            let btnId = '#btn-delete-' + (i).toString();
            this._setButtonClick(this, btnId, () => {
                this.app.unstageRole(i);
                this._renderModule(this._getTemplate('wizard-role-content'), this.app.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            });
        }
    }

    this._renderCompletePage(
        {
            title: this.app.languageContext.pages.rolesCreation.title,
            subtitle: this.app.languageContext.pages.rolesCreation.subtitle
        },
        null, this._getTemplate("wizard-page")
    )

    // Render left guide bar
    // TODO: Change to Roles in template
    .then(() => this._renderModule(this._getTemplate('wizard-left'), {"highlight1": true}, 'wizard-left'))

    //Render contents of staging area
    .then(() => this._renderModule(this._getTemplate('wizard-role-content'), this.app.stagingArea, 'wizard-content'))

    //Render controls
    .then(() => this._renderModule(this._getTemplate('wizard-role-control'), {}, 'wizard-control'))

    // Event Handlers
    .then($.proxy(assignEventHandler, this));
}
