import * as loader from './loader.js';
import * as data from './data.js';
import * as menuOverlay from './menuOverlay.js';

let state; // html element to display state of loading
let saveMdl, saveAnnos, saveTransliteration;

let lineObjects;
let overlayBtns;

function open() {

    // save current model, annotations and transliteration if resetting is needed
    if(data.getCurrentModel()){
        saveMdl = data.getCurrentModel();
    }
    if(data.getCubeList()){
        saveAnnos = [...data.getCubeList()];
    }
    saveTransliteration = data.getTransliteration();

    // get html element to display state of loading
    state = document.getElementById("state");

    // add functionality to the import and export buttons
    document.getElementById("importMdlBtn").addEventListener('change', loadNewModel);
    document.getElementById("importMdlUrlBtnLabel").addEventListener('click', openUrlInputMdl);

    document.getElementById("importAnnoBtn").addEventListener('change', loadNewAnnotations);
    document.getElementById("importAnnoWithMdlBtn").addEventListener('change', loadNewAnnotationsWithModel);
    document.getElementById("importAnnoUrlBtnLabel").addEventListener('click', openUrlInputAnno);
    document.getElementById("importAnnoWithMdlUrlBtnLabel").addEventListener('click', openUrlInputAnnoWithMdl);

    document.getElementById("exportAnnoBtn").addEventListener('click', exportAnnotations);
    document.getElementById("importTranslitBtn").addEventListener('change', loadNewTransliteration);
    
}

function done() {

    // remove functionality from the import and export buttons
    document.getElementById("importMdlBtn").removeEventListener('click', loadNewModel);
    document.getElementById("importMdlUrlBtnLabel").removeEventListener('click', openUrlInputMdl);

    document.getElementById("importAnnoBtn").removeEventListener('click', loadNewAnnotations);
    document.getElementById("importAnnoWithMdlBtn").removeEventListener('change', loadNewAnnotationsWithModel);
    document.getElementById("importAnnoUrlBtnLabel").removeEventListener('click', openUrlInputAnno);
    document.getElementById("importAnnoWithMdlUrlBtnLabel").removeEventListener('click', openUrlInputAnnoWithMdl);

    document.getElementById("exportAnnoBtn").removeEventListener('click', exportAnnotations);
    document.getElementById("importTranslitBtn").removeEventListener('change', loadNewTransliteration);

    // remove fileselector panels
    const fileSelectorPanel = document.getElementById("fileSelectorPanels");
    let index = 0;
    for (let i=0; i<fileSelectorPanel.childElementCount; i++){
        if(fileSelectorPanel.children[index].id !== "state"){
            fileSelectorPanel.removeChild(fileSelectorPanel.children[index]);
        } else {
            index++;
        }
    }
    state.innerHTML = "";

    // reset pickedObject
    data.setPickedObject(null);
}

function reset() {

    loader.loadFromGeometry(saveMdl, saveAnnos); // reset model and annotations
    data.setTransliteration(saveTransliteration); // reset transliterations

    // update state
    const state = document.getElementById("state");
    if (state) {
        state.innerHTML = "Model, annotations and transliterations were reset.";
    }

}

/* Loads a new model (stone) from a ply-file given by the user. */
function loadNewModel(event) {

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const file = event.target.files[0]; // get file from input
    loader.loadFile(file, "model"); // read file and display new model
}

/* Loads new annotations from a json-file given by the user. */
function loadNewAnnotations(event) {

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const file = event.target.files[0]; // get file from input
    loader.loadFile(file, "annotations"); // read file and display new annotations
}

/* Loads new annotations from a json-file given by the user and the model given by the 'source' value in 'target' in json-file */
function loadNewAnnotationsWithModel(event) {

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const file = event.target.files[0]; // get file from input
    loader.loadFile(file, "annotationsAndModel"); // read file and display new annotations
}

/* Loads new transliteration from a json-file given by the user. */
function loadNewTransliteration(event) {

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const file = event.target.files[0]; // get file from input
    loader.loadFile(file, "transliteration"); // read file and display new annotations
}

