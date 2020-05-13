const id = 'loading-modal';
let t = document.createElement('template');
t.innerHTML =
`
<div id="${id}" class="modal">           
    <div class="loader loader-default is-active" data-text="Custom text" data-blink></div>
</div>`;

export default {
    new(){
        return document.importNode(t.content, true);
    },

    show(message){
        let el = document.getElementById(id);
        let loaderEl = el.querySelectorAll('.loader')[0];
        loaderEl.setAttribute('data-text', message);
        $(`#${id}`).modal('show'); 
    },

    hide(){
        $(`#${id}`).modal('hide'); 
    },

    id: id
};