/**
 * Sets the button click event handler using JQuery but replacing
 * any other event handlers.
 * @param {Object} that context of this 
 * @param {String} buttonId element ID of button  
 * @param {function} callbackFunction  function to call
 */
export function setButtonClick(that, buttonId, callbackFunction){
    $(buttonId)
    .off('click')
    .click($.proxy(callbackFunction, that));
}