/* Exports annotations in json-file to the client */
function exportAnnotations() {

    // create overlay to ask the user if polygons shall be exported as multilinestrings or as multilinestrings and polygons
    lineObjects = data.getCubeList().filter(obj => obj.type == "Line2");
    if(lineObjects.length > 0){
        overlayBtns = menuOverlay.openOverlay("There are some polygon annotations. Do you want them to be exported just as LineStrings or as Polygons too?", ["LineStrings", "LineStrings + Polygons"]);

        overlayBtns[0].addEventListener('click', rmvEventListeners);
        overlayBtns[1].addEventListener('click', exportAsPolygons);
    }
    else {
        continueExportAnnotations();
    }

}

/* Continues exportAnnotations function */
function continueExportAnnotations() {
    
    // create json-string to hold the annotation
    let id, content;
    let json = "{";
    for (const cube of data.getCubeList()) {
        id = cube.annoInfo.id;
        content = JSON.stringify(cube.annoInfo);
        json += '"' + id + '"' + ':' + content + ',';
    }
    json = json.slice(0,-1) + "}";
    const myBlob = new Blob([json], {type: "application/json"});

    // create link to download the annotation
    const url = URL.createObjectURL(myBlob);
    const anchor = document.createElement("a");
    anchor.classList.add("formbold-form-label");
    anchor.classList.add("padding-left");
    anchor.href = url;
    const filename = data.getCurrentModel().filename;
    let start = 0;
    if(filename.lastIndexOf("/") != -1){
        start = filename.lastIndexOf("/");
    }
    anchor.download = filename.slice(start,filename.lastIndexOf(".")) + "_annotations.json";
    anchor.innerHTML = "Click here to download json file with annotations";
    document.getElementById("fileSelectorPanels").appendChild(anchor);

}

/* Adds the polygon described by the multilinestring to annoInfo of objects */
function exportAsPolygons() {

    for(let obj of lineObjects){
        
        // compute multiLineString and polygon
        const multiLineString = structuredClone(obj.annoInfo.target.selector);
        const polygon = convertMultiLineToPolygon(multiLineString.value);

        // add both to annoInfo.target.selector
        if(polygon){
            obj.annoInfo.target.selector = [multiLineString, {"type":"WKTSelector", "value":polygon}];
        }
        
    }

    rmvEventListeners();
}

/* Removes event listeners from overlay buttons */
function rmvEventListeners() {

    overlayBtns[0].removeEventListener('click', exportAsPolygons);
    overlayBtns[1].removeEventListener('click', rmvEventListeners);

    continueExportAnnotations();
  
}

/* Converts a multiLineString to a polygon */
function convertMultiLineToPolygon(multiLine){

    let wktString = multiLine.replace("MULTILINESTRING Z(", "").replace("))", "");
    wktString += ")";

    const lines = wktString.split("),(");
    lines[0] = lines[0].slice(1); // remove '(' from beginning of first line in lines
    lines[lines.length-1] = lines[lines.length-1].slice(0,-1); // remove ')' from end of last line in lines

    // collect first and last points of all lines

    const nextLines = [];
    const firstPoints = new Map();
    const lastPoints = new Map();
    const allPoints = new Map();
    
    for(let i=0; i<lines.length; i++){
        const line = lines[i];
        const firstPoint = line.slice(0,line.indexOf(','));
        const lastPoint = line.slice(line.lastIndexOf(',')+1);

        firstPoints.set(firstPoint, i);
        lastPoints.set(lastPoint, i);
        allPoints.set(i, [firstPoint, lastPoint]);
    }

    // determine the correct order of the indices of the lines to form a polygon

    let beginning = 0;
    let end = 0;
    while (allPoints.size > 0){

        const size = Number(allPoints.size);

        if(!nextLines.includes(beginning)){
            nextLines.push(beginning);
        }
        if(beginning != end && !nextLines.includes(end)){
            nextLines.push(end);
        }

        let next = null, previous = null;
        if(allPoints.get(end)){
            next = firstPoints.get(allPoints.get(end)[1]);
        } 
        if(allPoints.get(beginning)){
            previous = lastPoints.get(allPoints.get(beginning)[0]);
        } 
        
        if(next){
            if(!nextLines.includes(next)){
                nextLines.push(next);
            }
            allPoints.delete(end);
            end = next;
        }
        if(previous){
            if(!nextLines.includes(previous)){
                nextLines.unshift(previous);
            }
            allPoints.delete(beginning);
            beginning = previous;
        }

        if(allPoints.size == size){
            // multiLineString couldn't be converted to polygon
            return null;
        }

    }

    // test if multilineString describes polygon

    if(lines[nextLines[0]].slice(0,lines[nextLines[0]].indexOf(',')) != lines[nextLines[nextLines.length-1]].slice(lines[nextLines[nextLines.length-1]].lastIndexOf(',')+1)){
        return null;
    }

    // compute polygon

    let polygon = "POLYGON Z((";
    for (let i of nextLines){
        polygon += lines[i].slice(0,lines[i].lastIndexOf(',')) + ",";
    }
    polygon = polygon.slice(0,-1) + "))";

    return polygon;


}

