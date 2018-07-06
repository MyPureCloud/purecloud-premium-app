
/**
 * Page where user can choose which additional roles to assign to himself/herself
 * @param {*} event 
 */
export default function loadRolesAssignment(event){
    this._renderCompletePage(
        {
            title: "Assign Roles",
            subtitle: "Assign roles to your current user."
        },
        null, this._getTemplate("wizard-page")
    )
    // Render left guide bar
    // TODO: Change to Roles in template
    .then(() => this._renderModule(this._getTemplate('wizard-left'), {"highlight1": true}, 'wizard-left'))

    //Render contents of staging area
    .then(() => this._renderModule(this._getTemplate('wizard-role-assign-content'), this.app.stagingArea, 'wizard-content'))

    //Render controls
    .then(() => this._renderModule(this._getTemplate('wizard-role-assign-control'), {}, 'wizard-control'))

    // Event Handlers
    .then(() => {
        // Take note of which roles to add to user after creation
        this._setButtonClick(this, '#btn-next', () => {
            for(let i = 0; i < this.app.stagingArea.roles.length; i++){
                if($('#check-' + i.toString()).prop("checked") == true){
                    this.app.setStagedRoleAssignment(i, true);
                } else {
                    this.app.setStagedRoleAssignment(i, false);
                }
            }

            // Next button to Groups Creation
            $.proxy(this._getPageSetter("groupsCreation"), this)();
        });

        // Back to Roles Creation
        this._setButtonClick(this, '#btn-prev', this._getPageSetter("rolesCreation"));
    });
}
