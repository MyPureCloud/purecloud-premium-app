/**
 * This is a very simple Handlebars framework built
 * specifically for the Premium App Sample.
 * This will only handle the 'View'. There shouldn't be any 
 * PureCloud or Data logic here.
 */

import hb from './template-references.js'

let templatesPath = './views/';

/**
 * Render the Handlebars template to the window
 * @param {string} page     contains filename of handlebars file
 * @param {object} context  context oject
 * @param {string} target   ID of element HTML where rendered module will be placed
 * @param {*}  resolveData  Optional data to pass for resolve of the promise
 * @returns Promise
 */
export function _renderModule(page, context, target, resolveData) {
    context = (typeof context !== 'undefined') ? context : {}; 
    target = (typeof target !== 'undefined') ? target : 'default-module'; 

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
export function _renderCompletePage(headerContext, bodyContext, bodyTemplate){
    // Default values
    headerContext = (typeof headerContext !== 'undefined') ? headerContext : {};
    bodyContext = (typeof bodyContext !== 'undefined') ? bodyContext : {};

    return new Promise((resolve, reject) => {
        _renderModule(hb['root'])
        .then(() => _renderModule(hb['header'], headerContext, 'root-header'))
        .then(() => _renderModule(bodyTemplate, bodyContext, 'root-body'))
        .then(() => resolve())
    })
}

export class Page {
    constructor(onLoadScript, title, subtitle, bodyContext, bodyTemplate){
        this.onLoadScript = onLoadScript;
        this.title = title ? title : "Title";
        this.subtitle = subtitle ? subtitle : "Subtitle";
        this.bodyContext = bodyContext;
        this.bodyTemplate = bodyTemplate;

        this.modules = [];
    }

    load(){
        let loadPageChain = function(){
                _renderCompletePage(
                {
                    "title": this.title,
                    "subtitle": this.subtitle
                },
                this.bodyContext,
                this.bodyTemplate
            )
            .then(renderInternalModules);
        }

        // if onLoadScript is a Promise, wait for it
        // before rendering the page.
        if(typeof this.onLoadScript.then == 'function'){
            this.onLoadScript()
            .then(loadPageChain);
        }else{
            this.onLoadScript();
            loadPageChain();
        }
    }

    renderModule(moduleIndex){
        return new Promise((resolve, reject) => {
            this.modules[moduleIndex]()
            .then(() => resolve())
            .catch(() => reject());
        });
    }

    renderInternalModules(){
        return new Promise((resolve, reject) =>{
            let promise = renderModule(0);
            for(let i = 1; i < this.modules.length; i++){
                promise = promise.then(renderModule(i));
            }
            promise
            .then(() => resolve())
            .catch(() => reject());
        });
    }
}

