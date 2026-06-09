import * as loader from './loader.js';
import * as data from './data.js';

let textContainer, backBtnContainer;

/* Sets up html elements needed for display of help */
function init() {

    // create html elements to hold help text
    const helpText = document.createElement("p");
    helpText.id = "helpText";
    helpText.classList.add("formbold-form-label");

    textContainer = document.createElement("div");
    textContainer.style.padding = "0 10px 0 15px";
    textContainer.appendChild(helpText);
    
    // create html button to go back to mode content
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.classList.add("background-white");
    backBtn.innerHTML = "&#x2B60; Back to mode menu";
    backBtn.addEventListener('click', close);

    backBtnContainer = document.createElement("div");
    backBtnContainer.classList.add("modebutton", "btn-wide");
    backBtnContainer.appendChild(backBtn);

}

/* Opens help for the given mode */
function open(mode) {

    // append help text to html-document
    document.getElementById("modeContent").appendChild(textContainer);
    
    // hide content of mode
    document.getElementById("uppercontainer").style.display = "none";
    document.getElementById("lowercontainer").style.display = "none";
    document.getElementById("doneresetbuttons").style.display = "none";

    // append back button to html-document
    document.getElementById("annobuttongroup").appendChild(backBtnContainer);

    // open help file
    let file = null;
    switch (mode) {
        case "main":
            file = 'menuMain.txt';
            break;
        case "importExport":
            file = 'importExport.txt';
            break;
        case "create":
            if(data.getPickedObject().geometry.type == "LineGeometry"){
                file = 'createAnnoPolygon.txt';
            } else {
                file = 'createAnnoBox.txt';
            }
            break;
        case "editContent":
            file = 'editAnnoContent.txt';
            break;
        case "editForm":
            if(data.getPickedObject().geometry.type == "LineGeometry"){
                file = 'editAnnoFormPolygon.txt';
            } else {
                file = 'editAnnoFormBox.txt';
            }
            break;
    }

    if(file !== null){
        loader.loadFile('./resources/help/'+file, 'text', "helpText");
    }

}

/* Closes help */
function close() {
    document.getElementById("modeContent").removeChild(textContainer);
    document.getElementById("annobuttongroup").removeChild(backBtnContainer);

    document.getElementById("uppercontainer").style.display = "";
    document.getElementById("lowercontainer").style.display = "";
    document.getElementById("doneresetbuttons").style.display = "inline";
}

export {init, open}