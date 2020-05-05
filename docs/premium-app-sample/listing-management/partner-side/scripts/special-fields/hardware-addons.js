/**
 * All the things that deals with the hardware add-ons 'special' field.
 * TODO: Validators for the text fields inside the regions
 */

const regions = ['useast', 'uswest', 'frankfurt', 
                'ireland', 'japan', 'australia'];
const cbIdPrefix = 'cb-app-hardwareAddons-';
const divIdPrefix = 'app-hardwareAddons-';

export default {
    /**
     * Basically create the behavior of clicking checkbox
     * then will show the corresponding input fields in that region
     */ 
    setup(){
        regions.forEach(region => {
            let toggableDiv = document.getElementById(divIdPrefix + region);
            let toggleCbox = document.getElementById(cbIdPrefix + region);

            // Determine the initial visibility of the region
            if(toggleCbox.checked){
                toggableDiv.style.display = 'flex';
            }else {
                toggableDiv.style.display = 'none';
            }

            // Add the event listeners for the checkbox
            toggleCbox.addEventListener('change', function(){
                if(this.checked){
                    toggableDiv.style.display = 'flex';
                }else{
                    toggableDiv.style.display = 'none';
                }
            });
        })
    },

    /**
     * Put the values of the listing to the DOM elements of this field.
     * @param {Object} hardwareAddonsObj hardware addons object 
     *                                  in the listingdetails object
     */
    fillInnerFields(hardwareAddonsObj){
        let hwRegions = hardwareAddonsObj.regions;
        let URLs = hardwareAddonsObj.URLs;

        // Expand the divs of the regions that are included
        hwRegions.forEach((region) => {
            document.getElementById(divIdPrefix + region)
                    .style.display = 'block';
            document.getElementById(cbIdPrefix + region)
                    .checked = true;
        });

        // Fill the textboxes of each (checked) region with the URLs
        Object.entries(URLs).forEach((entry) => {
            let region = entry[0];
            let urls = entry[1];

            document.getElementById(divIdPrefix + region)
                    .querySelectorAll('.purchase-url')[0]
                    .value = urls.purchase; 

            document.getElementById(divIdPrefix + region)
                    .querySelectorAll('.firmware-url')[0]
                    .value = urls.firmware; 
        })
    },

    buildField(){
        let hardwareAddons = {
            regions: [],
            URLs: {}
        };

        regions.forEach(region => {
            const cb = document.getElementById(cbIdPrefix + region);
            const field = document.getElementById(divIdPrefix + region);
            if(cb.checked){
                // Get url fields from the input boxes
                let urlObj = {
                    purchase: field.querySelectorAll('.purchase-url')[0].value,
                    firmware: field.querySelectorAll('.firmware-url')[0].value
                }

                hardwareAddons.regions.push(region);
                hardwareAddons.URLs[region] = urlObj;
            } 
        });

        return hardwareAddons;
    }
}