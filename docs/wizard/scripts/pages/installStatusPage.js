

/**
 * Load the page to check for existing PureCloud objects
 * @todo Reminder: Get roles and groups have max 25 after query. 
 *          Get integration has max 100 before manual filter.
 */
export default function loadCheckInstallationStatus(event){
    this.app._loadDefaultOrder(this.app.defaultOrderFileName)
    .then(() => 
    this._renderCompletePage(
        {
            "title": "Checking Installation",
            "subtitle": "Check any existing PureCloud Objects that is set up by the App"
        }, 
        {
            objectPrefix: this.app.prefix
        },
        this._getTemplate('check-installation')
    ))
    .then(() => {
        this._setButtonClick(this, '#btn-start-wizard', this._getPageSetter("rolesCreation"));
    });

    this.app.getExistingGroups()
    // Check existing groups
    .then(data => {
        let group = (typeof data.results !== 'undefined') ? data.results : [];
        let context = {
            panelHeading: 'Existing Groups (' + group.length + ')',
            objType: 'groups',
            pureCloudObjArr: group,
            icon: 'fa-users'
        }

        return this._renderModule(this._getTemplate('existing-objects'), context, 'results-group', group);
    })

    // Add delete button handlers
    // data is the groups from PureCloud
    .then((data) => {
        data = data || [];
        data.forEach((group) => {
            let btnId = '#btn-delete-' + group.id;
            this._setButtonClick(this, btnId, () => {
                $('#modal-deleting').addClass('is-active');

                this.app.deletePureCloudGroup(group.id)
                .then((data) => this._getPageSetter("installStatusPage")())
                .catch(() => console.log(err));
            });
        })
    })

    //Error handler
    .catch(err => console.log(err));

    // Check existing roles
    this.app.getExistingRoles()
    .then(data => {
        let roles = data.entities;
        let context = {
            panelHeading: 'Existing Roles (' + roles.length + ')',
            objType: 'roles',
            pureCloudObjArr: roles,
            icon: 'fa-briefcase'
        }

        return this._renderModule(this._getTemplate('existing-objects'), context, 'results-role', roles);
    })
    // Add delete button handlers
    // data is the roles from PureCloud
    .then((data) => {
        data = data || [];
        data.forEach((role) => {
            let btnId = '#btn-delete-' + role.id;
            this._setButtonClick(this, btnId, () => {
                $('#modal-deleting').addClass('is-active');
                this.app.deletePureCloudRole(role.id)
                .then((data) => this._getPageSetter("installStatusPage")())
                .catch(() => console.log(err));
            });
        })
    })
    .catch(err => console.log(err));

    // Check existing Integrations
    this.app.getExistingApps()
    .then(data => {
        let integrations = data.entities.filter(entity => entity.name.startsWith(this.app.prefix));
        let context = {
            panelHeading: 'Existing Integrations (' + integrations.length + ')',
            objType: 'integrations',
            pureCloudObjArr: integrations,
            icon: 'fa-cogs'
        }
        return this._renderModule(this._getTemplate('existing-objects'), context, 'results-integration', integrations);
    })

    // Add delete button handlers
    // data is the roles from PureCloud
    .then((data) => {
        data = data || [];
        data.forEach((customApp) => {
            let btnId = '#btn-delete-' + customApp.id;
            this._setButtonClick(this, btnId, () => {
                $('#modal-deleting').addClass('is-active');
                this.app.deletePureCloudApp(customApp.id)
                .then((data) => this._getPageSetter("installStatusPage")())
                .catch(() => console.log(err));
            });
        })
    })
    
    //Error handler
    .catch(err => console.log(err));
}
