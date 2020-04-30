import provisionTelephonyViews from '../views/provisiontelephony.js'
import loadingModalView from '../components/modals.js'

// All functionalities related to provisioning telephony was placed here.
const platformClient = require('platformClient');
let AuthorizationApi = new platformClient.AuthorizationApi();
let telephonyProvidersEdgeApi = new platformClient.TelephonyProvidersEdgeApi();
let locationsApi = new platformClient.LocationsApi();


let locationId = '';
let locationText = '';
let letSiteId = '';
let sipEndPoints = '';

const provisionTelephonyFunctions = {

    /**
     * Gets list of all enabled products in the org of the user.
     * @returns {function} checkBYOC function
     */
    listProducts() {
        let productsArray = [];
        AuthorizationApi.getAuthorizationProducts()
            .then((data) => {
                console.log(`getAuthorizationProducts success! data: ${JSON.stringify(data, null, 2)}`);
                productsArray = data.entities;
                provisionTelephonyFunctions.checkBYOC(productsArray);        
            })
            .catch((err) => {
                console.log('There was a failure calling getAuthorizationProducts');
                console.error(err);
            });
    },


    /**
     * Checks if BYOC is listed in the list of enabled products for the org.
     * @param {array} productsArray list of all products 
     * @returns {modal} Success or Failed depends on the list of products
     */

    checkBYOC(productsArray) {
        let byocId = '';
        productsArray.forEach(product => {
            if (product.id == 'byoc') {
                console.log('product id' + product.id)
                byocId = product.id;
            }
        });

        if (byocId != '') {
            return provisionTelephonyViews.displaySuccessModal('Provision Telephony',
            'Your org has BYOC Capability. Please proceed.', 'Next', 'btnByocEnable');
        } else {
            return provisionTelephonyViews.displayFailedModal('Provision Telephony',
            'Your org has no BYOC Capability.Please contact administrator.', 'Dismiss');
        }
    },

    /**
     * Validates all the input in create trunk form. 
     * @returns {function} create outbound route
     */
    validateCreateTrunk() {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        let forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        let validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('input', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                else if (form.checkValidity() === true)  {
                    provisionTelephonyFunctions.checkSipInput();
                } 
                form.classList.add('was-validated');
            }, true)
        })
    },
     /**
     * Checks if all required fields are filled out 
     * @returns {function} validateCreateTrunk function
     */
    checkSipInput() {      
        if(document.getElementById('txtSIPExternalTrunk').value != '' && document.getElementById('txtInboundSIP').value != ''
        && document.getElementById('txtSIPServers').value != '' && document.getElementById('txtSIPCallingAddress').value != '') {
            document.getElementById('btnCreateSIPTrunk').disabled = false

        }
        else {
            provisionTelephonyFunctions.validateCreateTrunk()
            form.classList.add('needs-validation');
        }
    },

    /**
     * Pass input field values for API to process and create trunk.
     * @returns {modal} Success and Info modal or Failed modal
     */
    createTrunk() {
        let trunkBody = {
          name: document.getElementById('txtSIPExternalTrunk').value, // External Trunk Name
          state: 'active',
          trunkMetabase: {
            id: 'external_sip_pcv_byoc_carrier.json',
            name: 'Generic BYOC Carrier'
          },
          properties: {
            trunk_type: {
              type: 'string',
              value: {
                default: 'external.pcv.byoc.carrier',
                instance: 'external.pcv.byoc.carrier'
              }
            },
            trunk_label: {
              type: 'string',
              value: {
                default: 'Generic BYOC Carrier',
                instance: 'Sample Trunk'
              }
            },
            trunk_enabled: {
              type: 'boolean',
              value: {
                default: true,
                instance: true
              }
            },
      
            trunk_transport_serverProxyList: {
              type: 'array',
              items: {
                type: 'string'
              },
              uniqueItems: true,
              value: {
                default: null,
                instance: [document.getElementById('txtSIPServers').value] //SIP Servers or Proxies
              },
              required: true
            },
            trunk_access_acl_allowList: {
              type: 'array',
              items: {
                type: 'string'
              },
              value: {
                default: [],
                instance: sipEndPoints
              }
            },
            trunk_protocol: {
              type: 'string',
              enum: ['SIP'],
              value: {
                default: 'SIP',
                instance: 'SIP'
              }
            },
      
            trunk_sip_authentication_credentials_realm: {
              type: 'string',
              value: {
                default: '',
                instance: document.getElementById('txtSIPRealm').value // Realm
              }
            },
            trunk_sip_authentication_credentials_username: {
              type: 'string',
              value: {
                default: '',
                instance: document.getElementById('txtUserName').value // User Name
              }
            },
            trunk_sip_authentication_credentials_password: {
              type: 'string',
              value: {
                default: '',
                instance: document.getElementById('txtSIPPassword').value // Password
              }
            },
            trunk_outboundIdentity_callingName: {
              type: 'string',
              pattern: '^[\\S ]{0,40}$',
              value: {
                default: '',
                instance: document.getElementById('txtSIPCallingName').value // Calling Name
              }
            },
            trunk_outboundIdentity_callingName_overrideMethod: {
              type: 'string',
              enum: ['Always', 'Unassigned DID'],
              value: {
                default: 'Always',
                instance: 'Always'
              }
            },
            trunk_outboundIdentity_callingAddress: {
              type: 'string',
              value: {
                default: '',
                instance: document.getElementById('txtSIPCallingAddress').value // Calling Address
              }
            },
            trunk_outboundIdentity_callingAddress_overrideMethod: {
              type: 'string',
              enum: ['Always', 'Unassigned DID'],
              value: {
                default: 'Always',
                instance: 'Always'
              }
            },
            trunk_outboundIdentity_calledAddress_omitPlusPrefix: {
              type: 'boolean',
              value: {
                default: false,
                instance: false
              }
            },
            trunk_outboundIdentity_callingAddress_omitPlusPrefix: {
              type: 'boolean',
              value: {
                default: false,
                instance: false
              }
            },
            trunk_sip_termination_uri: {
              type: 'string',
              value: {
                instance: document.getElementById('txtInboundSIP').value // Inbound SIP Termination Identifier
              },
              required: false
            }
      
          },
          trunkType: 'EXTERNAL'
        }; // Object | Trunk base settings  

        telephonyProvidersEdgeApi.postTelephonyProvidersEdgesTrunkbasesettings(trunkBody)
            .then((trunkData) => {
                console.log(`postTelephonyProvidersEdgesTrunkbasesettings success! data: ${JSON.stringify(trunkData, null, 2)}`);     
                loadingModalView.updateLoadingModal('Outbound Route Being set up...')
                provisionTelephonyFunctions.siteOutboundroutes(trunkData);

                return provisionTelephonyViews.displaySuccessModal('Provision Telephony', 
                'Trunk was successfully created!', 
                'Next', 'btnDisplaySimulateCall');
            })
            .catch((err) => {
                console.log('There was a failure calling postTelephonyProvidersEdgesTrunkbasesettings');
                let errorMessage = 'Creating trunk has failed. ' + err.body.message;
                return provisionTelephonyViews.displayFailedModal('Provision Telephony', errorMessage , 'Dismiss');   
            });  
    },
    

    /**
     * create location by calling postTelephonyProvidersEdgesTrunkbasesettingspostTelephonyProvidersEdgesTrunkbasesettings
     * @returns {modal} success or failed modal
     */
    createLocation() {
        // get country value and text
        let cntryOption = document.getElementById('selectCountry');
        let cntryValue = cntryOption.options[cntryOption.selectedIndex].value;
        let cntryText = cntryOption.options[cntryOption.selectedIndex].text;
        // formulate the body of the request
        let body = {
            'name': $('#location').val(),
            'emergencyNumber': {'number': $('#emergencyNumber').val(), 'type': 'default'},
            'address': {
                'street1': $('#address').val(),
                'city': $('#city').val(),
                'state': $('#state').val(),
                'zipcode': $('#zip').val(),
                'country': cntryValue.trim(),
                'countryFullName': cntryText
            }
        }
        locationsApi.postLocations(body)
            .then((data) => {
                console.log(`postLocations success! data: ${JSON.stringify(data, null, 2)}`);
                locationId = data.id
                locationText = data.name        
                return provisionTelephonyViews.displaySuccessModal('Provision Telephony', 'Location was successfully created', 'Next', 'btnDisplaySiteModal');
            })
            .catch((err) => {
                console.log('There was a failure calling postLocations');
                let errorMessage = 'Creating location has failed. ' + err.body.message;
                return provisionTelephonyViews.displayFailedModal('Provision Telephony', errorMessage , 'Dismiss');
            });
    },
    

    /**
     * get country list
     * @returns {function} create dropdown
     */
    countryList() {
        $.ajax({
            // Get countries via API
            url: 'https://restcountries.eu/rest/v2/all?fields=name;callingCodes;alpha2Code',
            success: function (result) {
                let countryList = result;
                let elSelect = document.getElementById('selectCountry')
                for(var key in countryList) {
                    provisionTelephonyFunctions.createList(elSelect, countryList[key].name, countryList[key].alpha2Code);          
                }
            }
        });  
    },


    /**
     * get timezone by calling getTelephonyProvidersEdgesTimezones
     * @returns {function} create dropdown
     */

    getTimezone () {
        let opts = { 
            'pageSize': 1000,
            'pageNumber': 1
        };      
        telephonyProvidersEdgeApi.getTelephonyProvidersEdgesTimezones(opts)
          .then((data) => {
              let timeZone = data.entities;
              let elSelect = document.getElementById('timeZone');
              for(let key in timeZone) {
                  let thisTime = timeZone[key].offset;
                  let country = timeZone[key].id;  
                  let hours = Math.floor(thisTime / 60); 
                  let minutes = provisionTelephonyFunctions.formatNumber(Math.abs(thisTime) % 60);
                  let timeZoneFormat = country+'('+ hours + ':' + minutes +')'; 
                  provisionTelephonyFunctions.createList(elSelect, timeZoneFormat, country);          
              }
          })
          .catch((err) => {
              console.log('There was a failure calling getTimezones');
              console.error(err);
          });
    },


    /**
     * create options
     * @param {array} timeZone 
     * @returns {options} 
     */

    addTimezoneToSelect(timeZone) { 
        let thisTime = timeZone.offset;
        let country = timeZone.id;  
        let hours = Math.floor(thisTime / 60);  
        // fomrat minutes
        let minutes = provisionTelephonyFunctions.formatNumber(Math.abs(thisTime) % 60);
        let timeZoneFormat = country+'('+ hours + ':' + minutes +')'; 

        option.text = timeZoneFormat;
        option.value = country;
        select.add(option);
    },


    /**
     * get time zone by calling getTelephonyProvidersEdgesSites
     * @returns {function} create site
     */

    getEdgeSite() {      
        let opts = { 
            'pageSize': 25,
            'pageNumber': 1,
            'sortBy': 'name',
            'sortOrder': 'ASC',
        };
        telephonyProvidersEdgeApi.getTelephonyProvidersEdgesSites(opts)
            .then((data) => {
                let awsItem = data.entities.find(entitiesItem => entitiesItem.name === 'PureCloud Voice - AWS');            
                locationsApi.getLocation(locationId)
                    .then((locInfo) => {
                        provisionTelephonyFunctions.createSite(awsItem, locInfo);
                    })
                    .catch((err) => {
                        console.log('There was a failure calling getLocation');
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.log('There was a failure calling getTelephonyProvidersEdgesSites');
                console.error(err);
            })
    },

    
    /**
     * create location by calling postTelephonyProvidersEdgesSites
     * @param {json} awsItem 
     * @param {json} locInfo 
     * @returns {modal} success or failed modal
     */

    createSite (awsItem, locInfo) {
        // get information of the site
        loadingModalView.updateLoadingModal('Site is Being Created...')
        let awsItemId = awsItem.id;
        let awsItemName = awsItem.name;
        let awsItemSelfUri = awsItem.selfUri;
        // get the date
        let today = new Date();
        let dateConfig = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        let startDateConfig = dateConfig+'T02:00:00.000';
        let endDateConfig = dateConfig+'T05:00:00.000';
        
        let body = {
            'name': $('#siteName').val(),
            'primarySites': [
                {
                    'id': awsItemId,
                    'name': awsItemName,
                    'selfUri': awsItemSelfUri
                }
            ],
            'secondarySites': [
                {
                    'id': awsItemId,
                    'name': awsItemName,
                    'selfUri': awsItemSelfUri
                }
            ],
            'edgeAutoUpdateConfig': {
                    'timeZone': $('#timeZone').val(),
                    'rrule': 'FREQ=DAILY',
                    'start': startDateConfig,
                    'end': endDateConfig        
                },
            'location': locInfo,
            'ntpSettings': {
                'servers': []
            }
        };
      
        telephonyProvidersEdgeApi.postTelephonyProvidersEdgesSites(body)
            .then((siteData) => {
                console.log(siteData);
                letSiteId = siteData.id;
                return provisionTelephonyViews.displaySuccessModal('Provision Telephony', 'Site was successfully created!', 'Next', 'btnTrunkModal');
            })
            .catch((err) => {
                console.log('There was a failure calling postTelephonyProvidersEdgesSites');
                console.error(err);
                let errorMessage = 'Creating Site has failed. ' + err.body.message;
                return provisionTelephonyViews.displayFailedModal('Provision Telephony', errorMessage , 'Dismiss');
            });
    },

    /**
     * set up provider edge by calling getTelephonyProvidersEdgesSiteOutboundroutes and delete provider edge
     * by calling deleteTelephonyProvidersEdgesOutboundroute
     * @param {json} trunkData 
     * @returns {function} 
     */

    siteOutboundroutes(trunkData) {
        let opts = { 
            'pageSize': 25,
            'pageNumber': 1
        };
        console.log(letSiteId);
        // get outbound routes and delete them
        telephonyProvidersEdgeApi.getTelephonyProvidersEdgesSiteOutboundroutes(letSiteId, opts)
            .then((outboundRoute) => {
                let routeEntities = outboundRoute.entities 
                routeEntities.forEach(entity => {
                    let entityId = entity.id;
                    telephonyProvidersEdgeApi.deleteTelephonyProvidersEdgesOutboundroute(entityId)
                        .then(() => {
                            console.log('deleteTelephonyProvidersEdgesOutboundroute returned successfully.');
                            provisionTelephonyFunctions.createOutboundRoute(trunkData);
                        })
                        .catch((err) => {
                            console.log('There was a failure calling getTelephonyProvidersEdgesSiteOutboundroutes');
                            console.error(err);
                        });
                });
        })
        .catch((err) => {
            console.log('There was a failure calling getTelephonyProvidersEdgesSiteOutboundroutes');
            console.error(err);
        });
    },
    
    /**
     * set up outbound route by calling postTelephonyProvidersEdgesSiteOutboundroutes
     * @param {json} trunkData 
     * @returns {}
     */

    createOutboundRoute (trunkData) {
        let trunkId = trunkData.id;
        let trunkName = trunkData.name;
        let trunkSelfuri = trunkData.selfUri;
        let body = {
            'name': 'Outbound Route',
            'classificationTypes': ['National', 'International'],
            'enabled': true,
            'distribution': '',
            'externalTrunkBases': [
                {
                    'id': trunkId,
                    'name': trunkName,
                    'selfUri': trunkSelfuri
                }
            ]
        };  
        telephonyProvidersEdgeApi.postTelephonyProvidersEdgesSiteOutboundroutes(letSiteId, body)
            .then((data) => {
                console.log(`postTelephonyProvidersEdgesSiteOutboundroutes success! data: ${JSON.stringify(data, null, 2)}`);
            })
            .catch((err) => {
                console.log('There was a failure calling postTelephonyProvidersEdgesSiteOutboundroutes');
                console.error(err);
            });
    },


    /**
     * create select option
     * @param {element} el 
     * @param {string} text 
     * @param {string} value
     * @returns {option} 
     */

    createList(el, text, value) {
        let option = document.createElement('option');
        option.text = text;
        option.value = value;
        option.id = value;
        el.add(option);
    },


    /**
     * format timezone
     * @param {int} n 
     * @returns {string} formatted timezone
     */

    formatNumber(n) {
        return n > 9 ? '' + n: '0' + n;
    },

    /**
     * check what sip end point is needed
     * @param {string} sipOption 
     */

    determineSipEndpoint(sipOption) {
        if(sipOption==='btnTwillio') {
            sipEndPoints = ['54.172.60.0/23', '34.203.250.0/23', '54.244.51.0/24', '54.65.63.192/26', '3.112.80.0/24', '54.169.127.128/26', '3.1.77.0/24']
        }else {
            sipEndPoints = ['173.193.199.24/32','174.37.245.34/32','5.10.112.121/31', '119.81.44.6/31']
        }
    }
}

export default provisionTelephonyFunctions