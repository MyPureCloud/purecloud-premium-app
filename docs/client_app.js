/*
    This sample uses ES6 coding standards.
*/
let setup = function(){
    // PureCloud OAuth information
    const platformClient = require('platformClient');
    const client = platformClient.ApiClient.instance;
    const clientId = "8c821827-57bd-4d44-8765-597d4a3220c5";
    const redirectUri = "http://localhost:3000";
    //const redirectUri = "https://princemerluza.github.io/purecloud-premium-app/";


    // API instances
    const usersApi = new platformClient.UsersApi();
    const notificationsApi = new platformClient.NotificationsApi();

    // Authenticate via PureCcloud
    client.setPersistSettings(true);
    client.loginImplicitGrant(clientId, redirectUri, { state: "state" })
    .then(data => {
        console.log(data);
        // Set access Token
        client.setAccessToken(data.accessToken);
        
        return notificationsApi.postNotificationsChannels();
    })
    // Create a new Channel and Subscribe to Changes
    .then( data => console.log(data) )
    .catch( e => console.log(err) );
}

let clientApp = {};
clientApp.setup = setup;

export default clientApp