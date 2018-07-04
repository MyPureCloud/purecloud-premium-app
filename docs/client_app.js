/* 
*   NOTE: This sample uses ES6.
*/
import clientIDs from './clientIDs.js';

let clientApp = {};
let conversationIDs = [];

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
// const redirectUri = "http://localhost:3000";
const redirectUri = "https://princemerluza.github.io/purecloud-premium-app/";

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();

var onloadConvID;

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
    .catch(e => console.log(e));
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
        dropdown.append('<option selected="true" disabled">Queues</option>');
        dropdown.prop('selectedIndex', 0);

        for (var i = 1; i < queues.length; i++) {
            dropdown.append($('<option></option>').attr('value', queues[i].id).text(queues[i].name));
        }
    })
}

clientApp.subscribeToQueue = function(queue){
    // Check if there is an active call
    var startDt = new Date();
    startDt.setHours(0,0,0,0);
    startDt.toUTCString();
    var endDt = new Date(startDt + 1);
    endDt.setHours(24,0,0,0);
    endDt.toUTCString();

    var body = 
        {
            interval: startDt.toJSON() + "/" + endDt.toJSON(),
            order: "asc",
            orderBy: "conversationStart",
            paging: {
                pageSize: 25,
                pageNumber: 1
            },
            segmentFilters: [
                {
                    type: "and",
                    predicates: [
                        {
                            type: "dimension",
                            dimension: "queueId",
                            operator: "matches",
                            value: queue
                        }
                    ]
                }
            ],
            conversationFilters: [
                {
                    type: "or",
                    predicates: [
                        {
                            type: "dimension",
                            dimension: "conversationEnd",
                            operator: "notExists",
                            value: null
                        }
                    ]
                }
            ]
        }

    client.callApi(
        '/api/v2/analytics/conversations/details/query', 
        'POST', 
        {  }, 
        {  }, 
        {  }, 
        {  }, 
        body, 
        ['PureCloud Auth'], 
        ['application/json'], 
        ['application/json']
    ).then(data => {
        if(Object.keys(data).length > 0) {
            onloadConvID = data.conversations[0].conversationId;
            conversationIDs.push(onloadConvID);

            let caller = data.conversations[0].participants
                .filter(participant => participant.purpose === "external")[0];
            
            let acd = data.conversations[0].participants
                .filter(participant => participant.purpose === "acd")[0];

            let acdSegment = acd.sessions[0].segments
                .filter(segment => segment.segmentType === "interact")[0];
            
            var tableRef = document.getElementById('tblCallerDetails').getElementsByTagName('tbody')[0];
            var newRow   = tableRef.insertRow(tableRef.rows.length);
        
            // Populate Conversation ID column
            var idCell  = newRow.insertCell(0);
            var idText  = document.createTextNode(onloadConvID);
            idCell.appendChild(idText);
        
            // Populate Name column
            var nameCell  = newRow.insertCell(1);
            var nameText  = document.createTextNode(caller.participantName);
            nameCell.appendChild(nameText);
        
            // Populate ANI column
            var aniCell  = newRow.insertCell(2);
            var aniText  = document.createTextNode(caller.sessions[0].ani);
            aniCell.appendChild(aniText);
        
            // Populate DNIS column
            var dnisCell  = newRow.insertCell(3);
            var dnisText  = document.createTextNode(caller.sessions[0].dnis);
            dnisCell.appendChild(dnisText);
        
            // Populate State column
            var stateCell  = newRow.insertCell(4);
            var stateText  = document.createTextNode("connected");
            stateCell.appendChild(stateText);
        
            // Populate Wait Time column
            var waitCell  = newRow.insertCell(5);
            var waitText  = document.createTextNode((new Date(acdSegment.segmentEnd) - (new Date(acdSegment.segmentStart))).toISOString().slice(11, -1));
            waitCell.appendChild(waitText);
        
            // Populate Duration column
            var durationCell  = newRow.insertCell(6);
            var durationText  = document.createTextNode((new Date(caller.endTime)) - (new Date(caller.connectedTime)));
            durationCell.appendChild(durationText);

            // let conversationStart = new Date(data.conversations[0].conversationStart);
            // let acdStart = new Date(acdSegment.segmentStart);
            // let acdEnd = new Date(acdSegment.segmentEnd);

            // $("#supName").text(caller.participantName);
            // $("#supANI").text(caller.sessions[0].ani);
            // $("#supDNIS").text(caller.sessions[0].dnis);
            // $("#supState").text("connected");
            // $("#supWaitTime").text(new Date(acdEnd - acdStart).toISOString().slice(11, -1));

            // // Start timer for Call Duration
            // var intervalId = setInterval(function() {
            //     var currentDate = new Date();        
            //     $("#supDuration").text(new Date(currentDate - conversationStart).toISOString().slice(11, -1).split('.')[0]);
            // }, 1000);
            // $("#supDuration").attr("onload-timer-id",intervalId);
        }
    }).catch(e => console.log("ERROR CALLING API: " + e + "|| REQUEST BODY: " + body));

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
        // Check to see if Conversation details is already displayed in the view
        if (conversationIDs.includes(eventBody.id)) {
            console.log("UPDATE TABLE ROW || " + JSON.stringify(data));
            clientApp.updateTableRow(data);            
        } else {
            // Add to pool of Conversations already displayed in the view
            conversationIDs.push(eventBody.id);
            console.log("ADD TABLE ROW || " + JSON.stringify(data));
            console.log("CONVERSATION IDS || " + conversationIDs.toString());

            // Call addTableRow function
            clientApp.addTableRow(data);
        }    
    
        console.log("WEB SOCKET || " + JSON.stringify(data));

        // If new socket message for the active call on page load
        if(onloadConvID === eventBody.id){
            // Stop timer for Call Duration
            window.clearInterval($("#supDuration").attr("onload-timer-id"));
        }

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

        $("#supName").text(caller.name);
        $("#supANI").text(caller.address);
        $("#supDNIS").text(caller.calls[0].other.addressNormalized);

        // If incoming call
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup)){
            console.log("INCOMING CALL");
            $("#supState").text(agent.calls[0].state);
            $("#supDuration").text("00:00:00");

            // Set timer for Caller Wait Time
            var intervalId1 = setInterval(function() {
                var currentDate = new Date();        
                $("#supWaitTime").text(new Date(currentDate - acdConnectedDt).toISOString().slice(11, -1).split('.')[0]);
            }, 1000);
            $("#supWaitTime").attr("wait-timer-id",intervalId1);

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = true;
        } else if((acd.endTime === undefined) && (caller.endTime === undefined)) {
            console.log("ACTIVE CALL");
            // If active call

            // Stop timer for Caller Wait Time
            window.clearInterval($("#supWaitTime").attr("wait-timer-id"));

            $("#supState").text(agent.calls[0].state);
            $("#supWaitTime").text(new Date(acdConnectedDt - custConnectedDt).toISOString().slice(11, -1));

            // Start timer for Call Duration
            var intervalId2 = setInterval(function() {
                var currentDate = new Date();        
                $("#supDuration").text(new Date(currentDate - custConnectedDt).toISOString().slice(11, -1).split('.')[0]);
            }, 1000);
            $("#supDuration").attr("duration-timer-id",intervalId2);

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = true;
        } else if(agent.calls[0].state === "disconnected") {
            console.log("DISCONNECTED CALL");
            // If disconnected call

            // Stop timer for Call Wait Time and Call Duration
            window.clearInterval($("#supWaitTime").attr("wait-timer-id"));
            window.clearInterval($("#supDuration").attr("duration-timer-id"));

            $("#supState").text(agent.calls[0].state);
            $("#supWaitTime").text(new Date(acdEndDt - acdConnectedDt).toISOString().slice(11, -1));
            $("#supDuration").text(new Date(custEndDt - custConnectedDt).toISOString().slice(11, -1));

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = false;
        } else if((caller.endTime !== undefined) && (!clientApp.isCallActiveSup)){
            // Stop timer for Call Wait Time and Call Duration
            window.clearInterval($("#supWaitTime").attr("wait-timer-id"));
            window.clearInterval($("#supDuration").attr("duration-timer-id"));

            $("#supName").text("");
            $("#supANI").text("");
            $("#supDNIS").text("");
            $("#supState").text("");
            $("#supWaitTime").text("");
            $("#supDuration").text("");

            clientApp.isCallActiveSup = false;
        }
    }
}

