export default {
    /**
     * Meant to be used for assigning the innerHTML of a container.
     * Turns arrays into a div of strings that go down.
     * @param {Array} arr array of strings
     * @returns {String} string that represents html
     */
    arrayToDivList(arr){
        let innerHTML = '';
        arr.forEach(element => {
           innerHTML += `<div>${element}</div>`; 
        });

        return innerHTML;
    }      
}