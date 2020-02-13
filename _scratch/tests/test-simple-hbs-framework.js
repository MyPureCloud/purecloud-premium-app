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

/**
 * Class for all pages of the Web App
 * @todo Event handler assignment always being called per module update, 
 *       inefficient but there shouldn't be noticeable performance hit.
 */
export class Page {
    /**
     * Sets up the page
     * @param {Promise} preLoadScript Function that is called before rendering
     * @param {Promise} postLoadScript Function that is called after rendering
     * @param {String} title    Title of the page
     * @param {String} subtitle Subtitle of the page
     * @param {Object} bodyContext  Context of the hbs page
     * @param {String} bodyTemplate path of template to use
     */
    constructor(preLoadScript, postLoadScript, title, subtitle, bodyContext, bodyTemplate){
        this.preLoadScript = preLoadScript;
        this.postLoadScript = postLoadScript;
        this.title = title ? title : "Title";
        this.subtitle = subtitle ? subtitle : "Subtitle";
        this.bodyContext = bodyContext;
        this.bodyTemplate = bodyTemplate;

        /**
         * Element is array of _renderModule args
         */
        this.modules = [];

        this.assignHandlers = null;
    }

    /**
     * Loads the page to the screen and assigns
     * all event handlers
     */
    load(){
        let loadPageChain = (data) => {
            if(data) this.bodyContext = data;
            _renderCompletePage(
                {
                    "title": this.title,
                    "subtitle": this.subtitle
                },
                this.bodyContext,
                this.bodyTemplate
            )
            .then($.proxy(this.renderInternalModules, this))
            .then(this.postLoadScript);
        }
        if(this.preLoadScript === null){
            console.log("aaa");
            loadPageChain();
            return;
        }else{
            this.preLoadScript()
            .then(loadPageChain);
        }
    }

    /**
     * Renders the specified module based on the index on 
     * 'modules' property array
     * @param {Number} moduleIndex 
     */
    renderModule(moduleIndex){
        return new Promise((resolve, reject) => {
            _renderModule.apply(this, this.modules[moduleIndex])
            .then(() => {
                $.proxy(this.assignHandlers, this);
                resolve();
            })
            .catch(() => reject());
        });
    }

    /**
     * Render the modules from the 'modules' array property.
     */
    renderInternalModules(){
        return new Promise((resolve, reject) =>{
            // Call handler assingment if no internal modules
            if(this.assignHandlers)
                $.proxy(this.assignHandlers, this)();
            resolve();

            // Render all modules sequentially then run
            // assign handlers method adterwards
            let promise = renderModule(0);
            for(let i = 1; i < this.modules.length; i++){
                promise = promise.then(renderModule(i));
            }
            promise
            .then(() => {
                $.proxy(this.assignHandlers, this);
                resolve();
            })
            .catch(() => reject());
        });
    }
}