clientApp.addTableRow = function(data) {
    let caller = data.eventBody.participants
        .filter(participant => participant.purpose === "customer")[0];
    
    let agent = data.eventBody.participants
        .filter(participant => participant.purpose === "agent")[0];
    
    let acd = data.eventBody.participants
        .filter(participant => participant.purpose === "acd")[0];

    var tableRef = document.getElementById('tblCallerDetails').getElementsByTagName('tbody')[0];
    var newRow   = tableRef.insertRow(tableRef.rows.length);

    // Hide Conversation ID column
    $('td:nth-child(1),th:nth-child(1)').hide();

    // Populate Conversation ID column
    var idCell  = newRow.insertCell(0);
    var idText  = document.createTextNode(data.eventBody.id);
    idCell.appendChild(idText);
    idCell.hidden = true;

    // Populate Name column
    var nameCell  = newRow.insertCell(1);
    var nameText  = document.createTextNode(caller.name);
    nameCell.appendChild(nameText);

    // Populate ANI column
    var aniCell  = newRow.insertCell(2);
    var aniText  = document.createTextNode(caller.address);
    aniCell.appendChild(aniText);

    // Populate DNIS column
    var dnisCell  = newRow.insertCell(3);
    var dnisText  = document.createTextNode(caller.calls[0].other.addressNormalized);
    dnisCell.appendChild(dnisText);

    // // Populate State column
    // var stateCell  = newRow.insertCell(4);
    // var stateText  = document.createTextNode(agent.calls[0].state);
    // stateCell.appendChild(stateText);

    // // Populate Wait Time column
    // var waitCell  = newRow.insertCell(5);
    // var waitText  = document.createTextNode((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));
    // waitCell.appendChild(waitText);

    // // Populate Duration column
    // var durationCell  = newRow.insertCell(6);
    // var durationText  = document.createTextNode((new Date(caller.endTime)) - (new Date(caller.connectedTime)));
    // durationCell.appendChild(durationText);
    
    if((acd.endTime === undefined) && (!clientApp.isCallActiveSup)){
        // If incoming call
        // Populate State column
        var stateCell  = newRow.insertCell(4);
        var stateText  = document.createTextNode(agent.calls[0].state);
        stateCell.appendChild(stateText);

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = true;
    } else if((acd.endTime === undefined) && (caller.endTime === undefined)) {
        // If active call
        // Populate State column
        var stateCell  = newRow.insertCell(4);
        var stateText  = document.createTextNode(agent.calls[0].state);
        stateCell.appendChild(stateText);

        // Populate Wait Time column
        var waitCell  = newRow.insertCell(5);
        var waitText  = document.createTextNode((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));
        waitCell.appendChild(waitText);

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = true;
    } else if(agent.calls[0].state === "disconnected") {
        // If disconnected call
        // Populate State column
        var stateCell  = newRow.insertCell(4);
        var stateText  = document.createTextNode(agent.calls[0].state);
        stateCell.appendChild(stateText);

        // Populate Wait Time column
        var waitCell  = newRow.insertCell(5);
        var waitText  = document.createTextNode((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));
        waitCell.appendChild(waitText);

        // Populate Duration column
        var durationCell  = newRow.insertCell(6);
        var durationText  = document.createTextNode((new Date(caller.endTime)) - (new Date(caller.connectedTime)));
        durationCell.appendChild(durationText);

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = false;
    }
}

