// import { GUI } from '../node_modules/dat.gui/build/dat.gui.module.js';
// import {Line2} from '../node_modules/three/examples/jsm/lines/Line2.js';
// import {LineGeometry} from '../node_modules/three/examples/jsm/lines/LineGeometry.js';
import { GUI } from 'dat.gui/build/dat.gui.module.js';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';

import * as data from './data.js';
import * as screenLine from './screenLine.js';

let gui;

let pickedObject;

// for 'reset' functionality
let saveOriginalValues;
let saveDeletedBox = null;
let saveAnnoInfo = null;

let saveLinesVertices;
let saveLinesAnnoInfo;

let deleteBtn;

/* Opens GUI for the user to change the size and position of a selected annotation box */
function open(deleteFunctionality) {
    
    pickedObject = data.getPickedObject();

    // check if any box (annotation object) is selected
    if (pickedObject !== null) {

        // setup 'delete' button and its functionality
        if(deleteFunctionality){
            setupDeleteButton();
            saveDeletedBox = null;
            saveAnnoInfo = null;
        }      
        
        if(pickedObject.geometry.type == "LineGeometry"){

            // annotation has polygon form
            data.setPolygonMode(true);
            
            saveLinesVertices = [];
            saveLinesAnnoInfo = {...pickedObject.annoInfo}
            for(let child of pickedObject.children){
                saveLinesVertices.push(child.userData.vertices);
            }
        }
        else {
            
            // annotation has box form
            data.setPolygonMode(false);

            // save values that can be transformed to be able to reset them if requested
            saveOriginalValues = [pickedObject.scale.x, pickedObject.scale.y, pickedObject.scale.z, pickedObject.position.x, pickedObject.position.y, pickedObject.position.z, pickedObject.rotation.x, pickedObject.rotation.y, pickedObject.rotation.z];

            // setup gui to change position and scale of pickedObject
            setupGUI();

            // enable turning box instead of model
            data.setTurningBox(true);
        }  
    }
    else {
        console.log("No object picked! Please click on an annotation to edit its form.");
    }  
    
}

function done() {

    if(data.isPolygonMode()){
        pickedObject = data.getPickedObject();
    }

    // update WKT-string of pickedObject
    // if-condition is important to not set wkt if annotation is created and then reset
    if(data.getPickedObject()) {
        const wkt = geomToWKT();
        pickedObject.annoInfo.target.selector.value = wkt;
        // pickedObject.annoInfo.target.creator = data.getCredentials();
    }

    // remove gui and delete button from lowercontainer 
    const lowerContainer = document.getElementById("lowercontainer");
    while (lowerContainer.firstChild) {
        lowerContainer.removeChild(lowerContainer.lastChild);
    }
    if(gui){
        gui.destroy(); 
    } // delete gui
    if(deleteBtn){
        deleteBtn.removeEventListener('click', deleteAnnotation);
    } // remove event listener of 'delete' button

    // enable turning box instead of model
    data.setTurningBox(false);

}

function reset() {

    if(data.isPolygonMode()){
        resetPolygonAnnotation();
    }
    else {
        resetBoxAnnotation();
    }
    

}

/* Resets position of box back to its original state at the time menuEditForm was opened */
function resetBoxAnnotation() {

    // readd deleted annotation (if necessary)
    if(saveDeletedBox){

        // readd deleted annotation
        saveDeletedBox.annoInfo = saveAnnoInfo;
        data.getCubeGroup().add(saveDeletedBox);
        data.updateCubeList(saveDeletedBox);
        data.setPickedObject(saveDeletedBox);
        pickedObject = data.getPickedObject();

        // setup gui
        setupGUI();
        
        saveDeletedBox = null;
    }

    // reset changed form values
    [pickedObject.scale.x, pickedObject.scale.y, pickedObject.scale.z, pickedObject.position.x, pickedObject.position.y, pickedObject.position.z, pickedObject.rotation.x, pickedObject.rotation.y, pickedObject.rotation.z] = saveOriginalValues;    

}

/* Resets form of polygon back to its original state at the time menuEditForm was opened */
function resetPolygonAnnotation() {

    // readd deleted annotation (if necessary) or delete all children (lines) of pickedObject
    if(!data.getPickedObject()){
        const geometry = new LineGeometry();
        const dummyLine = new Line2( geometry, data.getMaterial("orangeLine") );
        dummyLine.annoInfo = saveLinesAnnoInfo;
        data.setPickedObject(dummyLine);
    
        data.getCubeGroup().add(dummyLine);

    }
    else {
        const children = Array.from(data.getPickedObject().children);
        for (let child of children){
          child.removeFromParent();
          child.geometry.dispose();
        }
    }
    screenLine.clear();

    // add savedLines
    for(let vertices of saveLinesVertices){
        screenLine.makeLine(vertices, false, true, true);
    }    
}

