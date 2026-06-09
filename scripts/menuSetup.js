import * as menuAnnoDisplay from './menuAnnoDisplay.js';
import * as data from './data.js';

/* Setups functionality of the form for the user to enter their credentials and adds default tags to html document */
function initial() {

    // create html element to display state of loading
    const state = document.createElement("p");
    state.id = "state";
    state.classList.add("formbold-form-label");
    state.classList.add("padding-left");

    // Setup functionality of the form for the user to enter their credentials
    document.getElementById("doneCredentials").addEventListener('click', handleCredentials);
    document.getElementById("doneCredentials").classList.add("btn-unclickable");
    document.getElementById("userCredentials").appendChild(state);

    // add default tags as elements to hmtl document
    prepareDefaultTags();

}

/* Stores entered credentials and sets up the default mode of the leftsided menu */
function handleCredentials(event) {

    // remove error message if displayed
    const errorMessage = document.getElementById("nameNotEntered")
    if (errorMessage){
        errorMessage.remove();
    }

    const typeOfUser = document.getElementById("typeOfUser");
    const username = document.getElementById("username");
    const nickname = document.getElementById("nickname");
    const orcid = document.getElementById("orcidid");

    // check if username was entered 
    if(username.value) {

        // write credentials added to form into credentials object in data
        data.setCredentials(
            typeOfUser.value,
            username.value,
            nickname.value,
            orcid.value
        );

        // reset form values
        typeOfUser.value = "person";
        username.value = "";
        nickname.value = "";
        orcid.value = "";

        // deactivate done-button
        document.getElementById("doneCredentials").removeEventListener('click', handleCredentials);

        // hide user credentials form and show default display of the menu
        document.getElementById("userCredentials").style.display = "none";
        menuAnnoDisplay.activate();
        document.getElementById("annobuttongroup").style.display = "inline"; 
        
    }
    else {
        const nameRequired = document.createElement("p");
        nameRequired.id = "nameNotEntered";
        nameRequired.classList.add("formbold-form-label");
        nameRequired.classList.add("additional-margin");
        nameRequired.classList.add("red-text");
        nameRequired.innerHTML = "Please enter at least a name to continue."
        document.getElementById("credentialsInputContainer").insertBefore(nameRequired, document.getElementById("nicknameLabel"));

    }
}

/* Adds a checkbox list of default tags (given by variable 'mlVocabulary') to the 'Edit annotation content' menu */
function prepareDefaultTags() {
    let col = 1, i = 0;
    const defaultTags = data.getDefaultTagList();
    for (let elem of defaultTags) {
        
        // calculate column to add the tag to
        if(i >= defaultTags.length/2) {
            col = 2;
        }
        i++;

        // create and add input element to index.html
        const inputElem = document.createElement("input");
        inputElem.type = "checkbox";
        inputElem.id = "tag"+elem.label;
        inputElem.name = "tag"+elem.label;
        inputElem.value = elem.label;
        document.getElementById("defaultTagsCol"+col).appendChild(inputElem);

        // create and add corresponding label element to index.html
        const labelElem = document.createElement("label");
        labelElem.classList.add("formbold-form-label");
        labelElem.style = "display: inline;";
        labelElem.for = "tag"+elem.label;
        labelElem.innerHTML = elem.label;
        document.getElementById("defaultTagsCol"+col).appendChild(labelElem);

        // create and add <br> element at the end of label element
        const breakElem = document.createElement("br");
        document.getElementById("defaultTagsCol"+col).appendChild(breakElem);
        
    }
}


export {initial}