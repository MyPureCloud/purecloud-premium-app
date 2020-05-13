const id = 'yes-no-modal';
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
    <button class="button is-success" id="yes-btn">
      Yes
    </button>
    <button class="button" id="no-btn">
      No
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
        <button type="button" id="yes-btn" class="btn btn-secondary">
          Yes
        </button>
        <button type="button" id="no-btn" class="btn btn-primary">
          No
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

    show(title, question, yesCb, noCb){
        let el = document.getElementById(id);

        let yesBtn = el.querySelectorAll('#yes-btn')[0];
        let noBtn = el.querySelectorAll('#no-btn')[0];
        let titleEl = el.querySelectorAll('.modal-card-title')[0];
        let questionEl = el.querySelectorAll('.modal-text')[0];

        titleEl.innerText = title;
        questionEl.innerText = question;
        yesBtn.onclick = yesCb;
        noBtn.onclick = noCb;

        $(`#${id}`).modal('show');
    },

    hide(){
        $(`#${id}`).modal('hide');
    },

    id: id
};