/* 
*   NOTE: This sample uses ES6.
*/
import clientIDs from './clientIDs.js';

let clientApp = {};

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
// const redirectUri = "http://localhost:3000";
const redirectUri = "https://princemerluza.github.io/purecloud-premium-app/";

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();

// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(pcEnv){
    let clientId = clientIDs[pcEnv] || clientIDs['mypurecloud.com'];

    // Authenticate via PureCloud
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
            $("#callerName").text("");
            $("#callerNumber").text("");
            $("#callerArea").text("");

            clientApp.isCallActive = false;

        } else {
            let callerLocation = '';

            $("#callerName").text(caller.name);
            $("#callerNumber").text(caller.address);

            getLocalInfo(caller.address,{
                military: false,
                zone_display: 'area'
                }, object => {
                    $("#callerArea").text(object.time.display +' '+ object.location);
                    callerLocation = object.location;
                }
            );
            
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = true;

            clientApp.toastIncomingCall(callerLocation);
        }
    }
}

clientApp.toastIncomingCall = function(callerLocation){
    if(clientApp.hasOwnProperty('purecloudClientApi')){
        clientApp.purecloudClientApi.alerting.showToastPopup("Incoming Call", "From: " + callerLocation);
    }
}

clientApp.loadSupervisorView = function(){
    // Get all Queues
    client.callApi(
        '/api/v2/routing/queues', 
        'GET', 
        {  }, 
        { 'pageSize': 300 }, 
        {  }, 
        {  }, 
        null, 
        ['PureCloud Auth'], 
        ['application/json'], 
        ['application/json']
    ).then(data => {
        let queues = data.entities;

        let dropdown = $('#ddlQueues');
        dropdown.empty();
        dropdown.append('<option selected="true" disabled style="left: 0; width=100%">Queues</option>');
        dropdown.prop('selectedIndex', 0);

        for (var i = 1; i < queues.length; i++) {
            dropdown.append($('<option style="left: 0; width=100%"></option>').attr('value', queues[i].id).text(queues[i].name));
        }
    })
}

clientApp.subscribeToQueue = function(queue){
    // Create a Notifications Channel
    client.callApi(
        '/api/v2/notifications/channels', 
        'POST', 
        {  }, 
        {  }, 
        {  }, 
        {  }, 
        null, 
        ['PureCloud Auth'], 
        ['application/json'], 
        ['application/json']
    ).then(data => {
        clientApp.websocketUri = data.connectUri;
        clientApp.channelID = data.id;
        clientApp.socket = new WebSocket(clientApp.websocketUri);
        clientApp.socket.onmessage = clientApp.onSocketMessageQueue;
        clientApp.topicId = "v2.routing.queues." + queue + ".conversations"

        // Subscribe to Call Conversations of selected queue.
        let topic = [{"id": clientApp.topicId}];
        return notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
    })
}

