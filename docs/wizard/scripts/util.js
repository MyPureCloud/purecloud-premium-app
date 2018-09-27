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
