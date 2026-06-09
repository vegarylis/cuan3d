
let overlayContainer, overlayBtnContainer, overlayText;

function init() {

    // Prepare overlay to set polygonMode
    overlayContainer = document.createElement("div");
    overlayContainer.id = "overlayContainer";
    overlayContainer.classList.add("overlay");
    overlayContainer.style.width = "500px";

    overlayText = document.createElement("p");
    overlayText.classList.add("label");
    overlayContainer.appendChild(overlayText);

    overlayBtnContainer = document.createElement("div");
    overlayBtnContainer.id = "overlayBtnContainer";
    overlayBtnContainer.classList.add("btn-group");
    overlayBtnContainer.style.margin = "0px 20px 15px 20px";
    overlayBtnContainer.style.padding = "0px";
    overlayContainer.appendChild(overlayBtnContainer);

}

/* Sets up text for overlay when polygon is not closed and creates according buttons */
function openOverlay(text, buttons) {
    overlayText.innerHTML = text;

    const createdBtns = [];
    for(let elem of buttons){

        const btn = document.createElement("button");
        btn.innerHTML = elem;
        btn.addEventListener('click', resetOverlay);

        addButtonToDiv(btn);
        createdBtns.push(btn);
    }

    document.body.appendChild(overlayContainer);

    return createdBtns;
}

/* Adds given buttons to the overlay div element */
function addButtonToDiv(button){

    button.classList.add("background-white");
    button.type = "button";
    button.style.width = "220px";
    button.style.margin = "0px 5px 0px 5px";
    overlayBtnContainer.appendChild(button); 
}

/* Removes all buttons from the overlay and removes the overlay from screen */
function resetOverlay() {

    // remove all buttons from the overlay
    while(overlayBtnContainer.firstChild){
        const lastChild = overlayBtnContainer.lastChild;
        lastChild.removeEventListener('click', resetOverlay);
        overlayBtnContainer.removeChild(lastChild);
    }

    // remove overlay from screen
    document.body.removeChild(overlayContainer);
}


export {init, openOverlay}