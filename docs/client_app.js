/* 
*   NOTE: This sample uses ES6.
*/
import clientIDs from './clientIDs.js';

let clientApp = {};

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
// const redirectUri = "http://localhost:3000/";
const redirectUri = "https://mypurecloud.github.io/purecloud-premium-app/";

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();

// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(pcEnv, langTag, html){
    let clientId = clientIDs[pcEnv] || clientIDs['mypurecloud.com'];
    clientApp.langTag = langTag;

    // Authenticate via PureCloud
    client.setPersistSettings(true);
    client.loginImplicitGrant(clientId, redirectUri + html, { state: "state" })
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
        if(clientApp.langTag !== null) {
            $.getJSON('./language.json', function(data) {
                clientApp.purecloudClientApi.alerting.showToastPopup(data[clientApp.langTag].IncomingCall, data[clientApp.langTag].From + ": " + callerLocation);
            });
        } else {
            $.getJSON('./language.json', function(data) {
                clientApp.purecloudClientApi.alerting.showToastPopup(data["en-us"].IncomingCall, data["en-us"].From + ": " + callerLocation);
            });
        }        
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
            (data.conversations).forEach(function(conversation) {
                let caller = conversation.participants
                    .filter(participant => participant.purpose === "external")[0];
            
                let acd = conversation.participants
                    .filter(participant => participant.purpose === "acd")[0];

                let acdSegment = acd.sessions[0].segments
                    .filter(segment => segment.segmentType === "interact")[0];

                let agent = conversation.participants
                    .filter(participant => participant.purpose === "agent")[0];
                
                var tableRef = document.getElementById('tblCallerDetails').getElementsByTagName('tbody')[0];
                var newRow   = tableRef.insertRow(tableRef.rows.length);

                // Create cell columns
                var idCell  = newRow.insertCell(0);
                var nameCell  = newRow.insertCell(1);
                var aniCell  = newRow.insertCell(2);
                var dnisCell  = newRow.insertCell(3);
                var stateCell  = newRow.insertCell(4);
                var waitCell  = newRow.insertCell(5);
                var durationCell  = newRow.insertCell(6);

                // Create text nodes
                var idText  = document.createTextNode(conversation.conversationId);
                var nameText  = document.createTextNode(caller.participantName);
                var aniText  = document.createTextNode(caller.sessions[0].ani);
                var dnisText  = document.createTextNode(caller.sessions[0].dnis);

                if(agent !== undefined) {
                    // If active call
                    var stateText  = document.createTextNode("connected");
                    var waitText  = document.createTextNode(new Date(new Date(acdSegment.segmentEnd) - (new Date(acdSegment.segmentStart))).toISOString().slice(11, -1));
                    var durationText  = document.createTextNode("--");
                } else {
                    // Caller on queue
                    var stateText  = document.createTextNode("on queue");
                    var waitText  = document.createTextNode("--");
                    var durationText  = document.createTextNode("--");
                }
                
                // Append text nodes to cell columns
                idCell.appendChild(idText);
                nameCell.appendChild(nameText);
                aniCell.appendChild(aniText);
                dnisCell.appendChild(dnisText);
                stateCell.appendChild(stateText);
                waitCell.appendChild(waitText);
                durationCell.appendChild(durationText);

                // Add CSS Style
                idCell.className = "dt-cell value-cell";
                nameCell.className = "dt-cell value-cell";
                aniCell.className = "dt-cell value-cell";
                dnisCell.className = "dt-cell value-cell";
                stateCell.className = "dt-cell value-cell";
                waitCell.className = "dt-cell value-cell";
                durationCell.className = "dt-cell value-cell";

                // Make sure Conversation ID column is always hidden
                idCell.hidden = true;
            });            
        }
    }).catch(e => console.log("ERROR CALLING API: " + e + "|| REQUEST BODY: " + JSON.stringify(body)));

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

    console.log(JSON.stringify(data));

    // If a voice interaction (from queue) comes in
    if(topic === clientApp.topicId){
        // Check to see if Conversation details is already displayed in the view
        if ($('#tblCallerDetails td:contains(' + data.eventBody.id + ')').length) {
            clientApp.updateTableRow(data);            
        } else {
            clientApp.addTableRow(data);
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
    
    // Call Conversation Type
    if(acd.calls[0] !== undefined) {
        if ((agent === undefined) && (acd.calls[0].state === "connected")) {
            // Caller on queue
            var newRow   = tableRef.insertRow(tableRef.rows.length);
    
            // Create Cell columns
            var idCell  = newRow.insertCell(0);
            var typeCell  = newRow.insertCell(1);
            var nameCell  = newRow.insertCell(2);
            var aniCell  = newRow.insertCell(3);
            var dnisCell  = newRow.insertCell(4);
            var stateCell  = newRow.insertCell(5);
            var waitCell  = newRow.insertCell(6);
            var durationCell  = newRow.insertCell(7);
    
            // Create text nodes
            var idText  = document.createTextNode(data.eventBody.id);
            var typeText  = document.createTextNode("Call");
            var nameText  = document.createTextNode(caller.name);
            var aniText  = document.createTextNode(caller.address);
            var dnisText  = document.createTextNode(caller.calls[0].other.addressNormalized);
            var stateText  = document.createTextNode("on queue");
            var waitText  = document.createTextNode("--");
            var durationText  = document.createTextNode("--");
    
            // Append text nodes to cell columns
            idCell.appendChild(idText);
            typeCell.appendChild(typeText);
            nameCell.appendChild(nameText);
            aniCell.appendChild(aniText);
            dnisCell.appendChild(dnisText);
            stateCell.appendChild(stateText);
            waitCell.appendChild(waitText);
            durationCell.appendChild(durationText);
    
            // Make sure Conversation ID column is always hidden
            idCell.hidden = true;
    
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            var newRow   = tableRef.insertRow(tableRef.rows.length);
    
            // Create Cell columns
            var idCell  = newRow.insertCell(0);
            var typeCell  = newRow.insertCell(1);
            var nameCell  = newRow.insertCell(2);
            var aniCell  = newRow.insertCell(3);
            var dnisCell  = newRow.insertCell(4);
            var stateCell  = newRow.insertCell(5);
            var waitCell  = newRow.insertCell(6);
            var durationCell  = newRow.insertCell(7);
    
            // Create text nodes
            var idText  = document.createTextNode(data.eventBody.id);
            var typeText  = document.createTextNode("Call");
            var nameText  = document.createTextNode(caller.name);
            var aniText  = document.createTextNode(caller.address);
            var dnisText  = document.createTextNode(caller.calls[0].other.addressNormalized);
            var stateText  = document.createTextNode(agent.calls[0].state);
            var waitText  = document.createTextNode("--");
            var durationText  = document.createTextNode("--");
    
            // Append text nodes to cell columns
            idCell.appendChild(idText);
            typeCell.appendChild(typeText);
            nameCell.appendChild(nameText);
            aniCell.appendChild(aniText);
            dnisCell.appendChild(dnisText);
            stateCell.appendChild(stateText);
            waitCell.appendChild(waitText);
            durationCell.appendChild(durationText);
    
            // Make sure Conversation ID column is always hidden
            idCell.hidden = true;
    
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = true;
        }
    }    

    // Chat Conversation Type
    if(acd.chats[0] !== undefined) {
        if ((agent === undefined) && (acd.chats[0].state === "connected")) {
            // Caller on queue
            var newRow   = tableRef.insertRow(tableRef.rows.length);
    
            // Create Cell columns
            var idCell  = newRow.insertCell(0);
            var typeCell  = newRow.insertCell(1);
            var nameCell  = newRow.insertCell(2);
            var aniCell  = newRow.insertCell(3);
            var dnisCell  = newRow.insertCell(4);
            var stateCell  = newRow.insertCell(5);
            var waitCell  = newRow.insertCell(6);
            var durationCell  = newRow.insertCell(7);
    
            // Create text nodes
            var idText  = document.createTextNode(data.eventBody.id);
            var typeText  = document.createTextNode("Chat");
            var nameText  = document.createTextNode(caller.name);
            var aniText  = document.createTextNode(caller.address);
            var dnisText  = document.createTextNode(caller.chats[0].roomId);
            var stateText  = document.createTextNode("on queue");
            var waitText  = document.createTextNode("--");
            var durationText  = document.createTextNode("--");
    
            // Append text nodes to cell columns
            idCell.appendChild(idText);
            typeCell.appendChild(typeText);
            nameCell.appendChild(nameText);
            aniCell.appendChild(aniText);
            dnisCell.appendChild(dnisText);
            stateCell.appendChild(stateText);
            waitCell.appendChild(waitText);
            durationCell.appendChild(durationText);
    
            // Make sure Conversation ID column is always hidden
            idCell.hidden = true;
    
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            var newRow   = tableRef.insertRow(tableRef.rows.length);
    
            // Create Cell columns
            var idCell  = newRow.insertCell(0);
            var typeCell  = newRow.insertCell(1);
            var nameCell  = newRow.insertCell(2);
            var aniCell  = newRow.insertCell(3);
            var dnisCell  = newRow.insertCell(4);
            var stateCell  = newRow.insertCell(5);
            var waitCell  = newRow.insertCell(6);
            var durationCell  = newRow.insertCell(7);
    
            // Create text nodes
            var idText  = document.createTextNode(data.eventBody.id);
            var typeText  = document.createTextNode("Chat");
            var nameText  = document.createTextNode(caller.name);
            var aniText  = document.createTextNode(caller.address);
            var dnisText  = document.createTextNode(caller.chats[0].roomId);
            var stateText  = document.createTextNode(agent.calls[0].state);
            var waitText  = document.createTextNode("--");
            var durationText  = document.createTextNode("--");
    
            // Append text nodes to cell columns
            idCell.appendChild(idText);
            typeCell.appendChild(typeText);
            nameCell.appendChild(nameText);
            aniCell.appendChild(aniText);
            dnisCell.appendChild(dnisText);
            stateCell.appendChild(stateText);
            waitCell.appendChild(waitText);
            durationCell.appendChild(durationText);
    
            // Make sure Conversation ID column is always hidden
            idCell.hidden = true;
    
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = true;
        }
    }    

    // Set timer for Caller Wait Time
    //     var intervalId1 = setInterval(function() {
    //         var currentDate = new Date();        
    //         $("#supWaitTime").text(new Date(currentDate - acdConnectedDt).toISOString().slice(11, -1).split('.')[0]);
    //     }, 1000);
    //     $("#supWaitTime").attr("wait-timer-id",intervalId1);

    // Stop timer for Caller Wait Time
    //     window.clearInterval($("#supWaitTime").attr("wait-timer-id"));
}

clientApp.updateTableRow = function(data) {
    let caller = data.eventBody.participants
        .filter(participant => participant.purpose === "customer")[0];

    let agent = data.eventBody.participants
        .filter(participant => participant.purpose === "agent")[0];
    
    let acd = data.eventBody.participants
        .filter(participant => participant.purpose === "acd")[0];

    if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
        // If incoming call
        // Update State column
        $('#tblCallerDetails > tbody> tr').each(function() {
            var firstTd = $(this).find('td:first');
            if ($(firstTd).text() == data.eventBody.id) {
                $(this).find('td:eq(4)').text(agent.calls[0].state);
                $(this).find('td:eq(5)').text("--");
                $(this).find('td:eq(6)').text("--");
            }
        })

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = false;
    } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
        // If active call
        // Update State and Wait Time columns
        $('#tblCallerDetails > tbody> tr').each(function() {
            var firstTd = $(this).find('td:first');
            if ($(firstTd).text() == data.eventBody.id) {
                $(this).find('td:eq(4)').text(agent.calls[0].state);
                $(this).find('td:eq(5)').text(new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1));
                $(this).find('td:eq(6)').text("--");
            }
        })

        // Makes sure that the field only changes the first time. 
        clientApp.isCallActiveSup = true;
    } else if(agent !== undefined) {
        if (agent.calls[0].state === "disconnected") {
            // If disconnected call
            // Update State, Wait Time and Duration columns
            $('#tblCallerDetails > tbody> tr').each(function() {
                var firstTd = $(this).find('td:first');
                if ($(firstTd).text() == data.eventBody.id) {
                    $(this).find('td:eq(4)').text(agent.calls[0].state);
                    $(this).find('td:eq(5)').text(new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1));
                    $(this).find('td:eq(6)').text(new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1));
                }
            })

            // Makes sure that the field only changes the first time. 
            clientApp.isCallActiveSup = false;
        }        
    }
}

export default clientApp
