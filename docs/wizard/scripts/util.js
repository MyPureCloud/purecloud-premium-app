var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

/**
 * Switches to a different page and attaches the language as query param
 * This could also be stored in a cookie/session instead
 * @param {Sring} page 
 */
var goToPage = function goToPage(page){
    window.location = getUrlParameter('langTag') ? 
        page + '.html?langTag=' + getUrlParameter('langTag') : 
        page + '.html?langTag=en-us';
};

/**
 * Renders the proper text language into the web pages
 * @param {Object} text  Contains the keys and values from the language file
 */
var displayPageText = function displayPageText(text){
    $(document).ready(() => {
        for (let key in text){
            if(!text.hasOwnProperty(key)) continue;
            $("." + key).text(text[key]);
        }
    });
};

/**
 * Shows an overlay with the specified data string
 * @param {string} data 
 */
var logInfo = function logInfo(data){
    if (!data || (typeof(data) !== 'string')) data = "";

    $.LoadingOverlay("text", data);
};