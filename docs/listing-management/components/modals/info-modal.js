const id = 'info-modal';
let t = document.createElement('template');
t.innerHTML =
`
<div id="${id}" class="modal">
<div class="modal-background"></div>
<div class="modal-card">
  <header class="modal-card-head">
    <p class="modal-card-title">Confirmation</p>
    <button class="delete" aria-label="close" onclick="hideCreationModal()"></button>
  </header>
  <section class="modal-card-body">
    <p class='modal-text'>Question</p>
  </section>
  <footer class="modal-card-foot">
    <button class="button is-success ok-btn">
      Ok
    </button>
  </footer>
</div>
</button>
</div>
`;

t.innerHTML = 
`
<div id="${id}" class="modal fade" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title modal-card-title">Confirmation</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <p class='modal-text'>Question</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary ok-btn">
          Ok
        </button>
      </div>
    </div>
  </div>
</div>
`;

export default {
    new(){
        return document.importNode(t.content, true);
    },

    show(title, message, cb){
        let el = document.getElementById(id);

        let okBtn = el.querySelectorAll('.ok-btn')[0];
        let titleEl = el.querySelectorAll('.modal-card-title')[0];
        let messageEl = el.querySelectorAll('.modal-text')[0];

        titleEl.innerText = title;
        messageEl.innerText = message;
        okBtn.onclick = cb;

        $(`#${id}`).modal('show');
    },

    hide(){
      console.log("asdasd");
      $(`#${id}`).modal('hide');
    },

    id: id
};