/* Constructs wkt string of pickedObject's geometry */
function geomToWKT() {

    let wkt;

    if(data.isPolygonMode()){

        wkt = "MULTILINESTRING Z(";

        const graphFromMesh = data.getDijkstraGraph();
        for(let child of data.getPickedObject().children){
            let linestring = "(";
            for (let vertexIndex of child.userData.vertices){
                const point = graphFromMesh.nodes.get(vertexIndex).value;
                linestring += point.x + " " + point.y + " " + point.z + ",";
            }
            linestring = linestring.slice(0,-1) + "),";
            wkt += linestring;
        }
        wkt = wkt.slice(0,-1) + ")";
        
    }
    else {

        const width = pickedObject.geometry.parameters.width * pickedObject.scale.x;
        const height = pickedObject.geometry.parameters.height * pickedObject.scale.y;
        const depth = pickedObject.geometry.parameters.depth * pickedObject.scale.z;
        // const depth = pickedObject.geometry.parameters.depth/1.65 * pickedObject.scale.z;

        const x1 = pickedObject.position.x + width/2;
        const x2 = pickedObject.position.x - width/2;
        const y1 = pickedObject.position.y + height/2;
        const y2 = pickedObject.position.y - height/2;
        const z1 = pickedObject.position.z + depth/2;
        const z2 = pickedObject.position.z - depth/2;

        wkt = "POLYGON Z(("   + x1 + " " + y1 + " " + z1 + "," 
                                    + x1 + " " + y1 + " " + z2 + "," 
                                    + x1 + " " + y2 + " " + z1 + ","
                                    + x1 + " " + y2 + " " + z2 + ","
                                    + x2 + " " + y1 + " " + z1 + ","
                                    + x2 + " " + y1 + " " + z2 + ","
                                    + x2 + " " + y2 + " " + z1 + ","
                                    + x2 + " " + y2 + " " + z2 + "))";        
    }
    
    return wkt;
}

/* Adds gui to change position and scale of pickedObject to index.html */
function setupGUI() {

    gui = new GUI({autoPlace: false});

    // set up 'Size' on GUI
    const cubeSize = gui.addFolder('Size');
    cubeSize.add(pickedObject.scale, 'x', 0, 20);
    cubeSize.add(pickedObject.scale, 'y', 0, 20);
    cubeSize.add(pickedObject.scale, 'z', 0, 20);
    cubeSize.open();

    // set up 'Position' on GUI
    const cubePosition = gui.addFolder('Position');
    cubePosition.add(pickedObject.position, 'x', -50, 50);
    cubePosition.add(pickedObject.position, 'y', -50, 50);
    cubePosition.add(pickedObject.position, 'z', -50, 50);
    cubePosition.open();

    document.getElementById("lowercontainer").appendChild(gui.domElement); // place gui in lowerContainer
}

/* Adds delete button to index.html */
function setupDeleteButton() {
    let deleteBtnDiv = document.createElement("div");
    deleteBtnDiv.classList.add("btn-wide");
    deleteBtnDiv.classList.add("deleteAnnoContainer");
    deleteBtnDiv.classList.add("btn-group");

    deleteBtn = document.createElement("button");
    deleteBtn.id = "deleteBtnAnnotation";
    deleteBtn.type = "button";
    deleteBtn.classList.add("background-red");
    deleteBtn.innerHTML = "Delete annotation";
    deleteBtnDiv.appendChild(deleteBtn);
    
    deleteBtn.addEventListener('click', deleteAnnotation);

    document.getElementById("lowercontainer").appendChild(deleteBtnDiv);

}

/* Removes complete annotation including box and content from annotations */
function deleteAnnotation(event){

    const boxToDelete = data.getPickedObject();
    saveDeletedBox = {...boxToDelete };
    // saveDeletedBox = boxToDelete.clone();
    saveAnnoInfo = {...data.getPickedObject().annoInfo}

    data.getCubeGroup().remove(boxToDelete);
    data.getScene().remove(boxToDelete);
    data.getCubeList().splice(data.getCubeList().indexOf(boxToDelete),1);
    
    data.setPickedObject(null);

    // remove gui
    if(gui){
        const lowerContainer = document.getElementById("lowercontainer");
        lowerContainer.removeChild(gui.domElement);
        gui.destroy();
        gui = null;
    }
    
}

export {open, done, reset};