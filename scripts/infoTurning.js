import * as data from './data.js';
import * as THREE from 'three'

let scalar = 1;

let savedPosition;

const keyTurning = new Map([
    ["a", {"fixed":"y", "manualChange":"x", "calculatedChange":"z", "direction": 1, "slow": true}],
    ["d", {"fixed":"y", "manualChange":"x", "calculatedChange":"z", "direction": -1, "slow": true}],
    ["s", {"fixed":"x", "manualChange":"y", "calculatedChange":"z", "direction": 1, "slow": true}],
    ["w", {"fixed":"x", "manualChange":"y", "calculatedChange":"z", "direction": -1, "slow": true}],
    ["y", {"fixed":"y", "manualChange":"x", "calculatedChange":"z", "direction": 1, "slow": false}],
    ["x", {"fixed":"y", "manualChange":"x", "calculatedChange":"z", "direction": -1, "slow": false}],
    ["c", {"fixed":"x", "manualChange":"y", "calculatedChange":"z", "direction": -1, "slow": false}],
    ["v", {"fixed":"x", "manualChange":"y", "calculatedChange":"z", "direction": 1, "slow": false}]
])
const keyTurningZ = new Map([
    ["q", {"direction": -1, "slow": true}],
    ["e", {"direction": 1, "slow": true}],
    ["b", {"direction": -1, "slow": false}],
    ["n", {"direction": 1, "slow": false}]
])

function setup(){

    // keyboard shortcuts
    document.getElementById("mainWindow").addEventListener('keydown', handleKeyboardInput);

    // functionality "turn model upside down button"
    document.getElementById("turnMdlBtn").addEventListener('click', turnModel);
    document.getElementById("turnMdlBtn").innerHTML = "&#128472; turn model upside down";

    // functionality "turn model to original orientation"
    document.getElementById("turnMdlBackBtn").addEventListener('click', turnModelToOriginal);
    document.getElementById("turnMdlBackBtn").innerHTML = "&#128472; turn model to original orientation";
    savedPosition = structuredClone(data.getCamera().position);
}

/* Turns the model and the annotations */
function turnModel() {

    rotateCamera(180, 1);

}

/* Resets position and up-vector of model */
function turnModelToOriginal(event){

    data.getCamera().position.set(savedPosition.x, savedPosition.y, savedPosition.z); // reset position of camera 
    data.getCamera().up = new THREE.Vector3(0, 1, 0); // reset up-vector of camera
    scalar = 1; 

    data.createControls();

}

/* Handles keyboard input for rotation keys */
function handleKeyboardInput(event){

    const key = event.key;

    if(Array.from(keyTurning.keys()).includes(key)){

        if(data.getTurningBox()){
            // turn box instead of model
            turnBox(key, false);
        }
        else {
            // turn model

            const [x,y,z] = calculateRotation(key, false);

            data.getCamera().position.set(x, y, z);
            // console.log("x:" + x + ", y:" + y + ", z: " + z);
            data.getControls().update();
        }
        
        
    }

    if(Array.from(keyTurningZ.keys()).includes(key)){

        if(data.getTurningBox()){
            // turn box instead of model
            turnBox(key, true);
        }
        else {
            // turn model

            const offset = setOffset(keyTurningZ, key);
            const dir = keyTurningZ.get(key);
            rotateCamera(offset, dir.direction);

        }

    }

}

