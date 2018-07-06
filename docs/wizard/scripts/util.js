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

/**
 * Adds a listener to the input element that will validate if value is 'acceptable' string.
 * @param {string} id   Id of element that contains input 
 */
export function setValidateInput(id){
    $(id).off('input').on('input', function(){
        if(/^[a-zA-Z0-9_.!, ]+$/.test(this.value)){
            console.log('YES');
            $(this).removeClass('is-danger');
        }else{
            console.log('NO');
            $(this).addClass('is-danger');
        }
    });
}

/**
 * Adds a listener to the input element that will validate if value is a URL
 * @param {string} id Id of element that should contain URL
 */
export function setValidateURL(id){
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