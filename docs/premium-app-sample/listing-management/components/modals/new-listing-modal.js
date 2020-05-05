const id = 'listing-creation-modal';
let t = document.createElement('template');

t.innerHTML =
`
<div id="${id}" class="modal fade" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="new-listing-name">App Name</label>
          <input type="email" class="form-control" id="new-listing-name">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">
          Cancel
        </button>
        <button type="button" id="btn-create-listing" class="btn btn-primary">
          Create
        </button>
      </div>
    </div>
  </div>
</div>
`;

export default {
    new(){
        // Crete element
        const element = document.importNode(t.content, true);

        // Child references
        const createBtn = element.getElementById('btn-create-listing');
        const inputName = element.getElementById('new-listing-name');

        // Create a new listing
        createBtn.addEventListener('click', function(){
            createNewListing(inputName.value);
        });

        return element;
    },

    show(){
      $(`#${id}`).modal('show');
    },

    hide(){
      $(`#${id}`).modal('hide');
    },

    id: id
};