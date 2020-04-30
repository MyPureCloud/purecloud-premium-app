import useCaseTemplate from '../templates/use-case.js';
/**
 * All the things that deals with the use cases dynamic 'special' field.
 */

// NOTE: Just in case it's needed in the future. 
// Maximum is already implemented and will alert when reached.
const maximumUseCases = 1000;

// Globals 
let numUseCases = 0;
let highestCaseNum = 0;

/**
 * Create a new use case in the DOM
 * @param {Object} content (optional) content to prefill the field with
 */
function addUseCase(content){
    if(numUseCases >= maximumUseCases){
        throw new Error('Maximum use cases reached.');
    }

    // Create the element
    let container = document.getElementById('app-useCases');
    container.appendChild(useCaseTemplate.new(highestCaseNum + 1));

    highestCaseNum++;
    numUseCases++;

    // Prefill with content (if need to)
    if(content) useCaseTemplate.fill(highestCaseNum, content);
}

export default {
    /**
     * Setup stuff
     */
    setup(){
        // Determine number of use cases
        const useCases = document.getElementsByClassName('use-case');
        numUseCases = useCases.length;
        for(let i = 0; i < numUseCases; i++){
            useCases.item(i);
        }

        // Assing event listener to buttons
        document.getElementById('btn-add-useCase')
        .addEventListener('click', function(e){
            e.preventDefault();
            addUseCase();
        });
    },
    
    /**
     * View function. NOTE: This is called in a different context than setup
     * ie they don't share global values. 
     * @param {Array} useCases array of use cases as defined in listingDetails 
     */
    showUseCases(useCases){
        useCases.forEach((uc) => {
            addUseCase(uc);
        });
    },

    /**
     * Save the use cases into an array that will be used in the 
     * useCases property of listingDetails
     * @returns {Array} as defined in the listingDetails useCases property
     */
    buildField(){
        let useCases = [];

        // Get all use case field elements and values
        let els = document.getElementsByClassName('use-case');
        for(let i = 0; i < els.length; i++){
            console.log('aa');
            let useCase_el = els.item(i);
            let title = useCase_el.querySelectorAll('.useCase-title')[0].value;
            let summary = useCase_el.querySelectorAll('.useCase-summary')[0].value;
            let benefits = useCase_el.querySelectorAll('.useCase-benefits')[0].value;

            // Add the JSON values
            useCases.push({
                title: title,
                useCaseSummary: summary,
                businessBenefits: benefits
            });
        }

        return useCases;
    }
}   