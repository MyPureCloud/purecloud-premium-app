/* 
*   NOTE: This sample uses ES6.
*/
import clientIDs from './clientIDs.js';

let clientApp = {};

var test;

// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(pcEnv){
    // PureCloud OAuth information
    const platformClient = require('platformClient');
    const client = platformClient.ApiClient.instance;
    const clientId = clientIDs[pcEnv];
    // const redirectUri = "http://localhost:3000";
    const redirectUri = "https://princemerluza.github.io/purecloud-premium-app/";

    test = clientId;

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
        clientApp.topicId = "v2.users." + clientApp.userId + ".conversations.calls"

    // Subscribe to Call Conversations of Current user.
        let topic = [{"id": clientApp.topicId}];
        return notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
    }).then(data => console.log("Succesfully set-up Client App."))

    // Error Handling
    .catch( e => console.log(e) );
}

// Handler for every Websocket message
clientApp.onSocketMessage = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    console.log(topic);
    console.log(eventBody);
    // If a voice interaction (from queue) comes in
    if(topic === clientApp.topicId){
        let caller = eventBody.participants
                .filter(participant => participant.purpose === "customer")[0];

        // Put values to the fields
        if((caller.endTime !== undefined) && (!clientApp.isCallActive)){
            $("#callerName").html("");
            $("#callerNumber").html("");
            $("#callerArea").html("");

            clientApp.isCallActive = false;

        } else {
            let callerLocation = '';

            $("#callerName").html(caller.name);
            $("#callerNumber").html(caller.address);

            getLocalInfo(caller.address,{
                military: false,
                zone_display: 'area'
                }, object => {
                    $("#callerArea").html(object.time.display +' '+ object.location);
                    callerLocation = object.location;
                }
            );
            
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = true;

            clientApp.toastIncomingCall(callerLocation);
        }
    }
    

clientApp.toastIncomingCall = function(callerLocation){
    if(clientApp.hasOwnProperty('purecloudClientApi')){
        // clientApp.purecloudClientApi.alerting.showToastPopup("Incoming Call", "From: " + callerLocation);
        clientApp.purecloudClientApi.alerting.showToastPopup("Incoming Call", "From: " + test);
    }
}

export default clientApp
