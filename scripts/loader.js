import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';

import {Graph} from './polygonCreateClasses.js';

import * as data from './data.js';
import * as screenLine from './screenLine.js';

/* Loads file depending on type */
function loadFile (file, type, id="") {

    switch (type) {
        case "model":
            loadUserInput(file, "model");
            break;
        case "annotations":
            loadUserInput(file, "annotations");
            break;
        case "annotationsAndModel":
            loadUserInput(file, "annotationsAndModel");
            break;
        case "transliteration":
            loadUserInput(file, "transliteration");
            break;
        case "text":
            loadLocalFile(file, "text", id);
            break;
    }

}

/* Loads file (e.g. given by user input) to the main scene (either new model or new annotation) */
function loadUserInput (file, type) {

    const reader = new FileReader();
    reader.onload = function(e) {

        const urlData = URL.createObjectURL(new Blob([file]));
        switch (type) {
            case "model":
                loadModel(urlData, file.name); // load new model
                break;
            case "annotations":
                loadAnnotation(urlData); // load new annotations
                break;
            case "annotationsAndModel":
                loadAnnotation(urlData, true);
                break;
            case "transliteration":
                loadLocalFile(urlData, "transliteration");
                break;
        }
        URL.revokeObjectURL(urlData); // disable url
    };
    reader.readAsArrayBuffer(file);
}

/* Loads file (e.g. given by user input) to the info panel on the right hand side (either transliteration or txt-file) */
function loadLocalFile (file, type, id="") {

    const loader = new THREE.FileLoader();
    loader.load(file, function(fileText) {
        switch (type) {
            case "transliteration":
                loadTransliteration(fileText);
                break;
            case "text":
                loadText(fileText, id);
                break;
        }
    } );
}

/* Loads given geometries (model and annotations) into the given scene */
function loadFromGeometry (model, annotations) {

    // load model
    deleteCurrentModel();
    if(model){
        data.getScene().add(model);
        data.setCurrentModel(model);
    }

    // load annotations
    deleteCurrentAnnotations();
    let cubeList = [];
    for (const box of annotations) {
        data.getCubeGroup().add(box);
        // data.getScene().add(box);
        cubeList.push(box);
    }
    data.setCubeList(cubeList);
    data.getScene().add(data.getCubeGroup());
}

/* Loads a new model (stone) into the scene. Any existing models are removed from the scene and deleted */
function loadModel (modelToLoad, filename, deleteAnnos=true) {

    deleteCurrentModel(); // delete existing model
    if(deleteAnnos){
        deleteCurrentAnnotations(); // delete current annotations
    }
    deleteCurrentTransliteration(); // delete existing transliteration

    updateLoadingState("loading");

    const loader = new PLYLoader(); 
    loader.load(modelToLoad, function (geometry) { 

        // set up model (stone)
        geometry.computeVertexNormals();
        const stone = new THREE.Mesh(geometry, data.getMaterial("grey"));
        stone.position.set(0, 0, 0);
        stone.receiveShadow = true;

        // set attribute for filename
        stone.filename = filename;
        // add model (stone) to the scene
        data.getScene().add(stone);
        // store model (stone) as currentModel
        data.setCurrentModel(stone);

        // compute graph from mesh 
        const dijkstraGraphFromMesh = new Graph(stone);
        dijkstraGraphFromMesh.computeGraph();
        data.setDijkstraGraph(dijkstraGraphFromMesh);

        updateLoadingState("done", "Model");

    });

    
}

/* Deletes the currently displayed model (stone) and its geometry and material */
function deleteCurrentModel() {

    const currentMdl = data.getCurrentModel();
    if(currentMdl) {
        data.getScene().remove(currentMdl); // remove model from scene
        currentMdl.geometry.dispose(); // delete geometry
        data.setCurrentModel(null);
    }
}

