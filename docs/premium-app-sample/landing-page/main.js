import header from './components/welcome-header.js';
import mainmenu from './components/main-menu.js';

$(document).ready(() => {  
    // Display elements
    const newHeaderEl = header.new();
    const newMainMenuEl = mainmenu.new();

    document.body.appendChild(newHeaderEl);
    document.body.appendChild(newMainMenuEl);
})



