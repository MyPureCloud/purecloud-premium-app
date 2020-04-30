/**
 * Everything about the uploading of attachments
 */

import validators from '../../../config/validators.js'
import config from '../../../config/config.js';

/**
 * Validate 
 * @param {File} file file that's 'uploaded'
 * @param {String} fileTypeRegEx file type in REGEX format 
 * @returns {Boolean} if the file type is correct
 */
function validateFileType(file, fileTypeRegEx){
    let valid = true;
    
    // File type
    if(fileTypeRegEx){
        console.log(file.type);
        const regex = new RegExp(fileTypeRegEx);
        if (!(regex).test(file.type) ){
            valid = false;
        }
    }

    return valid;
}

/**
 * Validate images that are uploaded.
 * @param {Image} img img that is uploaded
 * @param {Object} rule rules for that img field as defined in config validators
 * @returns {Boolean} if the met the rule requiremenets
 */
function validateImage(img, rule){
    let valid = true;
    if(rule.minWidth){
        if(img.width < rule.minWidth) valid = false;
    }
    if(rule.minHeight){
        if(img.height < rule.minHeight) valid = false;
    }
    if(rule.maxWidth){
        if(img.width > rule.maxWidth) valid = false;
    }
    if(rule.maxHeight){
        if(img.height > rule.maxHeight) valid = false;
    }
    if(rule.ratio){
        let ratio = rule.ratio.split('x');
        let ratio_w = ratio[0];
        let ratio_h = ratio[1];

        if(img.width % ratio_w > 0) valid = false;
        if(img.height % ratio_h > 0) valid = false;
        if(img.width / ratio_w != img.height / ratio_h) valid = false;
    }
    return valid;
}


/**
 * When an image is uploaded
 * @param {File} file the File
 * @param {Object} rule defined in the config validators
 */
function readImage(file, rule){
    // Get elements
    let el_field = document.getElementById(rule.fieldId);
    let el_previewContainer = el_field.querySelectorAll('.preview-image')[0];
    let el_errorMessge = el_field.querySelectorAll('p.help')[0];

    // Empty error msg
    el_errorMessge.innerText = '';
    el_previewContainer.style.display = 'none';

    // Validat file type
    if(!validateFileType(file, `^image\/(${rule.fileType})$`)){
        el_errorMessge.innerText = rule.message;
        return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const img  = new Image();
        img.addEventListener('load', () => {
            // Validate the image itself
            if(!validateImage(img, rule)){
                el_errorMessge.innerText = rule.message;
            } else {
                el_previewContainer.style.display = 'block';
            }

            el_previewContainer.appendChild(img);
        });
        img.src = reader.result; 
    });
    reader.readAsDataURL(file);
}

function readDocument(file, rule){
    // Get elements
    let el_field = document.getElementById(rule.fieldId);
    let el_previewContainer = el_field.querySelectorAll('.preview-image')[0];
    let el_errorMessge = el_field.querySelectorAll('p.help')[0];

    // Empty error msg
    el_errorMessge.innerText = '';
    el_previewContainer.style.display = 'none';

    // Validat file type
    if(!validateFileType(file, `^application\/(${rule.fileType})$`)){
        el_errorMessge.innerText = rule.message;
        return;
    }

    // Show file details once loaded
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        el_previewContainer.style.display = 'block';

        el_previewContainer.innerText = 
                    `${file.name} (${file.size/1024})`;
    });
    reader.readAsDataURL(file);
}

function readFile(file, rule){
    switch(rule.type){
        case 'image':
            readImage(file, rule);
            break;
        case 'document':
            readDocument(file, rule);
            break;
    }
}


