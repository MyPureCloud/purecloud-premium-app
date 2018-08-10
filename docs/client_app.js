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
const analyticsApi = new platformClient.AnalyticsApi();
const routingApi = new platformClient.RoutingApi();

// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(pcEnv, langTag, html){
    let clientId = clientIDs[pcEnv] || clientIDs['mypurecloud.com'];
    clientApp.langTag = langTag;

    // Authenticate via PureCloud
    client.setPersistSettings(true);
    client.loginImplicitGrant(clientId, redirectUri + html, { state: "state" })
    .then(data => {
        console.log(data);
        
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
    }).then(
        $.getJSON('./language.json', function(data) {
            clientApp.language = data;
        })
    ).then(data => console.log("Succesfully set-up Client App."))

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
        let caller = eventBody.participants.filter(participant => participant.purpose === "customer")[0];

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
            clientApp.purecloudClientApi.alerting.showToastPopup(clientApp.language[clientApp.langTag].IncomingCall, clientApp.language[clientApp.langTag].From + ": " + callerLocation);
        } else {
            clientApp.purecloudClientApi.alerting.showToastPopup(clientApp.language["en-us"].IncomingCall, clientApp.language["en-us"].From + ": " + callerLocation);
        }        
    }
}

clientApp.loadSupervisorView = function(){
    // Get all Queues
    var body = { pageSize : 300 }

    routingApi.getRoutingQueues(body)
    .then(data => {
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
    // Check if there is an active conversation
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

    analyticsApi.postAnalyticsConversationsDetailsQuery(body)
    .then(data => {
        if(Object.keys(data).length > 0) {
            (data.conversations).forEach(function(conversation) {
                let caller = conversation.participants.filter(participant => participant.purpose === "external")[0];            
                let acd = conversation.participants.filter(participant => participant.purpose === "acd")[0];
                let acdSegment = acd.sessions[0].segments.filter(segment => segment.segmentType === "interact")[0];
                let agent = conversation.participants.filter(participant => participant.purpose === "agent")[0];

                if(caller === null) {
                    caller = conversation.participants.filter(participant => participant.purpose === "customer")[0];
                }

                // Get values to insert in table
                var id = conversation.conversationId;
                var name = caller.participantName;
                
                if(caller.sessions[0].mediaType === "voice") {
                    var type = "Call";
                    var ani = caller.sessions[0].ani;
                    var dnis = caller.sessions[0].dnis;                    
                } else if(caller.sessions[0].mediaType === "chat") {
                    var type = "Chat";
                    var ani = caller.sessions[0].roomId;
                    var dnis = caller.sessions[0].roomId;
                } else if(caller.sessions[1].mediaType === "callback") {
                    var type = "Callback";
                    var ani = caller.sessions[0].ani;
                    var dnis = caller.sessions[0].dnis;
                } else if(caller.sessions[1].mediaType === "email") {
                    var type = "Email";
                    var ani = caller.sessions[0].addressSelf;
                    var dnis = caller.sessions[0].addressFrom;
                }

                if(agent !== undefined) {
                    // If active call
                    var state = "connected";
                    var wait = new Date(new Date(acdSegment.segmentEnd) - (new Date(acdSegment.segmentStart))).toISOString().slice(11, -1);
                    var duration = "--";
                } else {
                    // Caller on queue
                    var state = "on queue";
                    var wait = "--";
                    var duration = "--";
                }

                clientApp.insertRow(id, type, name, ani, dnis, state, wait, duration);
            });            
        }
    }).catch(e => console.log("ERROR CALLING API: " + e + "|| REQUEST BODY: " + JSON.stringify(body)));

    // Create a Notifications Channel
    notificationsApi.postNotificationsChannels()
    .then(data => {
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

    // If an interaction (from queue) comes in
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
    let caller = data.eventBody.participants.filter(participant => participant.purpose === "customer")[0];    
    let agent = data.eventBody.participants.filter(participant => participant.purpose === "agent")[0];    
    let acd = data.eventBody.participants.filter(participant => participant.purpose === "acd")[0];
    
    // Call Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.calls[0].state === "connected")) {
            // Call on queue
            clientApp.insertRow(data.eventBody.id, "Call", caller.name, caller.address, caller.calls[0].other.addressNormalized, "on queue", "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            clientApp.insertRow(data.eventBody.id, "Call", caller.name, caller.address, caller.calls[0].other.addressNormalized, agent.calls[0].state, "--", "--");
            clientApp.isCallActiveSup = true;
        }
    }    

    // Chat Conversation Type
    if((caller.calls === undefined) && (caller.chats !== undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.chats[0].state === "connected")) {
            // Chat on queue
            clientApp.insertRow(data.eventBody.id, "Chat", caller.name, caller.address, caller.chats[0].roomId, "on queue", "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming chat
            clientApp.insertRow(data.eventBody.id, "Chat", caller.name, caller.address, caller.chats[0].roomId, agent.calls[0].state, "--", "--");
            clientApp.isCallActiveSup = true;
        }
    }

    // Callback Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks !== undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.callbacks[0].state === "connected")) {
            // Callback on queue
            clientApp.insertRow(data.eventBody.id, "Callback", caller.name, caller.address, caller.calls[0].other.addressNormalized, "on queue", "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming callback
            clientApp.insertRow(data.eventBody.id, "Callback", caller.name, caller.address, caller.calls[0].other.addressNormalized, agent.callbacks[0].state, "--", "--");
            clientApp.isCallActiveSup = true;
        }
    }

    // Email Conversation Type
    if((caller.calls === undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails !== undefined)) {
        if ((agent === undefined) && (acd.emails[0].state === "connected")) {
            // Email on queue
            clientApp.insertRow(data.eventBody.id, "Email", caller.name, caller.address, acd.address, "on queue", "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming email
            clientApp.insertRow(data.eventBody.id, "Email", caller.name, caller.address, acd.address, agent.emails[0].state, "--", "--");
            clientApp.isCallActiveSup = true;
        }
    }
}

clientApp.updateTableRow = function(data) {
    let caller = data.eventBody.participants.filter(participant => participant.purpose === "customer")[0];
    let agent = data.eventBody.participants.filter(participant => participant.purpose === "agent")[0];    
    let acd = data.eventBody.participants.filter(participant => participant.purpose === "acd")[0];

    // Call Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            clientApp.updateRow(data, agent.calls[0].state, "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active call
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.calls[0].state, wait, "--");
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected call
            if (agent.calls[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.calls[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }
    
    // Chat Conversation Type
    if((caller.calls === undefined) && (caller.chats !== undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming chat
            clientApp.updateRow(data, agent.chats[0].state, "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active chat
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.chats[0].state, wait, "--");
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected chat
            if (agent.chats[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.chats[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }

    // Callback Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks !== undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming callback
            clientApp.updateRow(data, agent.callbacks[0].state, "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active callback
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.callbacks[0].state, wait, "--");
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected callback
            if (agent.callbacks[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.callbacks[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }

    // Email Conversation Type
    if((caller.calls === undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails !== undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming email
            clientApp.updateRow(data, agent.emails[0].state, "--", "--");
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active email
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.emails[0].state, wait, "--");
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected email
            if (agent.emails[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.emails[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }
}

clientApp.insertRow = function(id, type, name, ani, dnis, state, wait, duration) {
    // Create table row
    var tableRef = document.getElementById('tblCallerDetails').getElementsByTagName('tbody')[0];
    var newRow = tableRef.insertRow(tableRef.rows.length);
    
    // Create Cell columns
    var idCell = newRow.insertCell(0);
    var typeCell = newRow.insertCell(1);
    var nameCell = newRow.insertCell(2);
    var aniCell = newRow.insertCell(3);
    var dnisCell = newRow.insertCell(4);
    var stateCell = newRow.insertCell(5);
    var waitCell = newRow.insertCell(6);
    var durationCell = newRow.insertCell(7);

    // Create text nodes
    var idText = document.createTextNode(id);
    var typeText = document.createTextNode(type);
    var nameText = document.createTextNode(name);
    var aniText = document.createTextNode(ani);
    var dnisText = document.createTextNode(dnis);
    var stateText = document.createTextNode(state);
    var waitText = document.createTextNode(wait);
    var durationText = document.createTextNode(duration);

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
}

clientApp.updateRow = function(data, state, wait, duration) {
    $('#tblCallerDetails > tbody> tr').each(function() {
        var firstTd = $(this).find('td:first');
        if ($(firstTd).text() == data.eventBody.id) {
            $(this).find('td:eq(5)').text(state);
            $(this).find('td:eq(6)').text(wait);
            $(this).find('td:eq(7)').text(duration);
        }
    })
}

export default clientApp
