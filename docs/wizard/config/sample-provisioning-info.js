let sample = {
    'role': [
        {
            'name': 'Admin',
            'description': 'Admins will be able to access the Premium App installation wizard and make changes to the configurations.',
            'permissions': ['admin', 'premium_app_permission'],
            'assignToSelf': true
        },
        {
            'name': 'Supervisor',
            'description': 'Supervisors have the ability to watch a queue for ACD conversations.',
            'permissions': ['premium_app_permission'],
            'assignToSelf': true
        },
        {
            'name': 'Agent',
            'description': 'Agents have access to a widget that gives US state information based on caller\'s number.',
            'permissions': ['premium_app_permission'],
            'assignToSelf': true
        }
    ],
    'group': [
        {
            'name': 'Agents',
            'description': 'Agents have access to a widget that gives US state information based on caller\'s number.',
            'assignToSelf': true
        },
        {
            'name': 'Supervisors',
            'description': 'Supervisors have the ability to watch a queue for ACD conversations.',
            'assignToSelf': true
        }
    ],
    'app-instance': [
        {
            'name': 'Agent Widget',
            'url': 'https://mypurecloud.github.io/purecloud-premium-app/index.html?lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'type': 'widget',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
            'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
            'groups': ['Agents', 'Supervisors'],
            'advanced': {
                // All Advanced Properties are optional

                // To learn more about lifecycle hooks, refer to:
                // https://developer.genesys.cloud/platform/integrations/client-apps/sdk/lifecycleapi
                'lifecycle': {},

                // Icons for the App.
                // Read More: https://developer.genesys.cloud/platform/integrations/client-apps/#application-icons
                'icon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                },
                'monochromicIcon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                }
            }
        },
        {
            'name': 'Supervisor Widget',
            'url': 'https://mypurecloud.github.io/purecloud-premium-app/supervisor.html?lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'type': 'standalone',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
            'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
            'groups': ['Supervisors']
        }
    ],
    'widget-instance': [
        {
            'name': 'Premium Widget',
            'url': 'https://app-website.com/?conversationid={{pcConversationId}}&lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
            'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
            'groups': ['Agents'],
            'communicationTypeFilter': 'chat, call, email',
            'advanced': {
                // All Advanced Properties are optional

                // To learn more about lifecycle hooks, refer to:
                // https://developer.genesys.cloud/platform/integrations/client-apps/sdk/lifecycleapi
                'lifecycle': {},

                // Icons for the App.
                // Read More: https://developer.genesys.cloud/platform/integrations/client-apps/#application-icons
                'icon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                },
                'monochromicIcon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                }
            }
        }
    ],
    'interaction-widget': [
        {
            'name': 'Interaction Widget',
            'url': 'https://app-website.com/?conversationid={{pcConversationId}}&lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
            'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
            'groups': ['Agents'],
            'communicationTypeFilter': 'chat, call, email',
            'advanced': {
                // All Advanced Properties are optional

                // To learn more about lifecycle hooks, refer to:
                // https://developer.genesys.cloud/platform/integrations/client-apps/sdk/lifecycleapi
                'lifecycle': {},

                // Icons for the Widget.
                // Read More: https://developer.genesys.cloud/platform/integrations/client-apps/#application-icons
                'icon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                },
                'monochromicIcon': {
                    'vector': '',
                    '24x24': '',
                    '36x36': '',
                    '48x48': '',
                    '72x72': ''
                }
            }
        }
    ],
    'widget-deployment': [
        {
            'name': 'Widget Deployment',
            'description': '',
            'type': 'third-party',
            'allowedDomains': [],
            'authentication': false,
            'autoEnable': true
        }
    ],
    'open-messaging': [
        {
            'name': 'Open Messaging Integration',
            'outboundNotificationWebhookUrl': 'https://yourservice.com/messages',
            'outboundNotificationWebhookSignatureSecretToken': 'OUTBOUND_NOTIFICATION_WEBHOOK_SIGNATURE_SECRET_TOKEN',
            'webhookHeaders': {
                "YOUR-HEADER-KEY-1": "YOUR-HEADER-VALUE-1",
                "YOUR-HEADER-KEY-2": "YOUR-HEADER-VALUE-2"
            }
        }
    ],
    'ws-data-actions': [
        {
            'name': 'Web Services',
            'autoEnable': true,
            /**
             * credential type: userDefinedOAuth, userDefined, basicAuth, none or empty string or no credentialType attribute (if no crdentials required)
             */
            'credentialType': 'userDefinedOAuth',
            'credentials': {
                'loginUrl': 'https://test.test.com/login',
                'clientId': '1234',
                'clientSecret': '5678'
            },
            'data-actions': [
                {
                    'name': 'WS Data Action',
                    'secure': false,
                    'autoPublish': true,
                    "config": {
                        "request": {
                            "requestUrlTemplate": "https://test.test.com/test",
                            "requestType": "POST",
                            "headers": {
                                "Authorization": "${authResponse.token_type} ${authResponse.access_token}",
                                "Content-Type": "application/json"
                            },
                            "requestTemplate": "${input.rawRequest}"
                        },
                        "response": {
                            "translationMap": {
                                "mymsg": "$.msg"
                            },
                            "translationMapDefaults": {
                                "mymsg": "\"\""
                            },
                            "successTemplate": "{ \"myoutput\": ${mymsg} }"
                        }
                    },
                    "contract": {
                        "input": {
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "access_token": {
                                        "type": "string"
                                    }
                                },
                                "additionalProperties": true
                            }
                        },
                        "output": {
                            "successSchema": {
                                "type": "object",
                                "properties": {
                                    "myoutput": {
                                        "type": "string"
                                    }
                                },
                                "additionalProperties": true
                            }
                        }
                    }
                }
            ]
        }
    ],
    'gc-data-actions': [
        {
            'name': 'Genesys Cloud Services',
            'autoEnable': true,
            'oauthClient': 'OAuth Client',
            'data-actions': [
                {
                    'name': 'GC Data Action',
                    'secure': false,
                    'autoPublish': true,
                    "config": {
                        "request": {
                            "requestUrlTemplate": "https://test.test.com/test",
                            "requestType": "POST",
                            "headers": {
                                "Content-Type": "application/json"
                            },
                            "requestTemplate": "${input.rawRequest}"
                        },
                        "response": {
                            "translationMap": {
                                "mymsg": "$.msg"
                            },
                            "translationMapDefaults": {
                                "mymsg": "\"\""
                            },
                            "successTemplate": "{ \"myoutput\": ${mymsg} }"
                        }
                    },
                    "contract": {
                        "input": {
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "access_token": {
                                        "type": "string"
                                    }
                                },
                                "additionalProperties": true
                            }
                        },
                        "output": {
                            "successSchema": {
                                "type": "object",
                                "properties": {
                                    "myoutput": {
                                        "type": "string"
                                    }
                                },
                                "additionalProperties": true
                            }
                        }
                    }
                }
            ]
        }
    ],
    'data-table': [
        {
            'name': 'Data Table',
            'description': 'Data table for various needs.',
            'referenceKey': 'id',
            'customFields': [
                {
                    'name': 'Column1',
                    'type': 'string',
                    'default': ''
                },
                {
                    'name': 'Column2',
                    'type': 'string',
                    'default': 'Default Value'
                }
            ]
        }
    ],
    'oauth-client': [
        {
            'name': 'OAuth Client',
            'description': 'Generated Client that\'s passed to the App Backend',
            'roles': ['Admin'],
            'authorizedGrantType': 'CLIENT-CREDENTIALS',
            'accessTokenValiditySeconds': 86400,
            'finally': function (installedData) {
                return new Promise((resolve, reject) => {
                    console.log('Fake Sending Credentials...');
                    setTimeout(() => resolve(), 2000);
                });
            }
        },
        {
            'name': 'OAuth Implicit Client',
            'description': 'Generated Client that\'s used by the App FrontEnd',
            'registeredRedirectUri': ['https://replace_this_url/some_path/index.html'],
            'scope': ['user-basic-info', 'analytics', 'search:readonly'],
            'authorizedGrantType': 'TOKEN',
            'accessTokenValiditySeconds': 86400
        },
        {
            'name': 'OAuth AuthCode Client',
            'description': 'Generated Client that\'s used by the App FrontEnd and the App Backend',
            'registeredRedirectUri': ['https://replace_this_url/some_path/index.html'],
            'scope': ['user-basic-info', 'analytics', 'search:readonly'],
            'authorizedGrantType': 'CODE',
            'accessTokenValiditySeconds': 86400
        }
    ],
    'byoc-cloud-trunk': [
        {
            'name': 'BYOC Trunk',
            'inboundSIPTerminationIdentifier': '-appfoundry-vendor',
            'properties': {
                'trunk_enabled': true,
                'trunk_transport_serverProxyList': [],
                'trunk_transport_protocolVariant': 'udp',
                'trunk_access_acl_allowList': [],
                'trunk_recording_enabled': false,
                'trunk_consult_recording_enabled': false,
                'trunk_recording_audioFormat': 'audio/PCMU',
                'trunk_recording_levelControlEnabled': false,
                'trunk_recording_externalTransfersEnabled': false,
                'trunk_recording_dualChannel': false,
                'trunk_sip_conversationHeader': false,
                'trunk_sip_authentication_credentials_realm': '',
                'trunk_sip_authentication_credentials_username': '',
                'trunk_sip_authentication_credentials_password': '',
                'trunk_sip_uuiEnabled': false,
                'trunk_sip_uuiHeader': 'User-to-User',
                'trunk_sip_uuiEncoding': 'Hex',
                'trunk_sip_uuiPd': '00',
                'trunk_language': 'en-US',
                'trunk_outboundIdentity_callingAddress_omitPlusPrefix': false,
                'trunk_outboundIdentity_calledAddress_omitPlusPrefix': false,
                'trunk_outboundIdentity_callingName': 'AppFoundry Vendor',
                // legacy
                'trunk_outboundIdentity_callingName_overrideMethod': 'Always',
                // new
                'trunk_outboundIdentity_suppress_username_if_did_available': false,
                'trunk_outboundIdentity_suppress_username_if_no_did': false,
                //
                'trunk_outboundIdentity_callingAddress': '',
                // legacy
                'trunk_outboundIdentity_callingAddress_overrideMethod': 'Always',
                // new
                'trunk_calling_id_priority': ['Source', 'Trunk', 'Site', 'Extension'],
                //
                'trunk_transfer_takeback_enabled': false,
                'trunk_rlt_enabled': false
            }
        }
    ],
    'audiohook': [
        {
            'name': 'Audiohook',
            'autoEnable': true,
            'channel': 'both',
            'connectionUri': 'wss://mywebsocketserver.test.test',
            'credentials': {
                'apiKey': 'TEST API KEY value',
                'clientSecret': '5678'
            }
        }
    ],
    'event-bridge': [
        {
            'name': 'AWS EventBridge',
            'autoEnable': true,
            'awsAccountId': '123123456456',
            'awsAccountRegion': 'us-east-1',
            'eventSourceSuffix': 'gc-',
            'eventFilter': ['v2.analytics.flow.{id}.aggregates', 'v2.analytics.users.{id}.aggregates', 'v2.architect.dependencytracking.build']
        }
    ]
}
