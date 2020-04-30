/**
 * This will hold all the code to manage and run the
 * Chat "API" to the 'agent' org.
 * Explanation:
 * The API "calls" would be requests to initiate a chat conversation with
 * the agent org. The chat deployment will handle logic in the IVR and
 * send "responses" as actual chat responses.
 * Important messages will be prefixed based on intended usage:
 * (prefix):somethin something
 * Prefixes:
 *      meta: random messages for testing purposes 
 *                      to know the current state in the IVR
 *      error: errors lilke if data actions in the ivr fail or times-out
 *      success: data action success
 */

import config from '../../config/config.js';

let orgName = '';
let environment = '';
let dataTable = '';

export default {
    /**
     * Setup stuff for the cheat chat
     * @param {Object} org PurecCloud org object
     * @param {String} pcEnvironment environment of the PC (eg mypurecloud.com)
     * @param {Object} dt Purecloud datatable objcet
     */
    setUp(org, pcEnvironment, dt){
        orgName = org.thirdPartyOrgName;
        environment = pcEnvironment ? pcEnvironment : 'mypurecloud.com';
        dataTable = dt;

        console.log('Cheat Chat Setup');
    },

    /**
     * Called only once and from the Wiard app. 
     * Submit the generated OAuth credentials to the DevFoundry org.
     * @param {Object} credentials Purecloud OAuth credentials 
     */
    submitClientCredentials(credentials){ 
        console.log(orgName);
        console.log(environment);

        let simpleCreds = JSON.stringify({
            id: credentials.id,
            secret: credentials.secret
        });
        
        // Build request Body
        let requestBody = {
            organizationId: config.cheatChat.organizationId,
            deploymentId: config.cheatChat.deploymentId,
            memberInfo: { 
                displayName: orgName,
                customFields: {
                    purpose: 'credentials',
                    credentials: simpleCreds,
                    org: orgName,
                    environment: environment
                }
            }
        }

        return new Promise((resolve, reject) => {
            // Send request
            $.ajax({
                url: 'https://api.mypurecloud.com/api/v2/webchat/guest/conversations',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "cache-control": "no-cache"
                },
                data: JSON.stringify(requestBody)
            })
            .done((x) => {
                let websocket = new WebSocket(x.eventStreamUri)
                websocket.onmessage = function(event){
                    let data = JSON.parse(event.data);

                    let eventBody = data.eventBody;
                    let body = eventBody.body;
                    if(body){
                        console.log(body);
                        if(body.startsWith('success:')){
                            resolve();
                        }
                    }
                    if(eventBody.bodyType == 'member-leave'){
                        console.log('CHEAT CHAT DONE');
                    }
                };
                console.log('Sent Cheat Chat Request');
            })
            .fail((e) => reject(e));
        })
    },

    /**
     * Submit the listing for approval
     * @param {Object} dtRow PureCloud datatable row
     */
    submitListing(dtRow){
        const appName = JSON.parse(dtRow.listingDetails).name;

        // Template
        let requestBody = {
            organizationId: config.cheatChat.organizationId,
            deploymentId: config.cheatChat.deploymentId,
            memberInfo: { 
                displayName: orgName + ' - ' + appName,
                customFields: {
                    purpose: 'submit',
                    listingId: dtRow.key,
                    org: orgName,
                    environment: environment,
                    dataTableId: dataTable.id
                }
            }
        }
        console.log(requestBody);

        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://api.mypurecloud.com/api/v2/webchat/guest/conversations',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "cache-control": "no-cache"
                },
                data: JSON.stringify(requestBody)
            })
            .done((x) => {
                let websocket = new WebSocket(x.eventStreamUri)
                websocket.onmessage = function(event){
                    let data = JSON.parse(event.data);
                    //console.log(data);
                    let eventBody = data.eventBody;
                    if(eventBody.body){
                        console.log(eventBody.body);

                        if(eventBody.body.startsWith('success:')){
                            resolve();
                        }

                        if(eventBody.body.startsWith('error:')){
                            reject();
                        }
                    }
                    if(eventBody.bodyType == 'member-leave'){
                        console.log('DONE');
                    }
                };
                console.log('sent');
            })
            .fail((e) => reject(e));
        })
    }
}