/*
*   NOTE: This sample uses ES6.
*/
let clientApp = {};

// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(){
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
        
    // Get Details of current User and save to Client App
        return usersApi.getUsersMe();
    }).then( userMe => {
        clientApp.userId = userMe.id;

    // Create a Notifications Channel
        return notificationsApi.postNotificationsChannels();
    }).then(data => {
        clientApp.websocketUri = data.connectUri;
        clientApp.channelID = data.id;
        clientApp.socket = new WebSocket(clientApp.websocketUri);
        clientApp.socket.onmessage = clientApp.onSocketMessage;

    // Subscribe to Call Conversations of Current user.
        let topic = [{"id": "v2.users." + clientApp.userId + ".conversations.calls"}];
        return notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
    }).then(data => console.log("Succesfully set-up Client App."))

    // Error Handling
    .catch( e => console.log(e) );
}

// Handler for every Websocket message
clientApp.onSocketMessage = function(event){
    console.log(event.data);
}

export default clientApp