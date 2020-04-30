/**
 * Will assign the validator functions to the different fields.
 * Validation rules is in the config folder for each property in the 
 * listing details.
 *
 */

/**
 * Assign the validator
 * @param {Object} rule rule as defined in the config file
 * @returns {Object} Two keys:
 *                func: the actual function event listener
 *                context: the supposed context which is an HTML element
 */
export default function(rule){
    let field = document.getElementById(rule.fieldId);
    let validatorFunction = null;
    let context = null;

    // For text realted input
    if(rule.type == 'input' || rule.type == 'textarea'){
        validatorFunction = function(){
            let valid = true;

            // Required Field
            if(rule.required){
                if((this.value.length) <= 0){
                    valid = false;
                }
            }

            // Maximum Character Count
            if(rule.maxChar){
                if((this.value.length) > rule.maxChar){
                    valid = false;
                }
            }

            // Formatting
            if(this.value.length > 0){
                switch(rule.format){
                    case 'email':
                        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if(!re.test(String(this.value).toLowerCase())) valid=false;
                        break;
                    case 'website':
                        let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                                '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                        if(!pattern.test(this.value)) valid=false;
                        break;
                    default: break;
                }
            }

            if(valid){
                this.classList.remove('is-danger');
                field.querySelectorAll('p.help')[0].innerText = '';
            }else{
                this.classList.add('is-danger');
                field.querySelectorAll('p.help')[0].innerText = rule.message;
            }

            return valid;
        };
        context = field.querySelectorAll(rule.type)[0];

        context.addEventListener('input', validatorFunction);
    }
    
    // For checkbox groups
    if(rule.type == 'checkbox'){
        let checkboxes = field.querySelectorAll('input');      
        validatorFunction = function(){
            let valid = true;
            let currentValues = [];

            for(let i = 0; i < checkboxes.length; i++){
                let cb = checkboxes.item(i); 
                if(cb.checked){
                    currentValues.push(cb.value);
                }
            }

            // Minimum Value
            if(currentValues.length < rule.min){
                valid = false;
            }

            // If invalid color that field
            if(valid) this.classList.remove('is-danger');

            // Message show if invalid
            field.querySelectorAll('p.help')[0].innerText = 
            valid ? '' : rule.message;

            return valid;
        };
        context = field;

        field.addEventListener('click', validatorFunction);
    }

    // For radio groups
    if(rule.type == 'radio'){
        let radioBoxes = field.querySelectorAll('input');  
        validatorFunction = function(){
            let valid = true;
            let currentValue = null;

            for(let i = 0; i < radioBoxes.length; i++){
                let radio = radioBoxes.item(i); 
                if(radio.checked){
                    currentValue = radio.value;
                    break;
                }
            }

            // Required
            if(!currentValue){
                valid = false;
            }

            // If invalid color that field
            if(valid) this.classList.remove('is-danger');

            // Message show if invalid
            field.querySelectorAll('p.help')[0].innerText = 
            valid ? '' : rule.message;

            return valid;
        };
        context = field;
        context = field;
        field.addEventListener('click', validatorFunction);
    }

    if(!validatorFunction || !context){
        throw new Error(`Invalid function or context for field id: ${rule.fieldId}`);
    }

    return {
        func: validatorFunction, 
        context: context
    };
}
