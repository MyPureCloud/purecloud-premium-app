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
            'groups': ['Agents', 'Supervisors']
        },
        {
            'name': 'Supervisor Widget',
            'url': 'https://mypurecloud.github.io/purecloud-premium-app/supervisor.html?lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'type': 'standalone',
            'groups': ['Supervisors']
        }
    ],
    'interaction-widget': [
        {
            'name': 'Interaction Widget',
            'url': 'https://app-website.com/?conversationid={{pcConversationId}}&lang={{pcLangTag}}&environment={{pcEnvironment}}',
            'groups': ['Agents'],
            'communicationTypeFilter': 'chat, call, email'
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
            'roles': ['Role'],
            'authorizedGrantType': 'CLIENT_CREDENTIALS',
            'finally': function(installedData){
                return new Promise((resolve, reject) => {
                    console.log('Fake Sending Credentials...');
                    setTimeout(() => resolve(), 2000);
                });
            }
        }
    ]
};