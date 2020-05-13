import provisionTelephonyViews from '../views/provisiontelephony.js'
import loadingModalView from '../components/modals.js'

const platformClient = require('platformClient');
let usersApi = new platformClient.UsersApi();
let AuthorizationApi = new platformClient.AuthorizationApi();

const createDeveloperRoleFunctions = {

    /**
     * get list of users
     * @returns {function} create dropdown of user function
     */
    getOrgUser () {
        let opts = { 
            'pageSize': 100,
            'pageNumber': 1,
            'sortOrder': "ASC"
        };          
        usersApi.getUsers(opts)
            .then((data) => {
                console.log(`getUsers success! data: ${JSON.stringify(data, null, 2)}`);
                createDeveloperRoleFunctions.ceateUserDropDownOption(data.entities);
            })
            .catch((err) => {
                console.log('There was a failure calling getUsers');
                console.error(err);
            });
    },
    
    /**
     * create developer user function
     * @returns {function} putUser function
     */
    createDevUser () {
        let opts = { 
            'pageSize': 50,
            'pageNumber': 1, 
        };
    
        AuthorizationApi.getAuthorizationRoles(opts)
            .then((rolesList) => {
                console.log(`getAuthorizationRoles success! data: ${JSON.stringify(rolesList, null, 2)}`);
                let tempRoles = ""
                let roles = "";
                rolesList = rolesList.entities;
                rolesList.forEach(role => {
                    tempRoles ="\"" + role.id + "\"" ;
                    if(roles === "") {
                        roles = "["+tempRoles
                    }else {
                        roles = roles + "," + tempRoles;
                    }
                });
                roles = roles + "]"
                console.log(roles);
                createDeveloperRoleFunctions.putUserRoles (roles);
            })
            .catch((err) => {
                console.log('There was a failure calling getAuthorizationRoles');
                console.error(err);
                let errorMessage = 'Assigning developer role failed. ' + err.body.message;
                return provisionTelephonyViews.displayFailedModal('Create a Developer Role',errorMessage, 'Dismiss');
            });
    },
    
    /**
     * add roles to a user
     * @param {array} roles 
     * @returns {function} display success or failed modal
     */
    putUserRoles (roles) {
        let userId = document.getElementById('selectUser').value; 
        let username = document.getElementById(userId).text; 
        let body = roles;
        
        AuthorizationApi.putUserRoles(userId, body)
            .then((data) => {
                console.log(`putUserRoles success! data: ${JSON.stringify(data, null, 2)}`);
                loadingModalView.updateLoadingModal("Assigning Roles to user...")
                return provisionTelephonyViews.displaySuccessModal('Create a Developer Role', 'Developer role assigned to '+ username, 'Finish', '');         
            })
            .catch((err) => {
                console.log('There was a failure calling putUserRoles');
                console.error(err);
                let errorMessage = 'Assigning developer role failed. ' + err.body.message;
                return provisionTelephonyViews.displayFailedModal('Create a Developer Role',errorMessage, 'Dismiss');
            });
    },

    /**
     * create dropdown list
     * @param {option} obj 
     * @returns {function} create list function 
     */
    ceateUserDropDownOption(obj){
        let select = document.getElementById('selectUser');
        for(var key in obj) {
            createDeveloperRoleFunctions.createList(select, obj[key].name, obj[key].id);
        }
    },

    /**
     * create dropdown
     * @param {element} el 
     * @param {string} text 
     * @param {string} value 
     * @returns {option} returns option
     */
    createList(el, text, value) {
        let option = document.createElement('option');
        option.text = text;
        option.value = value;
        option.id = value;
        el.add(option);
    },
}

export default createDeveloperRoleFunctions