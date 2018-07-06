
/**
 * Creatino of App instances
 * @param {event} event 
 */
export default function loadAppsCreation(event){
    // Clear all form inputs
    function clearAll(){
        $('#txt-instance-name').val("");
        $('#txt-instance-uri').val("");
        $('#list-instance-groups').val("");
        $('#txt-instance-name').addClass('is-danger');
        $('#txt-instance-uri').addClass('is-danger');
    }

    this.app.reevaluateStagedInstances();

    // Assign Event Handlers
    let assignEventHandler = function(){
        clearAll();

        // Add Instance
        this._setButtonClick(this, '#add-instance', () => {
            if ($('#txt-instance-name').hasClass('is-danger') ||
                $('#txt-instance-uri').hasClass('is-danger')){
                alert('Check your inputs.');
                return;
            }

            let instanceName = $('#txt-instance-name').val();
            let instanceType = $('input[name=instance-type]:checked', '#rad-instance-type').val();
            let instanceUri = $('#txt-instance-uri').val();
            let instanceGroups = $('#list-instance-groups').val();

            this.app.stageInstance(instanceName, instanceType, instanceUri, instanceGroups)

            clearAll();

            this._renderModule(this._getTemplate('wizard-instance-content'), this.app.stagingArea, 'wizard-content')
            .then($.proxy(assignEventHandler, this));
        });
        
        this._setValidateInput('#txt-instance-name');
        this._setValidateURL('#txt-instance-uri');
        

        // Clear form content      
        this._setButtonClick(this, '#clear-details', clearAll);     

        // Next button to Final Page
        this._setButtonClick(this, '#btn-next', this._getPageSetter("installationSummary"));

        // Back to groups Installation
        this._setButtonClick(this, '#btn-prev', this._getPageSetter("groupsCreation"));

        // Assign deletion for each instance entry
        for(let i = 0; i < this.app.stagingArea.appInstances.length; i++){
            let btnId = '#btn-delete-' + (i).toString();
            this._setButtonClick(this, btnId, () => {
                this.app.unstageInstance(i);
                this._renderModule(this._getTemplate('wizard-instance-content'), this.app.stagingArea, 'wizard-content')
                .then($.proxy(assignEventHandler, this));
            });
        }
    }

    this._renderCompletePage(
        {
            title: "Create App Instances",
            subtitle: "These is where you add instances of you app." +
                        "You could specify the landing page of each instance " +
                        "and the groups (must be created from the wizard) who " + 
                        "will have access to them."
        },
        null, this._getTemplate("wizard-page")
    )

    // Render left guide bar
    .then(() => this._renderModule(this._getTemplate('wizard-left'), {"highlight3": true}, 'wizard-left'))
    
    //Render contents of staging area
    .then(() => this._renderModule(this._getTemplate('wizard-instance-content'), this.app.stagingArea, 'wizard-content'))
    
    //Render controls 
    .then(() => this._renderModule(this._getTemplate('wizard-instance-control'), this.app.stagingArea, 'wizard-control'))

    // Assign Event Handlers
    .then($.proxy(assignEventHandler, this));
}
