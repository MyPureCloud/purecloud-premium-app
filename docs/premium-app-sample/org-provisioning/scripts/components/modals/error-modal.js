let modalTemplate = document.createElement('template');
modalTemplate.innerHTML = `
<div class="modal fade" id="error-modal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
        <h3 id = "infoModalHeader">Header</h3>

          <button type="button" class="close" id="close-err" data-dismiss="modal">×</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body" style="text-align:center">
          <p class="card-text">
            <div class="icon-box">
              <i class="material-icons" style="color:#F53131;">cancel_presentation</i>
            </div>
            <p class="body-content" id= "modal-body-content">Body</p>
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" id="modal-footer-button"  class="btn btn-success-modified" data-dismiss="modal">Dismiss</button>
        </div>

      </div>
    </div>
  </div>
  `;

export default {

    new() {
        return document.importNode(modalTemplate.content, true);
    },

    show(title,body,button) {
      document.getElementById('infoModalHeader').innerHTML = title;
      document.getElementById('modal-body-content').innerHTML = body;
      document.getElementById('modal-footer-button').innerHTML = button;
      $('#error-modal').modal();
      this.close();
    },
    close() {
      let errorModal = document.getElementById('error-modal')
      document.getElementById('close-err').addEventListener('click', function () {
          errorModal.remove();
      }, false)
    }
}