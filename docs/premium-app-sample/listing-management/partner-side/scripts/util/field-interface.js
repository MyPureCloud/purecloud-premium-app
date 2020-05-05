/**
 * Helper function to gettin and setting field values.
 * TODO: Decide if to generify the setters as well
 */
function getInputText(fieldId){
    let val = document
                .getElementById(fieldId)
                .querySelectorAll('input')[0].value;
    return val ? val : "";
}

function getTextArea(fieldId){
    let val = document
            .getElementById(fieldId)
            .querySelectorAll('textarea')[0].value;
    return val ? val : "";
}

function getCheckBoxes(fieldId){
    let val = [];
    let field = document.getElementById(fieldId);
    let cbs = field.querySelectorAll('input');   
    for(let i = 0; i < cbs.length; i++){
        let cb = cbs.item(i);
        if(cb.checked){
            val.push(cb.value);
        }
    }
    return val;
}

function getRadio(fieldId){
    let val = "";
    let field = document.getElementById(fieldId);
    let radios = field.querySelectorAll('input');
    for(let i = 0; i < radios.length; i++){
        let rd = radios.item(i);
        if(rd.checked){
            val = rd.value;
            break;
        }
    }
    return val;
}

export default {
    /**
     * Update the value of a input field
     * @param {String} el_id id of the field container element
     * @param {String} text text to be the value of the input
     */
    inputTextFill(el_id, text){
        document
            .getElementById(el_id)
            .querySelectorAll('input')[0].value = text;
    },

    /**
     * Update the value of a textarea field
     * @param {String} el_id id of the container field
     * @param {String} text text to be put on the textarea
     */
    textAreaFill(el_id, text){
        document
        .getElementById(el_id)
        .querySelectorAll('textarea')[0].value = text;
    },

    /**
     * Update a group of checkboxes based on an array 
     * @param {String} cb_class common class of the group of checkboxes
     * @param {Array} items array of vlaues to be checked against the 
     *                      individual cb values.
     */
    checkBoxesFill(cb_class, items){
        let cbs = document.getElementsByClassName(cb_class);
        for(let i = 0; i < cbs.length; i++){
            let cb = cbs.item(i);
            if(items.includes(cb.value)){
                cb.checked = true;
            } else {
                cb.checked = false;
            }
        }
    },

    /**
     * Update a group of radio buttons
     * @param {String} name common name of the radio buttons
     * @param {String} valueChecked string to be checkd against the value od radio
     */
    radioFill(name, valueChecked){
        let radios = document.getElementsByName(name);
        for(let i = 0; i < radios.length; i++){
            let radio = radios.item(i);
            if(radio.value == valueChecked) {
                radio.checked = true;
                break;
            }
        }
    },

    getFieldValue(type, fieldId){
        switch(type){
            case 'input':
                return getInputText(fieldId);
                break;
            case 'textarea':
                return getTextArea(fieldId);
                break;
            case 'checkbox':
                return getCheckBoxes(fieldId);
                break;
            case 'radio':
                return getRadio(fieldId);
                break;
        }
    }
}