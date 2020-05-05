let t = document.createElement('template');
t.innerHTML =
`
<div class="card use-case">
  <div class="card-content">
    <span class="card-header-icon">
      <button type="button" class="close delete" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </span>
    <div class="content div-section">
      <div class="div-info">
        <label class="label">Title</label>
        <div class="control">
          <input class="form-control useCase-title" type="text" placeholder="" value="">
        </div>
        <label class="label">Summary <span class="md-format-text">(MarkDown Format)</span></label>
        <div class="control">
          <textarea class="form-control useCase-summary" placeholder="Summary" value=""></textarea>
        </div>
      </div>
      <div class="div-info">
        <label class="label">Business Benefits <span class="md-format-text">(MarkDown Format)</span></label>
        <div class="control">
          <textarea class="form-control useCase-benefits" placeholder="Business Benefits" value=""></textarea>
        </div>
      </div>      
    </div>
  </div>
</div>
`;


const idPrefix = 'use-case_';


/**
 * Delete the use case
 * @param {integer} id suffix id of the usecase element
 */
function deleteUseCase(id){
    let el = document.getElementById(idPrefix + id);
    el.parentNode.removeChild(el);
}

export default {
    new(id){
        // Crete element
        const element = document.importNode(t.content, true);
        element.querySelectorAll('.card')[0].id = idPrefix + id;

        // Assign delete functionality
        element.querySelectorAll('.delete')[0]
        .addEventListener('click', function(){
            deleteUseCase(id);
        });

        return element;
    },

    /**
     * Fill a specific use case field with info
     * @param {integer} id the element id suffix of the use case
     * @param {Object} content data that will be used to fill the element.
     */
    fill(id, content){
        const el = document.getElementById(idPrefix + id);
        const title = el.querySelectorAll('.useCase-title')[0];
        const summary = el.querySelectorAll('.useCase-summary')[0];
        const benefits = el.querySelectorAll('.useCase-benefits')[0];

        title.value = content.title;
        summary.value = content.useCaseSummary;
        benefits.value = content.businessBenefits;
    }
};