clientApp.updateTableRow = function(data) {
    let caller = data.eventBody.participants
        .filter(participant => participant.purpose === "customer")[0];

    let agent = data.eventBody.participants
        .filter(participant => participant.purpose === "agent")[0];
    
    let acd = data.eventBody.participants
        .filter(participant => participant.purpose === "acd")[0];

    // Find Conversation ID in the table
    var numberCell = $("td:contains('" + data.eventBody.id + "')");
    var row = numberCell.parent();

    // // Update State column
    // var stateCell = row.children()[4];
    // stateCell.html(agent.calls[0].state);

    // // Update Wait Time column
    // var waitCell = row.children()[5];
    // waitCell.html((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));

    // // Update Duration column
    // var durationCell = row.children()[6];
    // durationCell.html((new Date(caller.endTime)) - (new Date(caller.connectedTime)));  

    if((acd.endTime === undefined) && (caller.endTime === undefined)) {
        // If active call
        // Update State column
        var stateCell = row.children()[4];
        stateCell.html(agent.calls[0].state);

        // Update Wait Time column
        var waitCell = row.children()[5];
        waitCell.html((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = true;
    } else if(agent.calls[0].state === "disconnected") {
        // If disconnected call
        // Update State column
        var stateCell = row.children()[4];
        stateCell.html(agent.calls[0].state);

        // Update Wait Time column
        var waitCell = row.children()[5];
        waitCell.html((new Date(acd.connectedTime)) - (new Date(caller.connectedTime)));

        // Update Duration column
        var durationCell = row.children()[6];
        durationCell.html((new Date(caller.endTime)) - (new Date(caller.connectedTime)));

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = false;
    }
}

export default clientApp