/* Opens an input field for the user to enter a URL for a model */
function openUrlInputMdl() {
    document.getElementById("importMdlUrlBtn").style.display = "block";
    document.getElementById("importMdlUrlBtnSubmit").style.display = "block";

    document.getElementById("importMdlUrlBtnSubmit").addEventListener('click', handleURLInputMdl);
}

/* Closes the input field added with openUrlInputAnno correctly */
function closeUrlInputMdl() {
    document.getElementById("importMdlUrlBtn").value = "";

    document.getElementById("importMdlUrlBtn").style.display = "none";
    document.getElementById("importMdlUrlBtnSubmit").style.display = "none";

    document.getElementById("importMdlUrlBtnSubmit").removeEventListener('click', handleURLInputMdl);
}

/* Loads a model from an URL and closes the URL input dialog */
function handleURLInputMdl(event){

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const url = document.getElementById("importMdlUrlBtn").value;

    if(loader.checkUrlValidity(url)){
         loader.loadModel(url, url); // load model

    }
    else {
        document.getElementById("state").innerHTML = "The URL you entered was not a valid URL. Please try again.";
    }

    closeUrlInputMdl(); // close input dialog
    
}

/* Opens an input field for the user to enter a URL for annotations file */
function openUrlInputAnno() {
    
    document.getElementById("importAnnoUrlBtn").style.display = "block";
    document.getElementById("importAnnoUrlBtnSubmit").style.display = "block";

    document.getElementById("importAnnoUrlBtnSubmit").addEventListener('click', handleURLInputAnno);
}

/* Closes the input field added with openUrlInputAnno correctly */
function closeUrlInputAnno() {
    document.getElementById("importAnnoUrlBtn").value = "";

    document.getElementById("importAnnoUrlBtn").style.display = "none";
    document.getElementById("importAnnoUrlBtnSubmit").style.display = "none";

    document.getElementById("importAnnoUrlBtnSubmit").removeEventListener('click', handleURLInputAnno);
}

/* Loads a model from an URL and closes the URL input dialog */
function handleURLInputAnno(event){

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const url = document.getElementById("importAnnoUrlBtn").value;

    if(loader.checkUrlValidity(url)){
         loader.loadAnnotation(url); // load model

    }
    else {
        document.getElementById("state").innerHTML = "The URL you entered was not a valid URL. Please try again.";
    }

    closeUrlInputAnno(); // close input dialog
    
}

/* Opens an input field for the user to enter a URL for annotations file with corresponding model URL */
function openUrlInputAnnoWithMdl() {
    document.getElementById("importAnnoWithMdlUrlBtn").style.display = "block";
    document.getElementById("importAnnoWithMdlUrlBtnSubmit").style.display = "block";

    document.getElementById("importAnnoUrlBtnSubmit").addEventListener('click', handleURLInputAnnoWithMdl);
}

/* Closes the input field added with openUrlInputAnnoWithMdl correctly */
function closeUrlInputAnnoWithMdl() {
    document.getElementById("importAnnoWithMdlUrlBtn").value = "";

    document.getElementById("importAnnoWithMdlUrlBtn").style.display = "none";
    document.getElementById("importAnnoWithMdlUrlBtnSubmit").style.display = "none";

    document.getElementById("importAnnoWithMdlUrlBtnSubmit").removeEventListener('click', handleURLInputAnnoWithMdl);
}

/* Loads annotations and a corresponding model from an URL and closes the URL input dialog */
function handleURLInputAnnoWithMdl(event){

    document.getElementById("fileSelectorPanels").appendChild(state); // add state dialog to the UI

    const url = document.getElementById("importAnnoWithMdlUrlBtn").value;

    if(loader.checkUrlValidity(url)){
         loader.loadAnnotation(url, true); // load model

    }
    else {
        document.getElementById("state").innerHTML = "The URL you entered was not a valid URL. Please try again.";
    }

    closeUrlInputAnnoWithMdl(); // close input dialog
    
}

export {open, done, reset};