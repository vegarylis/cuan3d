import * as data from './data.js';

let pickedObject;

const tagToAddElem = document.getElementById("tagToAdd"); // html-element to add a new tag to the taglist
let checkboxes;

let tagList; // contains all tags of the html taglist
let defaultTagList; // contains all checked default tags
let objectsTagList; // contains all objects of pickedObject.annoInfo.body which purpose is 'tagging'
let numberOfTags = 0;

// for 'reset' functionality
let defaultTagListSaved;
let tagListSaved;
let selectValuesSaved;

// for 'delete' functionality
let deleteList;
let placeholderListSaved;
let tagDeleteBtn; // 'tag-delete' html element
let deletedTagsListSaved;

function init(){
    createTagDeleteElement();
}

/* Opens form for the user to change the content of a selected annotation */
function open() {

    pickedObject = data.getPickedObject();
    numberOfTags = 0;

    // check if any box (annotation object) is selected
    if (pickedObject !== null) {

        // prepare setting up 'Edit annotation content' form by collecting the information for the selected annotation box inside an object
        const formFields = {};
        formFields["tagging"] = [];
        tagList = [];
        defaultTagList = [];
        objectsTagList = [];
        for(let elem of pickedObject.annoInfo.body) {
            // check if purpose is "tagging" (as there can be more than one tag, they have to be collected in an array)
            if(elem.purpose == "tagging") {
                formFields["tagging"].push(elem);
                objectsTagList.push(elem);
                numberOfTags += 1;
            }
            else {
                formFields[elem.purpose] = elem.value; // all entries that are not tags             
            }

        }
        // set up fields in 'Edit annotation content' form
        selectValuesSaved = [];
        const form = document.getElementById("annoContentManipulation");
        Array.from(form.elements).forEach((input) => {
            // set values of selected annotation box as placeholders for 'input' fields
            if(input.tagName == "INPUT") {
                if(input.type !== "checkbox"){
                    input.value = "";
                }
                if(input.id != "tagToAdd" && formFields[input.id]) {
                    input.placeholder = formFields[input.id];                     
                }
            }
            // set value of textareas (here comment) to the value of the comment of the picked object only if it isn't undefined (otherwise the placeholder will be displayed)
            else if (input.tagName == "TEXTAREA"){
                if(formFields[input.id]){
                   input.value = formFields[input.id]; 
                }
            }
            // set values of the selected annotation box as normal values for 'select' fields
            else if (input.tagName == "SELECT"){
                input.value = formFields[input.id];
                selectValuesSaved.push({id:input.id, value:formFields[input.id]}); 
            }
        }); 
        // add all tags for the given annotation to the taglist
        for (let elem of formFields["tagging"]){
            if (elem.type == "SpecificResource") {
                document.getElementById("tag"+elem.source.label).checked = true;
                defaultTagList.push(elem.source.label);
            }
            else {
                addTag(elem.value);
                tagList.push(elem.value); 
            }  
        } 

        defaultTagListSaved = [...defaultTagList];
        tagListSaved = [...tagList];

        // set up tagging functionality (if tag is entered and 'Enter' is pressed add tag to taglist)
        tagToAddElem.addEventListener('keydown', handleTagEnter);
        checkboxes = document.querySelectorAll("input[type=checkbox]");
        
        checkboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', handleTagCheck);
        });

        deleteList = [];
        placeholderListSaved = [];
        setupDeleteButtons();

        // add EventListener to 'tag-delete' button(s)
        tagDeleteBtn.addEventListener('click', deleteTag);
        deletedTagsListSaved = [];

    }
    else {
        console.log("No object picked! Please click on a box to edit its content.");
    }  

}

