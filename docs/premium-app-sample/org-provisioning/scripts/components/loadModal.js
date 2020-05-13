import loadingModal from './modals/loading-modal.js';
export default{
    setupLoadingEl() {
        const newLoadingEl = loadingModal.new();
        document.body.appendChild(newLoadingEl);
    },
    showloadingModal(message) {
        loadingModal.show(message);
    },
    hideLoadingModal(){
        loadingModal.hide();
    },
    updateLoadingModal(message){
        loadingModal.updateText(message);
    }
}