/* Loads new annotations into the scene. Any existing annotations are removed from the scene and deleted */
function loadAnnotation (annotationToLoad, withMdl=false){

    data.setPickedObject(null); // unpick any picked object
    deleteCurrentAnnotations(); // delete existing annotations

    updateLoadingState("loading");

    const loader = new THREE.FileLoader();
    loader.load(annotationToLoad, function(fileText) {

        // cut of additional stuff that is added when reading the file with ThreeLoader
        const indexToCut = fileText.indexOf("//# sourceMappingURL=data:application/");
        if (indexToCut != -1) {
            fileText = fileText.slice(0,fileText.indexOf("//# sourceMappingURL=data:application/"));
        }

        // convert json-string to object
        const annotations = JSON.parse(fileText); 

        const annotationList = [];
        let annotation;
        for (let obj of Object.values(annotations)){
            
            // transform wkt string to simple array
            // let wktString = obj.target.selector.value;

            let wktString = null;
            if(Array.isArray(obj.target.selector)){
                for(let elem of obj.target.selector){
                    if(elem.value.includes("MULTILINESTRING Z")){
                        wktString = elem.value;
                        break;
                    }
                }
                if(!wktString){
                    wktString = obj.target.selector[0].value;
                }
                obj.target.selector = {"type":"WKTSelector", "value":wktString};
                
            } else {
                wktString = obj.target.selector.value;
            }

            // prepare annoInfo (to be added to annotation)
            delete obj.creator; // delete creator (if present) from upper level of obj
            obj.generator = data.getGenerator(); // set generator of obj to this software 

            if(wktString.includes("MULTILINESTRING Z")){
                // annotations describe lines

                wktString = wktString.replace("MULTILINESTRING Z((", "").replace("))", "");
                let lines = wktString.split("),(");
                for(let i=0; i<lines.length; i++){
                    lines[i] = lines[i].split(",");
                    lines[i] = lines[i].map(splitPoints).flat();
                    lines[i] = lines[i].map(Number);
                }

                // create annotations as polygons
                annotation = loadAnnotationPolygon(lines, obj);
            }
            else if(wktString.includes("POLYGON Z")) {

                wktString = wktString.replace("POLYGON Z((", "").replace("))", "");
                let points = wktString.split(",");
                points = points.map(splitPoints).flat();
                points = points.map(Number);
                
                // exclude annotations containing NaN-values in wkt string or that are not well formated (not being made up of a multiple of 3 points)
                if(points.includes(NaN) || points.length%3 !== 0){
                    continue;
                }

                let setX = new Set(), setY = new Set(), setZ = new Set();
                if(points.length !== 24){
                    // wkt string can't represent boxes so it must be polygons 
                    annotation = loadAnnotationPolygon(assignPointsToLines(points), obj);
                }
                else {
                    for(let i=0; i<points.length; i=i+3){
                        setX.add(points[i]);
                        setY.add(points[i+1]);
                        setZ.add(points[i+2]);
                    }
                    if (setX.size !== 2 || setY.size !== 2 || setZ.size !== 2){
                        // wkt strings represents boxes
                        annotation = loadAnnotationPolygon(assignPointsToLines(points), obj);
                    }
                    else {
                        // create annotations as boxes
                        annotation = loadAnnotationBox(setX, setY, setZ, obj);
                    }
                }
            }
            
            data.getCubeGroup().add(annotation);
            annotationList.push(annotation); 

        }
        
        data.setCubeList(annotationList);
        data.getScene().add(data.getCubeGroup());
        updateLoadingState("done", "Annotations");

        // load model if model shall be loaded from annotations json-file
        if(withMdl) {
            const modelUrl = data.getCubeList()[0].annoInfo.target.source;
            if(!checkUrlValidity(modelUrl)){
                document.getElementById("state").innerHTML = "The target.source-URL of the first element in your json-file is not a valid URL. Please change that or import annotations and model separately.";
            }
            else {
                loadModel(modelUrl, modelUrl, false);
            }
        }    
        
    } );

}

/* Splits a string at the spaces */
function splitPoints(vertex){
    return vertex.split(" ");
}

function assignPointsToLines(points) {

    for (let point of points.slice(0,3)){
        points.push(point);
    }

    const len = Math.floor(points.length / 30)*3;
    const lines = [];
    let index = 0;
    while (index < points.length-len){
        lines.push(points.slice(index,index+len+3));
        index = index + len;
    }
    lines.push(points.slice(index));

    return lines;
}