/* Transfers entered values to pickedObject.annoInfo.body */
function done() {

    if(data.isPolygonMode()){
        pickedObject = data.getPickedObject();
    }

    const formFields = {};
    const form = document.getElementById("annoContentManipulation");    

    if(pickedObject){

        // set annotation values of picked Object to the manipulated values from the form or their orignal values if values were not manipulated
        Array.from(form.elements).forEach((input) => {
            if (input.id !== "tagToAdd" && input.id !== "" && input.value !== "" && input.type!=="checkbox" && input.type!=="button"){ 
                formFields[input.id] = input.value;        
            }
        }); // save values from form in temporary dictionary
        for(let elem of pickedObject.annoInfo.body) {

            // update existing fields in pickedObject.annoInfo.body
            if (elem.purpose !== "tagging" && formFields[elem.purpose]) {
                elem.value = formFields[elem.purpose];
                if(elem.purpose !== "commenting"){
                    elem.source = data.getFieldsSourceURL(elem.purpose);
                }
                elem.creator = data.getCredentials();
            }
            
            // delete deleted values from pickedObject.annoInfo.body
            if(deleteList.includes(elem.purpose) && formFields[elem.purpose]===undefined){
                pickedObject.annoInfo.body.splice(pickedObject.annoInfo.body.indexOf(elem),1);
            }

            delete formFields[elem.purpose];  
        } 
        for(const [key,value] of Object.entries(formFields)) {
            if(key == "commenting"){
            pickedObject.annoInfo.body.push({type: "TextualBody", purpose: key, value: value, rights: "https://creativecommons.org/licenses/by-sa/4.0/", creator: data.getCredentials()});
            }
            else {
                pickedObject.annoInfo.body.push({type: "TextualBody", purpose: key, value: value, source: data.getFieldsSourceURL(key), rights: "https://creativecommons.org/licenses/by-sa/4.0/", creator: data.getCredentials()});
            }
            
        } // add newly added fields to pickedObject.annoInfo.body

        // update tags
        updateTagsInPickedObject();  
        
    }

    // delete content of form
    Array.from(form.elements).forEach((input) => {
        if(input.type !== "checkbox"){
            input.value = "";
            if(input.id !== "tagToAdd" && input.id !== "commenting" && input.id !== "") {
            document.getElementById(input.id).removeAttribute("placeholder");
            }
        }
        else {
            input.checked = false;
        }
        
    });       

    // remove event listeners
    tagToAddElem.removeEventListener('keydown', handleTagEnter);
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', handleTagCheck);
    });
    resetDeleteButtons();
    tagDeleteBtn.removeEventListener('click', deleteTag);

}

/* Resets values in form back to their original values */
function reset() {

    // reset default tags
    for(let checkbox of checkboxes){
        if(defaultTagListSaved.indexOf(checkbox.value) !== -1){
            checkbox.checked = true;
        }  
        else {
            checkbox.checked = false;
        }
    }

    // reset non-default tags
    const taglist = [...document.getElementById("taglistEdit").children];
    let i = taglist.childElementCount;
    for(let child of taglist){
        if(tagListSaved.indexOf(child.firstChild.innerHTML) == -1){
            document.getElementById("taglistEdit").removeChild(child);
            tagList.splice(tagList.indexOf(child.firstChild.innerHTML),1);
        }
    } // remove newly added tags
    for (let tag of deletedTagsListSaved){
        addTag(tag);
    } 
    deletedTagsListSaved = []; // readd deleted tags

    
    // reset delete
    deleteList = [];
    for (let elem of placeholderListSaved){
        document.getElementById(elem.id).placeholder = elem.placeholder;
    }
    placeholderListSaved = [];

    // reset everything else
    const form = document.getElementById("annoContentManipulation");
    Array.from(form.elements).forEach((input) => {
        if(input.type == "select-one"){
            // reset 'select' input fields 
            input.value = selectValuesSaved.filter(obj => { return obj.id == input.id})[0].value;
        }
        else if(input.type !== "checkbox"){
            // reset all other input fields
            input.value = "";
        }
    });

}

/* Function for event listener if tag is entered and 'Enter' is pressed */
function handleTagEnter(event) {
    if (event.key === "Enter") {
        if(tagList.indexOf(tagToAddElem.value) == -1){
            addTag(tagToAddElem.value);
            tagList.push(tagToAddElem.value);
        }
        tagToAddElem.value = ""; 
    }
}

/* Function for event listener if default tag gets checked or unchecked */
function handleTagCheck(event) {
    defaultTagList = []
    defaultTagList = 
        Array.from(checkboxes) // Convert checkboxes to an array to use filter and map.
        .filter(i => i.checked) // Use Array.filter to remove unchecked checkboxes.
        .map(i => i.value) // Use Array.map to extract only the checkbox values from the array of objects
}

/* Adds a tag to the taglist */
function addTag(tag) {

    let list = document.createElement("li");
    let span = document.createElement("span");
    span.classList.add("taglabel");
    span.innerHTML = tag;
    list.appendChild(span);

    span.addEventListener('click', showTagDelete);

    document.getElementById("taglistEdit").appendChild(list); 
}