// Handler for every Websocket message
clientApp.onSocketMessageQueue = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    // If a voice interaction (from queue) comes in
    if(topic === clientApp.topicId){
        let caller = eventBody.participants
                .filter(participant => participant.purpose === "customer")[0];
        
        let agent = eventBody.participants
                .filter(participant => participant.purpose === "agent")[0];
        
        let acd = eventBody.participants
                .filter(participant => participant.purpose === "acd")[0];
        
        let acdConnectedDt = new Date(acd.connectedTime);
        let acdEndDt = new Date(acd.endTime);
        let custConnectedDt = new Date(caller.connectedTime);
        let custEndDt = new Date(caller.endTime);

        // If incoming call
        if((acd.endTime === undefined) && (!clientApp.isCallActive)){
            $("#callerName").text(caller.name);
            $("#callerANI").text(caller.address);
            $("#callerDNIS").text(caller.calls[0].other.addressNormalized);
            $("#callerState").text(agent.calls[0].state);
            $("#callerDuration").text("00:00:00");

            var intervalId1 = setInterval(function() {
                var currentDate = new Date();        
                $("#callerWaitTime").text(new Date(currentDate - acdConnectedDt).toISOString().slice(11, -1).split('.')[0]);
            }, 1000);
            $("#callerWaitTime").attr("data-timer-id",intervalId1);
            console.log("Wait Time Interval ID: " + intervalId1);

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = true;
        } else if((acd.endTime === undefined) && (caller.endTime === undefined) && (clientApp.isCallActive)) {
            // If active call
            window.clearInterval($("#callerWaitTime").attr("data-timer-id"));
            console.log("Active Call: Clear Interval Wait Time");

            console.log("acdEndDt" + acdEndDt);
            console.log("acdConnectedDt" + acdConnectedDt);
            // console.log(new Date(acdEndDt - acdConnectedDt).toISOString().slice(11, -1));

            $("#callerName").text(caller.name);
            $("#callerANI").text(caller.address);
            $("#callerDNIS").text(caller.calls[0].other.addressNormalized);
            $("#callerState").text(agent.calls[0].state);
            // $("#callerWaitTime").text(new Date(acdEndDt - acdConnectedDt).toISOString().slice(11, -1));
            // $("#callerDuration").text(new Date(new Date() - acdEndDt).toISOString().slice(11, -1).split('.')[0]);

            var intervalId2 = setInterval(function() {
                console.log("Active Call: Set Interval Duration");
                var currentDate = new Date();        
                $("#callerDuration").text(new Date(currentDate - acdEndDt).toISOString().slice(11, -1).split('.')[0]);
            }, 1000);
            $("#callerDuration").attr("data-timer-id",intervalId2);
            console.log("Duration Interval ID: " + intervalId2);

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = true;
        } else if(agent.calls[0].state === "disconnected") {
            // If disconnected call

            // clearInterval(duration);
            // window.clearInterval($("#callerWaitTime"));
            // window.clearInterval($("#callerDuration"));
            window.clearInterval($("#callerWaitTime").attr("data-timer-id"));
            window.clearInterval($("#callerDuration").attr("data-timer-id"));

            $("#callerName").text(caller.name);
            $("#callerANI").text(caller.address);
            $("#callerDNIS").text(caller.calls[0].other.addressNormalized);
            $("#callerState").text(agent.calls[0].state);
            $("#callerWaitTime").text(new Date(acdEndDt - acdConnectedDt).toISOString().slice(11, -1));
            $("#callerDuration").text(new Date(custEndDt - custConnectedDt).toISOString().slice(11, -1));

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = false;
        } else if((caller.endTime !== undefined) && (!clientApp.isCallActive)){
            // clearInterval(duration);
            window.clearInterval($("#callerWaitTime"));
            window.clearInterval($("#callerDuration"));

            $("#callerName").text("");
            $("#callerANI").text("");
            $("#callerDNIS").text("");
            $("#callerState").text("");
            $("#callerWaitTime").text("");
            $("#callerDuration").text("");

            clientApp.isCallActive = false;
        }
                
        // // Put values to the fields
        // if((caller.endTime !== undefined) && (!clientApp.isCallActive)){
        //     $("#txtQueue").text("");

        //     $("#callerName").text("");
        //     $("#callerANI").text("");
        //     $("#callerDNIS").text("");
        //     $("#callerState").text("");
        //     $("#callerWaitTime").text("");
        //     $("#callerDuration").text("");

        //     clientApp.isCallActive = false;
        // } else {
        //     let connectedDt = new Date(acd.connectedTime);
        //     let endDt = new Date(acd.endTime);

        //     console.log("wait time || " + (new Date(endDt - connectedDt).toISOString().slice(11, -1)));
        //     $("#txtQueue").text(JSON.stringify(data));

        //     $("#callerName").text(caller.name);
        //     $("#callerANI").text(caller.address);
        //     $("#callerDNIS").text(caller.calls[0].other.addressNormalized);
        //     $("#callerState").text(agent.calls[0].state);
        //     $("#callerWaitTime").text(new Date(endDt - connectedDt).toISOString().slice(11, -1));
        //     $("#callerDuration").text("caller duration");

        //     // Makes sure that the field only changes the first time. 
        //     clientApp.isCallActive = true;
        // }
    }
}

export default clientApp
