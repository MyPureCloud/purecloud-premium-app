

let modalTemplate = document.createElement("template");
modalTemplate.innerHTML = 
`
<div id="success-modal" class="modal fade" >
  <div class="modal-dialog modal-lg">
    <div class="modal-content">    
      <div class="modal-header">
        <h3 id = "infoModalHeader">Header</h3>

        <button class="close" data-dismiss="modal" id="close-success">×</button>
      </div>

      <div class="modal-body" style="text-align: center;">
        <p class="card-text">
          <div class="icon-box">
            <i class="material-icons">check_circle</i>
          </div>
          <p id ="modal-body"></p>
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" id="modal-footer-button" class="btn btn-success-modified" data-dismiss="modal" data-toggle="modal">Next</button>
      </div>
    </div>
  </div>
</div>
  `;

export default {

    new() {
        return document.importNode(modalTemplate.content, true);
    },

    show(title,body,button,btnId) {
        document.getElementById('infoModalHeader').innerHTML = title;
        document.getElementById('modal-body').innerHTML = body;
        document.getElementById('modal-footer-button').innerHTML = button;
        document.getElementById('modal-footer-button').id = btnId;
        $('#success-modal').modal();
        this.close();
    },

    hide(){
        let el = document.getElementById('success-modal');
        el.classList.remove('is-active');
    },
    close() {
        let successModal = document.getElementById('success-modal')
        document.getElementById('close-success').addEventListener('click', function () {
            successModal.remove();
        }, false)
    }
}