/* Computes position for camera based on rotation caused by given key */
function calculateRotation(key, jumpToNext){

    const dir = keyTurning.get(key);
    let x = 0, y = 0, z = 0;

    const position = data.getCamera().position;
    const target = data.getControls().target;

    const euclidean = Math.hypot(position.x-target.x, position.y-target.y, position.z-target.z);

    const offset = setOffset(keyTurning, key);
    let quadrantDir;

    // determine fixed variable
    switch (dir.fixed){
        case "x":
            x = position.x;
            quadrantDir = getDirectionInQuadrant(position, target, "x", jumpToNext, dir.direction);
            break;
        case "y":
            y = position.y;
            quadrantDir = getDirectionInQuadrant(position, target, "y", jumpToNext, dir.direction);
            break;
        default:
            throw "keyTurning only takes 'x', 'y' as values for fixed";
    }

    // determine manually changed variable
    let manualChange;
    switch (dir.manualChange){
        case "x":
            x = position.x + offset*(dir.direction)*quadrantDir[0];
            manualChange = x;
            break;
        case "y":
            y = position.y + offset*(dir.direction)*quadrantDir[1];
            manualChange = y;
            break;
        default:
            throw "keyTurning only takes 'x', 'y' as values for manualChange";
    }
    


    // determine calculated variable
    switch (dir.calculatedChange){
        case "z":
            if(euclidean**2-(x-target.x)**2-(y-target.y)**2 >= 0 && (Number((manualChange).toFixed(3))!=0 || jumpToNext)){
                z = (Math.sqrt(euclidean**2-(x-target.x)**2-(y-target.y)**2)-target.z)*quadrantDir[2];
            }
            else if (!jumpToNext) {
                [x,y,z] = calculateRotation(key, true);
            }
            else { z=0; }
            break;
        default:
            throw "keyTurning only takes 'z' as value for calculatedChange";
    }

    return [x,y,z];
}

function setOffset(map, key){
    let offset = 0;
    if(map.get(key).slow){
        offset = 5;
    }
    else {
        offset = 90;
    }
    return offset;
}

/* Returns multipliers (-1,1) to compute correct direction of rotation in order to make full circle rotation possible */
function getDirectionInQuadrant(position, offset, fixedVar, jumpToNext, dir){
    
    switch (fixedVar){
        case "x":
            if(jumpToNext){
                turnModel();
                return [0,dir,dir]; 
            }
            else{
                if (position.z >= offset.z){
                    return [0,1,1];
                }
                else {
                    return [0,-1,-1];
                }
            }
            break;
        case "y":
            if((position.z >= offset.z && !jumpToNext) || (position.x < offset.x && jumpToNext && dir == 1) || (position.x >= offset.x && jumpToNext && dir == -1)){
                return [1,0,1];
            }
            else if((position.z < offset.z && !jumpToNext) || (position.x >= offset.x && jumpToNext && dir == 1) || (position.x < offset.x && jumpToNext && dir == -1)){
                return [-1,0,-1];
            }
            break;
        default:
            throw "getQuadrant() only takes 'x' or 'y' for its parameter fixedVar";
    }
}

/* Rotates the camera */
function rotateCamera(offset, direction){

    let current = Math.acos(data.getCamera().up.x)*180/Math.PI;
    const cameraUpSaved = data.getCamera().up.y;

    if(scalar == -1){
        current = 360-current;
    }
    
    const radians = (current+offset*direction)*Math.PI/180;
    data.getCamera().up = new THREE.Vector3(Math.cos(radians), Math.sin(radians), 0);

    if(Math.sign(cameraUpSaved) !== Math.sign(data.getCamera().up.y)){
        scalar = -scalar;
    }

    data.createControls();
    
}

/* Rotates the picked annotation box */
function turnBox(key, aroundZ){

    const box = data.getPickedObject();

    if(aroundZ){

        // turn box around z-axis

        const dir = keyTurningZ.get(key);
        const offset = setOffset(keyTurningZ, key);

        box.rotateZ((offset*dir.direction)*Math.PI/180);
    }
    else {

        // turn box around x- or y-axis

        const dir = keyTurning.get(key);
        const offset = setOffset(keyTurning, key);

        switch (dir.manualChange){
            case "x":
                // box.rotation.x = (box.rotation.x+offset*dir.direction)*Math.PI/180;
                box.rotateX((offset*dir.direction)*Math.PI/180);
                break;
            case "y":
                // box.rotation.x = (box.rotation.x+offset*dir.direction)*Math.PI/180;
                box.rotateY((offset*dir.direction)*Math.PI/180);
                break;
        }
    }

}


export {setup}