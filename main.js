import * as screenSetup from './scripts/screenSetup.js';
import * as menuMain from './scripts/menuMain.js';
import * as infoMain from './scripts/infoMain.js';

/* Starts application */
function init(){
    menuMain.init();
    screenSetup.init();
    infoMain.init();
}

(function () {
  init();
})();