let t = document.createElement('template');
t.innerHTML =
`
<div id="loading-modal" class="modal" >           
    <div id="loaderDiv" class="loader loader-default  is-active" data-text="Custom text" data-blink></div>
</div>
`
;

export default {
    new(){
        return document.importNode(t.content, true);
    },

    show(message){
        document.getElementById('loaderDiv').setAttribute('data-text', message);
        $('#loading-modal').modal(); 
    },

    updateText(message){
        document.getElementById('loaderDiv').setAttribute('data-text', message);
    },

    hide(){
        $('#loading-modal').modal('hide');
    }
};