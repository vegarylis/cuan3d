import * as menuAnnoDisplay from './menuAnnoDisplay.js';

const modeButton = document.getElementById("modebutton");
const modeBtnGroup =  document.getElementById("modebuttons");
const doneResetBtn = document.getElementById("doneresetbuttons");

let positionBoxContainer;

/* Setups display of specific mode on the lefthand menu */
function setup(button, part=1) {

    // activate mode button at the top
    modeButton.innerHTML = document.getElementById(button).innerHTML + " &#x1f6c8;";
    modeButton.style.display = "block";

    // configure buttons at the bottom
    modeBtnGroup.style.display = "none"; // hide modebutton group (at the bottom of annotation menu)
    doneResetBtn.style.display = "inline"; // activate done and reset buttons    

    // hide anno content display
    menuAnnoDisplay.hide();

    // activate display of the chosen mode
    switch (button) {
        case "importExportBtn":
            setupImportExportMenu(); // Import/Export mode
            break;
        case "createAnnoBoxBtn":
            if(part == 1){
                setupCreateBoxMode();
            } else if(part == 2) {
                setupCreateMode(true);
            }
            break;
        case "createAnnoPolygonBtn":
            setupCreatePolygonMode(); // Create new annotation mode
            break;
        case "editAnnoContentBtn":
            setupEditAnnoContentMenu(); // Edit annotation content mode
            break;
        case "editAnnoFormBtn":
            setupEditAnnoFormMenu(); // Edit annotation form mode
            break;
        default:
            console.log("Something went wrong!");
    }
}

/* Sets menu display back to its original state in which the annotation content is shown on the top of the menu and the buttons to choose a specific mode at the bottom */
function reset(button) {

    // deactivate mode button at the top
    modeButton.style.display = "none";

    // configure buttons at the bottom
    doneResetBtn.style.display = "none"; // hide done and reset buttons
    modeBtnGroup.style.display = "inline"; // activate modebutton group    

    // reset display of the chosen mode
    switch (button) {
        case "importExportBtn":
            resetImportExportMenu();
            break;
        case "createAnnoBtn":
            resetCreateMode();
            break;
        case "editAnnoContentBtn":
            resetEditAnnoContentMenu();
            break;
        case "editAnnoFormBtn":
            resetEditAnnoFormMenu();
            break;
        default:
            console.log("Something went wrong!");
    }   

    // activate anno content display
    menuAnnoDisplay.activate();


}

/* Setups display of 'Import/Export' menu */
function setupImportExportMenu() {
    document.getElementById("importExportMenu").style.display = "block";
}

/* Resets display of 'Import/Export' menu */
function resetImportExportMenu() {
    document.getElementById("importExportMenu").style.display = "none";
}

/* Setups display of 'Create new annotation (box)' menu */
function setupCreateMode(cleanup=false) {

    if(cleanup){
        document.getElementById("uppercontainer").removeChild(positionBoxContainer);
    }

    document.getElementById("formbold-form-wrapper").style.display = "block";
}

/* Setups display of 'Create new annotation (polygon)' menu */
function setupCreateBoxMode() {

    const positionBoxText = document.createElement("p");
    positionBoxText.classList.add("label");
    positionBoxText.style.margin = "0px 15px 0px 20px";
    positionBoxText.innerHTML = "Click on a point on the screen to position the annotation box.";
    
    positionBoxContainer = document.createElement("div");
    positionBoxText.classList.add("formbold-form-wrapper");
    positionBoxContainer.appendChild(positionBoxText);

    document.getElementById("uppercontainer").appendChild(positionBoxContainer);

}

/* Sets width of mode button to 86% (necessary in polygon mode to display button content in one row) */
function setupCreatePolygonMode(){
    modeButton.style.width = "86%";
    setupCreateMode();
}

/* Resets display of 'Create new annotation' menu */
function resetCreateMode() {
    document.getElementById("formbold-form-wrapper").style.display = "none"; 
    modeButton.style.width = "";
}

/* Setups display of 'Edit annotation content' menu */
function setupEditAnnoContentMenu() {
    document.getElementById("formbold-form-wrapper").style.display = "block";
}

/* Resets display of 'Edit annotation content' menu */
function resetEditAnnoContentMenu() {
    document.getElementById("formbold-form-wrapper").style.display = "none";  
}

/* Setups display of 'Edit annotation form' menu */
function setupEditAnnoFormMenu() {
    document.getElementById("uppercontainer").style.display = "none"; // hide upperContainer
}

/* Resets display of 'Edit annotation form' menu */
function resetEditAnnoFormMenu() {
    document.getElementById("uppercontainer").style.display = "inline"; // activate upper container
}

export {setup, reset}