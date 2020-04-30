let modalTemplate = document.createElement('template');
modalTemplate.innerHTML = 
`
<div id="form-modal" role="dialog" class="modal fade" >
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
    <form class="needs-validation" novalidate method="dialog">
      <div class="modal-header">
        <h3 id = 'infoModalHeader'>Header</h3>
        <button class="close" data-dismiss="modal" id="close-form">×</button>
      </div>
      
      <div id ="modal-body" class="modal-body">     
      </div>
      <div class="modal-footer">
        <button type="submit" id="modal-footer-button" class="btn btn-success-modified" data-toggle="modal" >Next</button>
      </div>
    </form>
    </div>
  </div>
</div>
`;
const formModal = {

  new() {
    return document.importNode(modalTemplate.content, true);
  },

  show(title, body, button, btnId) {
    document.getElementById('infoModalHeader').innerHTML = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer-button').innerHTML = button;
    document.getElementById('modal-footer-button').id = btnId;
    $('#form-modal').modal();
    this.close();
  },
  hide() {
    $('#form-modal').modal('hide');
  },
  close() {
    let formModal = document.getElementById('form-modal')
    document.getElementById('close-form').addEventListener('click', function () {
      formModal.remove();
    }, false)
  }
}

export default formModal