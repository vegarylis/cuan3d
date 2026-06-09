import * as infoTransliteration from './infoTransliteration.js';
import * as infoTurning from './infoTurning.js';
import * as infoAbout from './infoAbout.js';
import * as infoHelp from './infoHelp.js';

let aboutMode = false;

function init() {

    // load initial file for transliteration
    infoTransliteration.setup(); 
    
    // initialize turning model
    infoTurning.setup();

    // open transliteration section
    openTransliteration();

    // prepare help
    infoHelp.setup();
    document.getElementById("infoHelpBtn").addEventListener('click', infoHelp.open);

    // prepare about 
    infoAbout.setup();
    document.getElementById("aboutBtn").addEventListener('click', changeBetweenTransliterationAndAbout);
}

/* Opens 'about' section if transliteration is currently open and transliteration if 'about' section is currently open */
function changeBetweenTransliterationAndAbout() {
    if(aboutMode){
        document.getElementById("infotextcontainer").style.visibility = "visible";
        openTransliteration();
    }
    else {
        document.getElementById("infotextcontainer").style.visibility = "hidden";
        openAbout();
    }
}

function openTransliteration() {
    document.getElementById("aboutcontainer").style.display = "none";
    document.getElementById("infoTransliteration").style.display = "block";
    document.getElementById("infoHelpBtn").style.display = "";
    document.getElementById("aboutBtn").innerHTML = "About";
    aboutMode = false;
}

function openAbout() {
    document.getElementById("infoTransliteration").style.display = "none";
    document.getElementById("aboutcontainer").style.display = "block";
    document.getElementById("infoHelpBtn").style.display = "none";
    document.getElementById("aboutBtn").innerHTML = "&#x2B60; Back to transliteration";
    aboutMode = true;
}

export {init}