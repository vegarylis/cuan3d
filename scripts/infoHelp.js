import * as loader from './loader.js';

let backBtn;

/* Sets up html elements needed for display of help and loads help text */
function setup() {

    // create html element to hold help text
    const helpText = document.createElement("p");
    helpText.id = "infoHelpText";
    helpText.classList.add("label");
    helpText.style.fontSize = "15px";
    document.getElementById("infoHelpContainer").appendChild(helpText);
    
    // create html button to go back to mode content
    backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.classList.add("background-white", "button");
    backBtn.innerHTML = "&#x2B60; Back";
    backBtn.addEventListener('click', close);

    // load help text into html document
    loader.loadFile('./resources/help/infoMain.txt', 'text', "infoHelpText");

}

/* Opens help for information menu */
function open(mode) {

    // hide content of transliteration
    document.getElementById("infoTransliteration").style.display = "none";

    // display help text 
    document.getElementById("infoHelpContainer").style.display = "block";
    
    // replace 'help' and 'about' button with 'back' button
    for(let child of document.getElementById("aboutBtnDiv").children){
        child.style.display = "none";
    }
    document.getElementById("aboutBtnDiv").appendChild(backBtn);

}

/* Closes help */
function close() {

    // hide help 
    document.getElementById("infoHelpContainer").style.display = "";

    // display transliteration
    document.getElementById("infoTransliteration").style.display = "";
    
    // replace 'back' button with 'help' and 'about' button
    document.getElementById("aboutBtnDiv").removeChild(backBtn);
    for(let child of document.getElementById("aboutBtnDiv").children){
        child.style.display = "";
    }

}

export {setup, open}