/* Returns a BoxGeometry with the size given by setX, setY, setZ */
function loadAnnotationBox(setX, setY, setZ, annoInfoToAdd) {

    data.setPolygonMode(false);

    const [x1, x2] = setX;
    const [y1, y2] = setY;
    const [z1, z2] = setZ;
    
    const boxX = Math.abs(x1-x2);
    const boxY = Math.abs(y1-y2);
    const boxZ = Math.abs(z1-z2);
    const boxCenter = [(x1+x2)/2, (y1+y2)/2, (z1+z2)/2];

    const geometry = new THREE.BoxGeometry(boxX, boxY, boxZ); 
    // const geometry = new THREE.BoxGeometry(x, y, z*1.65); 
    const cube = new THREE.Mesh(geometry, data.getMaterial("green")); 
    cube.position.set(boxCenter[0], boxCenter[1], boxCenter[2]);

    // add annoInfo
    cube.annoInfo = annoInfoToAdd;

    return cube;

}

/* Returns a LineGeometry connecting points given in points */
function loadAnnotationPolygon(lines, annoInfoToAdd) {

    data.setPolygonMode(true);

    const geometry = new LineGeometry();
    const dummyLine = new Line2( geometry, data.getMaterial("greenLine") );
    dummyLine.annoInfo = annoInfoToAdd; // add annoInfo
    data.setPickedObject(dummyLine);

    for(let points of lines){
        screenLine.makeLine(points, false, false, true);
    }
    
    return dummyLine;

}

/* Deletes the currently displayed annotations and its geometries */
function deleteCurrentAnnotations() {

    let cubeList = data.getCubeList();

    if(cubeList){
        let i = cubeList.length;
        let currentCube;
    
        // iterate over cubeList that holds the annotations
        while (i--) {
            currentCube = cubeList.pop()
            // data.getScene().remove(currentCube); // remove annotation from scene
            data.getCubeGroup().remove(currentCube); // remove annotation from scene
            currentCube.geometry.dispose(); // delete geometry
        }
        currentCube = undefined;
        data.setCubeList(null);       
    }

}

/* Displays the loading state of the model or the annotations on the lefthand side of the screen (only in 'Import/Export' menu) */
function updateLoadingState(state, name){
    const stateParagraph = document.getElementById("state"); // element in which the state shall be displayed
    // ensure that state is only displayed if html element with id 'state' exists which is if menu is in "Import/Export" mode
    if (stateParagraph) { 
        stateParagraph.style.display = "";
        switch (state) {
            case "loading":
                stateParagraph.innerHTML = "Loading file... Please wait for the loading to complete before continuing.";
                break;
            case "done":
                if(stateParagraph.parentElement.id == "userCredentials" && name=="Model") {
                    document.getElementById("doneCredentials").classList.remove("btn-unclickable");
                    stateParagraph.style.display = "none";
                }
                else if (stateParagraph.parentElement.id == "fileSelectorPanels") {
                    stateParagraph.innerHTML = name + " loaded.";
                }
                break;
        }   
    }
}

/* Loads a transliteration from a json file */
function loadTransliteration (fileText) {
    
    updateLoadingState("loading");
    data.setTransliteration(fileText.slice(fileText.indexOf("@tablet"),-2)); 
    updateLoadingState("done", "Transliteration");
}

/* Loads a text from a txt-file */
function loadText(fileText, idOfElementToInsertText) {
    const lines = fileText.split(/\r?\n|\r|\n/g);
    const textElem = document.getElementById(idOfElementToInsertText);
    if(textElem){
        textElem.innerHTML = lines.join('<br>');
    }
}

/* Deletes the currently displayed transliterations */
function deleteCurrentTransliteration () {
    data.setTransliteration(null);
}

/* Checks if url is a valid URL */
function checkUrlValidity(url) {
    try {
        new URL(url);
        return true;
    }
    catch (err) {
        return false;
    }
}

export {loadFile, loadLocalFile, loadFromGeometry, loadModel, loadAnnotation, checkUrlValidity};