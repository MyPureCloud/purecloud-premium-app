

/** 
 * Stage the groups to be created.
 * Thi is the First step of the installation wizard.
 * @param {object} event 
 */
export default function loadGroupsCreation(event){
    let assignEventHandler = function(){
        // If add Group Button pressed then stage the group name 
        // from the form input
        this._setButtonClick(this, '#btn-add-group', () => {
            if ($('#txt-group-name').hasClass('is-danger')){
                alert('Check your inputs.');
                return;
            }

            this.app.stageGroup($('#txt-group-name').val().trim(),
                                $('#txt-group-description').val().trim(),
                            true);

            $('#txt-group-name').val('');
            $('#txt-group-description').val('');

            this._renderModule(this._getTemplate('wizard-group-content'), this.app.stagingArea, 'wizard-content')
            .then($.proxy(assignEventHandler, this));
        })    

        // Next button to Apps Creation
        this._setButtonClick(this, '#btn-next', this._getPageSetter("appsCreation"));

        // Back to check Installation
        this._setButtonClick(this, '#btn-prev', this._getPageSetter("rolesAssignment"));

        // Input validation for txt role name
        $('#txt-group-name').addClass('is-danger')
        this._setValidateInput('#txt-group-name');

        // Assign deletion for each role entry
        for(let i = 0; i < this.app.stagingArea.groups.length; i++){
            let btnId = '#btn-delete-' + (i).toString();
            this._setButtonClick(this, btnId, () => {
                this.app.unstageGroup(i);
                this._renderModule(this._getTemplate('wizard-group-content'), this.app.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            });
        }
    }

    this._renderCompletePage(
        {
            title: "Create groups",
            subtitle: "Groups are required to filter which members will have access to specific instances of the App."
        },
        null, this._getTemplate("wizard-page")
    )

    // Render left guide bar
    .then(() => this._renderModule(this._getTemplate('wizard-left'), {"highlight2": true}, 'wizard-left'))
    
    //Render contents of staging area
    .then(() => this._renderModule(this._getTemplate('wizard-group-content'), this.app.stagingArea, 'wizard-content'))
    
    //Render controls
    .then(() => this._renderModule(this._getTemplate('wizard-group-control'), {}, 'wizard-control'))

    // TODO: Input Validation and Error Handling
    .then($.proxy(assignEventHandler, this));
}
