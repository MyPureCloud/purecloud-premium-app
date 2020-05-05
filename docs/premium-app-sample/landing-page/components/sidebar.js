import config from '../../config/global-config.js';

let t = document.createElement('template');

////////////////////////////////
// Disable Listing Management //
////////////////////////////////

// t.innerHTML =
// `
//     <div class="row">
//       <div class="bar-block col-md-3">
//         <ul class="sidebar-list">
//           <li><a href="${config.root}/index.html"><img src="${config.landingAssetURL}/home.png" width="30px" height="30px">Home</a></li>
//           <li><a href="${config.root}/premium-app-sample/org-provisioning/index.html"><img src="${config.landingAssetURL}/process.png" width="30px" height="30px">Dev Org Provisioning</a></li>
//           <li><a href="${config.root}/premium-app-sample/listing-management/partner-side/index.html"><img src="${config.landingAssetURL}/rocket.png" width="30px" height="30px">Listing Management</a></li>
//         </ul>    
//       </div>
//       <div id="tool-contents" class="col-md-9">
//       </div>
//     </div>
// `;

t.innerHTML =
`
    <div class="row">
      <div class="bar-block col-md-3">
        <ul class="sidebar-list">
          <li><a href="${config.root}/index.html"><img src="${config.landingAssetURL}/home.png" width="30px" height="30px">Home</a></li>
          <li><a href="${config.root}/premium-app-sample/org-provisioning/index.html"><img src="${config.landingAssetURL}/process.png" width="30px" height="30px">Dev Org Provisioning</a></li>
        </ul>    
      </div>
      <div id="tool-contents" class="col-md-9">
      </div>
    </div>
`;

export default {
    new(){
        // Crete element
        const element = document.importNode(t.content, true);

        return element;
    }
};