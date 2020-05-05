import config from '../../../config/config.js';

let t = document.createElement('template');

t.innerHTML = 
`
<div class="container">
  <div class="row">
    <div class="col-11 logo-container">
      <a href="${config.redirectUriBase}" class="logo-link">
        <img src="${config.globalAssetsURL}img/logo.png" alt="Logo" id="logo">
      </a>
    </div>
    <div class="col-1 refresh-container">
      <a href="${window.location.href}">
        <i class="fas fa-sync-alt"></i>
      </a>
    </div>
  </div>
</div>
`;

export default {
    new(){
      let el = document.importNode(t.content, true);
      return el;
    }
};