export default {
    /**
     * Setup for the attachment fields. 
     * @param {Object} platformClient PureCloud platform client reference
     * @param {Object} client reference to client instance
     * @param {Object} attachmentsData the attachments from the data table
     */
    setup(platformClient, client, attachmentsData){
        const contentManagementApi = new platformClient.ContentManagementApi();

        // Go thourhg the validators.attachment rules
        Object.keys(validators.attachments).forEach(field => {
            let rule = validators.attachments[field];

            // Get important child elements
            let el_field = document.getElementById(rule.fieldId);
            let el_input = el_field.querySelectorAll('input')[0];
            let el_previewContainer = el_field
                                    .querySelectorAll('.preview-image')[0];
            let el_previewLoading = el_field
                                    .querySelectorAll('.preview-loading')[0];
            let el_errorMessage = el_field.querySelectorAll('p.help')[0];


            // Set Callback function when file is 'uploaded'
            el_input.addEventListener('change', function(ev){
                let files = ev.target.files;
                // If no file is chosen or cancelled is clicked 
                if(files.length <= 0) return;

                // Remove the preview img from the contianer
                while (el_previewContainer.firstChild) {
                    el_previewContainer.removeChild(el_previewContainer.firstChild);
                }

                if(el_input.multiple){
                    // If multiple files loop through them to read
                    for(let i = 0; i < files.length; i++){
                        // Consider only the first files up till the maxFiles rule
                        if(rule.maxFiles && i >= rule.maxFiles) break;

                        readFile(files[i], rule);
                    }
                } else {
                    // If only one file then read it
                    let file = files[0];
                    readFile(file, rule);
                }                
            });

            // Check if file existing already in the workspace
            const arrDocumentNames = Object.keys(attachmentsData).filter(key => {
                // Just check the first part of string for enumerated 
                // files liek screenshots
                return key.startsWith(field);
            })
            if(arrDocumentNames.length <= 0)  return;
            
            // Go thourhg the documents in this specific field and show the preview
            arrDocumentNames.forEach(docName => {
                // Get entire data from the data table info
                let doc = attachmentsData[docName];
                el_previewLoading.style.display = 'block';

                contentManagementApi.getContentmanagementDocument(doc.id)
                .then((docPcData) => {
                    let thumbnails = docPcData.thumbnails;
                    if(thumbnails && thumbnails.length > 0){
                        const img  = new Image();
                        img.addEventListener('load', () => {
                            el_previewContainer.style.display = 'block';
                            el_previewLoading.style.display = 'none';
                            el_previewContainer.appendChild(img);

                            el_errorMessage.innerText = '';
                        });
                        img.src = docPcData.thumbnails[0].imageUri; 
                    }else{
                        const img  = new Image();
                        img.addEventListener('load', () => {
                            el_previewContainer.style.display = 'block';
                            el_previewLoading.style.display = 'none';
                            el_previewContainer.appendChild(img);

                            el_errorMessage.innerText = '';
                        });
                        img.src = config.globalAssetsURL + 'img/file.png'; 

                        let statement = document.createElement('div'); 
                        statement.innerText =
                             `No Preview available. But don't worry, file ${docPcData.filename} is stored and exists.`;
                        el_previewContainer.appendChild(statement);
                    }
                })
                .catch(e => console.error(e));
            });

            
        })
    },

    /**
     * Upload the files into the workspace document
     * @param {Object} platformClient PureCloud platform client
     * @param {Object} client client instance of purecloud sdk
     * @param {String} workspaceId listing workspace id
     */
    uploadFiles(platformClient, client, workspaceId){
        const contentManagementApi = new platformClient.ContentManagementApi();
        const token = client.authData.accessToken;

        let buildOrder = []; // Objects with name and File
        let buildPromises = []; 

        // Generate the build order for the attachemnts that will be 
        // created
        Object.keys(validators.attachments).forEach(key =>{
            let rule = validators.attachments[key];
            let files = document.getElementById(rule.fieldId)
                                .querySelectorAll('input')[0].files;
            
            // Skip if no file in the input
            if(files.length <= 0) return;

            // If multi-file, then put suffizx enumeration
            if(rule.manyFiles){
                for(let i = 0; i < files.length; i++){
                    buildOrder.push({
                        name: `${key}-${i + 1}`,
                        file: files[i]
                    });
                }
            } else {
                // For single file
                buildOrder.push({
                    name: key,
                    file: files[0]
                })
            }
            
            console.log(buildOrder);
        });

        // Let's build this 
        buildOrder.forEach(build => {
            let documentId = ''; // documentId
            let document = {};

            let promise = contentManagementApi.postContentmanagementDocuments({
                name: build.name,
                workspace: {
                    id: workspaceId
                }
            })
            .then((result) => {
                let uri = result.uploadDestinationUri;
                documentId = result.id;

                let formData = new FormData();
                formData.append('file', build.file);

                return fetch(uri, {
                    method: 'POST',
                    headers: {
                        Authorization: `bearer ${token}`
                    },
                    body: formData
                })
            })
            .then((result) => {
                // TODO: update to actually track the files if uploaded or not.
                // Right now, it's just hardcoded seconds to wait while uploading
                let seconds = 4000; 
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        contentManagementApi.getContentmanagementDocument(documentId)
                        .then((doc) => {
                            resolve(doc);
                        })
                        .catch(e => reject(e));
                    }, seconds);
                });
            })
            .then((doc) => {
                document = doc;

                // Make the document public
                return contentManagementApi.postContentmanagementShares({
                    sharedEntityType: 'DOCUMENT',
                    sharedEntity: {
                       id: documentId
                    },
                    memberType: 'PUBLIC'
                })
            })
            .then((result) => {
                // Build the attacahment  of this file
                // that will be in the data table attaachments
                let attachment = {
                    name: document.name,
                    sharingUri: document.sharingUri,
                    id: document.id
                }

                return attachment;
            })
            .catch((e) => console.error(e));

            buildPromises.push(promise);
        });

        return Promise.all(buildPromises);
    },

    /**
     * Validate the files that are uploaded.
     * Called from edit-listing as the pre and final validation of the listing
     * (opening and saving)
     * NOTE: Important. we're basically coupling the error message in HTML
     * as the basis for this validation. Unlike basic fields where the validator functions are
     * actually rerun, were doing the easy way here of jusst checking the
     * error messages if they are present or not.
     * TL;DR: No error message displayed = all files are valid.
     * Exception is the "required" property for the rule.
     * @param {Boolean} includePremium if it should consider premium app attachments
     */
    validateFields(includePremium){
        let valid = true;
        
        Object.keys(validators.attachments).forEach(key => {
            let rule = validators.attachments[key];
            if(!rule.fieldId) return;
            if(!includePremium && rule.forPremium) return;

            let el_container = document.getElementById(rule.fieldId);
            let el_preview = el_container.querySelectorAll('.preview-image')[0];
            let el_previewLoading = el_container.querySelectorAll('.preview-loading')[0];
            let el_errorMessge = el_container.querySelectorAll('p.help')[0];

            // For the required property required property, 
            // it should check if the preview section has content
            if(rule.required 
                    && !el_preview.hasChildNodes() 
                    && el_previewLoading.style.display != 'block'
                ){
                el_errorMessge.innerText = rule.message;
            }

            // Check the error messages if they exist as basis for validation
            if(el_errorMessge.innerText.length > 0) valid = false;
        });

        return valid;
    }
}