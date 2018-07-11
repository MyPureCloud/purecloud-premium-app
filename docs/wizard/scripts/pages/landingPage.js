/**
 * Loads the landing page of the app
 */
export default function loadLandingPage(event){
    console.log(this);
    this.app._pureCloudAuthenticate()
    .then(() => {
        this.app.getOrgInfo()
        .then(orgData => {
            let orgFeature = orgData.features;

            this._renderCompletePage({
                    "title": this.app.languageContext.pages.landingPage.title,
                    "subtitle": this.app.languageContext.pages.landingPage.subtitle
                }, 
                {
                    features: orgFeature,
                    startWizardFunction: this.loadRolesPage
                },
                this._getTemplate("landing-page")
            )
            .then(() => {
                this._setButtonClick(this, '#btn-check-installation', this._getPageSetter("installStatusPage"));
            });
        });
    });
    
}