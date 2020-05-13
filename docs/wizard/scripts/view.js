const elLoadingModal = document.getElementById('loading-modal');

export default {
    showLoadingModal(message){
        console.info(`modal: ${message}`);

        elLoadingModal.style.display = '';
        let elMessage = elLoadingModal.querySelectorAll('.modal-message')[0]
                            .innerText = message;
    },

    hideLoadingModal(){
        console.info('hide-modal');
        elLoadingModal.style.display = 'none';
    },

    showContent(){
        let elContent = document.querySelectorAll('.content')[0];
        elContent.style.visibility = '';
    },

    hideContent(){
        let elContent = document.querySelectorAll('.content')[0];
        elContent.style.visibility = 'hidden';
    },

    showProductAvailable(){
        let elAvailable = document.getElementById('available');
        let elUnavailable = document.getElementById('unavailable');
        elAvailable.style.display = '';
        elUnavailable.style.display = 'none';
    },

    showProductUnavailable(){
        let elAvailable = document.getElementById('available');
        let elUnavailable = document.getElementById('unavailable');
        elAvailable.style.display = 'none';
        elUnavailable.style.display = '';
    },

    
}