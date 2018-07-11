/**
 * This is a very simple Handlebars framework built
 * specifically for the Premium App Sample.
 * This will only handle the 'View'. There shouldn't be any 
 * PureCloud or Data logic here.
 */

import hb from './template-references.js'

// All pages are separate modules inside the pages folder
import landingPage from './pages/landingPage.js'
import installStatusPage from './pages/installStatusPage.js'
import rolesCreation from './pages/rolesCreation.js'
import rolesAssignment from './pages/rolesAssignment.js'
import groupsCreation from './pages/groupsCreation.js'
import appsCreation from './pages/appsCreation.js'
import finalizeInstallation from './pages/finalizeInstallation.js'
import installingPage from './pages/installingPage.js'

let templatesPath = './views/';

let pageMapping = {
    "landingPage": landingPage,
    "installStatusPage": installStatusPage, 
    "rolesCreation": rolesCreation,
    "rolesAssignment": rolesAssignment,
    "groupsCreation": groupsCreation,
    "appsCreation": appsCreation,
    "finalizeInstallation": finalizeInstallation,
    "installingPage": installingPage
}

export default class PageManager {
    constructor(appContext){
        this.app = appContext;
        this.currentPage = null;
        this.logInfo = null;
    }
    /**
     * Render the Handlebars template to the window
     * @param {string} page     contains filename of handlebars file
     * @param {object} context  context oject
     * @param {string} target   ID of element HTML where rendered module will be placed
     * @param {*}  resolveData  Optional data to pass for resolve of the promise
     * @returns Promise
     */
    _renderModule(page, context, target, resolveData) {
        context = (context) ? context : {}; 
        target = (target) ? target : 'default-module'; 

        // Add static text context
        context.static = this.app.languageContext.pages[this.currentPage];
        console.log(context);

        let templateUri = templatesPath + page + '.hbs';
        let templateSource;
        let template;

        return new Promise((resolve, reject) => {
            // Async get the desired template file
            $.ajax({
                url: templateUri,
                cache: true
            })
            .done(data => {
                // Compile Handlebars template 
                templateSource = data;
                template = Handlebars.compile(templateSource);

                // Render html and display to the target element
                let renderedHtml = template(context);
                $('#' + target).html(renderedHtml);

                resolve(resolveData);
            })
            .fail(xhr => {
                console.log('error', xhr);
                reject(xhr);
            });
        });
    }

    /**
     * Render a complete page with header and body
     * @param {Object} headerContext    contains title and subtitle for header
     * @param {Object} bodyContext      context for the body
     * @param {string} bodyTemplate     filename of template for the body section
     * @returns Promise
     */
    _renderCompletePage(headerContext, bodyContext, bodyTemplate){
        // Default values
        headerContext = (typeof headerContext !== 'undefined') ? headerContext : {};
        bodyContext = (typeof bodyContext !== 'undefined') ? bodyContext : {};

        return new Promise((resolve, reject) => {
            this._renderModule(hb['root'])
            .then(() => this._renderModule(hb['header'], headerContext, 'root-header'))
            .then(() => this._renderModule(bodyTemplate, bodyContext, 'root-body'))
            .then(() => resolve())
        })
    }

    /**
     * Sets the button click event handler using JQuery but replacing
     * any other event handlers.
     * @param {Object} that context of this 
     * @param {String} buttonId element ID of button  
     * @param {function} callbackFunction  function to call
     */
    _setButtonClick(that, buttonId, callbackFunction){
        $(buttonId)
        .off('click')
        .click($.proxy(callbackFunction, that));
    }

    /**
     * Adds a listener to the input element that will validate if value is 'acceptable' string.
     * @param {string} id   Id of element that contains input 
     */
    _setValidateInput(id){
        $(id).off('input').on('input', function(){
            if(/^[a-zA-Z0-9_.!, ]+$/.test(this.value)){
                $(this).removeClass('is-danger');
            }else{
                $(this).addClass('is-danger');
            }
        });
    }

    /**
     * Adds a listener to the input element that will validate if value is a URL
     * @param {string} id Id of element that should contain URL
     */
    _setValidateURL(id){
        $(id).off('input').on('input', function(){
            if(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(this.value)){
                console.log('YES');
                $(this).removeClass('is-danger');
            }else{
                console.log('NO');
                $(this).addClass('is-danger');
            }
        });
    }

    /**
     * Method available to the pages to reference different pages
     * @param {String} shorthand 
     */
    _getTemplate(shorthand){
        return hb[shorthand];
    }

    setPage(newPage){
        try{
            this.logInfo = null;
            pageMapping[newPage].call(this);
            this.currentPage = newPage;
        } catch(e){
            throw e;
        }
    }

    /**
     * Factory to give a page setter on desired page
     * @param {String} page shorthnd page reference
     */
    _getPageSetter(page){
        try{
            return () => this.setPage(page);
        } catch(e){
            throw e;
        }
    }
}