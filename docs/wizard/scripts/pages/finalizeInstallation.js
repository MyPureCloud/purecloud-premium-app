

/**
 * Installation page
 * @param {event} event
 * @todo Move actual PureCloud configuration and installation to separate method 
 */
export default function loadFinalizeInstallation(event){
    this._renderCompletePage(
        {
            title: "Finalize",
            subtitle: "Please review the items below and press Install to " + 
                        "install the apps and configuration."
        },
        null, this._getTemplate("wizard-page")
    )
    // Render left guide bar
    .then(() => this._renderModule(this._getTemplate('wizard-left'), {"highlight4": true}, 'wizard-left'))

        //Render contents of staging area
    .then(() => this._renderModule(this._getTemplate('wizard-final-content'), this.app.stagingArea, 'wizard-content'))
    
    //Render controls 
    .then(() => this._renderModule(this._getTemplate('wizard-final-control'), this.app.stagingArea, 'wizard-control'))  
    
    // Assign Event Handlers
    .then(() => {
        // Back to apps Installation
        this._setButtonClick(this, '#btn-prev', this._getPageSetter("appsCreation"));

        // Start installing yeah!!!
        // TODO: handle the possibility of rate limit being reached on the API calls
        this._setButtonClick(this, '#btn-install', this._getPageSetter("installingPage"));
    });
}
