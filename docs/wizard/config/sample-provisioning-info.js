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
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts',
            'permissions': 'camera,microphone,geolocation',
            'groups': ['Agents', 'Supervisors']
        },
        {
            'name': 'Supervisor Widget',
            'url': 'https://mypurecloud.github.io/purecloud-premium-app/supervisor.html?lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'type': 'standalone',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts',
            'permissions': 'camera,microphone,geolocation',
            'groups': ['Supervisors']
        }
    ],
    'interaction-widget': [
        {
            'name': 'Interaction Widget',
            'url': 'https://app-website.com/?conversationid={{pcConversationId}}&lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts',
            'permissions': 'camera,microphone,geolocation',
            'groups': ['Agents'],
            'communicationTypeFilter': 'chat, call, email'
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
    'ws-data-actions': [
        {
            'name': 'My Web Services',
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
                    'name': 'My Data Action',
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
            'authorizedGrantType': 'CLIENT_CREDENTIALS',
            'finally': function (installedData) {
                return new Promise((resolve, reject) => {
                    console.log('Fake Sending Credentials...');
                    setTimeout(() => resolve(), 2000);
                });
            }
        }
    ]
}