/* Writes the tags entered in 'Edit annotation content' mode into pickedObject.annoInfo.body */
function updateTagsInPickedObject() {

    // remove deleted tags from pickedObject.annoInfo.body
    for (let obj of objectsTagList) {
        let found = false;
        if(obj.type == "TextualBody"){
           for (let i=0; i<tagList.length; i++) {
                if(tagList[i] === obj.value) {
                    // tag already is in pickedObject.annoInfo.body and can be removed from tagList to not be added to pickedObject.annoInfo.body later on
                    tagList.splice(i,1);
                    found = true;
                    break;
                }
            } 
        }
        else if (obj.type == "SpecificResource"){
            for (let i=0; i<defaultTagList.length; i++) {
                if(defaultTagList[i] === obj.source.label) {
                    // tag already is in pickedObject.annoInfo.body and can be removed from tagList to not be added to pickedObject.annoInfo.body later on
                    defaultTagList.splice(i,1);
                    found = true;
                    break;
                }
            }            
        }

        // delete tag from pickedObject.annoInfo.body if it was not found in tagList or defaultTagList
        if (!found) {
            pickedObject.annoInfo.body.splice(pickedObject.annoInfo.body.indexOf(obj), 1);
        }
    }

    // add new tags (all elements that are still in tagList or defaultTagList) to pickedObject.annoInfo.body 
    for (let tag of tagList){
        pickedObject.annoInfo.body.push({type:"TextualBody", purpose:"tagging", value:tag, rights: "https://creativecommons.org/licenses/by-sa/4.0/", creator:data.getCredentials()});
    }
    for (let tag of defaultTagList){
        pickedObject.annoInfo.body.push({
            type:"SpecificResource", 
            purpose:"tagging", 
            source:{
                id:data.getDefaultTagList().filter(i => i.label == tag).map(i => i.uri)[0], 
                label:tag
            },
            rights: "https://creativecommons.org/licenses/by-sa/4.0/",
            creator:data.getCredentials()
        });
    }
    
    // delete tags (including their EventListeners) collected in html-element with id 'taglistEdit'
    const taglist = document.getElementById("taglistEdit");
    while (taglist.firstChild) {
        taglist.firstChild.firstChild.removeEventListener('click', showTagDelete);
        taglist.removeChild(taglist.lastChild);
    }

}

/* Adds Eventlisteners to 'delete' buttons */
function setupDeleteButtons() {
    for(const [key,value] of Object.entries(data.getAttributes())) {
        document.getElementById("delete"+key).addEventListener('click', deleteContentField); 
    }  
}

/* Removes Eventlisteners from 'delete' buttons */
function resetDeleteButtons(){
    for(const [key,value] of Object.entries(data.getAttributes())) {
        document.getElementById("delete"+key).removeEventListener('click', deleteContentField); 
    }
}

/* Deletes values from from given form field */
function deleteContentField(event) {

    const deletedObject = document.getElementById(event.target.id.slice(6));

    // remove values from form fields
    deletedObject.value = "";

    // remove placeholders from form fields
    placeholderListSaved.push({id: deletedObject.id, placeholder: deletedObject.placeholder});
    deletedObject.placeholder = "";

    deleteList.push(deletedObject.id);

}

/* Creates html element which can be added to the non-default tags to be able to delete them */
function createTagDeleteElement(){

    let outerSpan = document.createElement("span");
    outerSpan.classList.add("deleteWrapper");

    let innerSpan = document.createElement("span");
    innerSpan.classList.add("notClickable");
    outerSpan.appendChild(innerSpan);

    let svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.classList.add("transformDown-2");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 448 512");
    svg.setAttribute("width", "12");
    innerSpan.appendChild(svg);

    let path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.style = "fill:white; stroke: white; stroke-width:3";
    path.setAttribute("d", "M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z");
    svg.appendChild(path);
    
    tagDeleteBtn = outerSpan;
}

/* Show delete button next to the clicked non-default tag */
function showTagDelete(event){
    event.target.parentElement.appendChild(tagDeleteBtn);
}

/* Deletes a non-default tag */
function deleteTag(event){

    event.target.parentElement.remove(); // remove tag from DOM

    const tagLabel = event.target.parentElement.firstChild.innerHTML;
    tagList.splice(tagList.indexOf(tagLabel),1); // remove tag from tagList

    deletedTagsListSaved.push(tagLabel);
}

export {init, open, done, reset};