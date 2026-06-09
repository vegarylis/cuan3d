import * as data from './data.js';

const annoDisplayContainer = document.getElementById("annoDisplayMenu");
const annoContent = document.getElementById("annoContent");
const editContentBtn = document.getElementById("editAnnoContentBtn");
const editFormBtn = document.getElementById("editAnnoFormBtn");

let pickedObject;

/* Shows the annotation of the currently picked box on the annotation-canvas (left side canvas) */
function update() {

    pickedObject = data.getPickedObject();

    if(pickedObject) {
        
        // activate 'Edit annotation content' and 'Edit annotation form' buttons
        editContentBtn.classList.remove("btn-unclickable");
        editFormBtn.classList.remove("btn-unclickable");

        // delete tags collected in html-element with id 'taglistDisplay'
        const taglist = document.getElementById("taglistDisplay");
        while (taglist.firstChild) {
            taglist.removeChild(taglist.lastChild);
        }
        // get the information to be displayed out of the object and into a string
        const content = pickedObject.annoInfo.body;
        let text = "";
        let transliteration, lineIndex, CharIndex;
        for (let line of content) {
            if(line.purpose !== "tagging") {
                // add all information that is not a tag to the text displayed
                if(line.value !== "undefined" && line.value !== undefined) {
                    text += line.purpose + ": " + line.value + "<br>";
                }
            }
            else {
                // add all tags to the taglist
                if(line.type == "SpecificResource") {
                    // if tag is one of the default tags
                    addTag(line.source.label);
                }
                else {
                    // if tag is not one of the default tags
                    addTag(line.value);
                } 
            }
            // get important information for titel of annotation display separately 
            switch(line.purpose) {
                case "Transliteration":
                    transliteration = line.value;
                    break;
                case "Line":
                    lineIndex = line.value;
                    break;
                case "Charindex":
                    CharIndex = line.value;
                    break;
            }
        }
        const transliterationText = (transliteration) ? transliteration : "?";
        const lineText = (lineIndex) ? lineIndex : "?";
        const charIndexText = (CharIndex) ? CharIndex : "?";
        text = "<b>" + transliterationText + " [Line " + lineText + " CharIndex " + charIndexText + "]</b><br>" + text;
        
        // put string on annotation-canvas
        annoContent.innerHTML = text;    
    }
    else {
        annoContent.innerHTML = "Click on an annotation!";

        // disable 'Edit annotation content' and 'Edit annotation form' buttons
        editContentBtn.classList.add("btn-unclickable");
        editFormBtn.classList.add("btn-unclickable");

    }
    
    
}

function hide() {
    annoDisplayContainer.style.display = "none";
}

function activate() {
    // annoContent.style.display = "";
    update();
    annoDisplayContainer.style.display = "block";
}

/* Adds a tag to the taglist */
function addTag(tag) {
    let list = document.createElement("li");
    let span = document.createElement("span");
    span.classList.add("taglabel");
    span.innerHTML = tag;
    list.appendChild(span);
    document.getElementById("taglistDisplay").appendChild(list);    
}

export {update, hide, activate}