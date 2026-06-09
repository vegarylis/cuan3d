import * as THREE from 'three'
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';

import * as data from './data.js';
import * as screenLine from './screenLine.js';

let cube;

function open(form) {

    if(form == "polygon"){
        data.setPolygonMode(true);
        openPolygonCreate();
    }
    else {
        data.setPolygonMode(false);
        openBoxCreate();
    }

}

function done() {

    if(data.getPickedObject()){
        data.updateCubeList(data.getPickedObject());
    }
    
}

function reset() {

    if(data.isPolygonMode()){
        // remove temporary lines
        for (let line of screenLine.getUserAddedLines()){
            line.removeFromParent();
            line.geometry.dispose();
        }
        // reset pickedObject
        data.getPickedObject().geometry.dispose();
        data.setPickedObject(null);  
        
    }
    else {

        data.getCubeGroup().remove(cube); // remove cube from scene
        cube.geometry.dispose(); // delete geometry
        data.setPickedObject(null); // reset picked object

    }

}

/* Adds new cube to the scene */
function openBoxCreate() {

    console.log("create box");
        
    // create new box (cube) with same material as other annotations
    // const geometry = new THREE.BoxGeometry(5, 5, 5*1.65); 
    const geometry = new THREE.BoxGeometry(5, 5, 5); 
    cube = new THREE.Mesh(geometry, data.getMaterial("green")); 
    // cube.position.set(0,0,0);

    // add 'annoInfo' object to cube object
    addAnnoInfo(cube); 
    
    // add cube to scene and set is as currently picked object
    data.setPickedObject(cube);
}

/* Adds (dummy) line geometry to the scene (needed because otherwise there are problems with null references) */
function openPolygonCreate() {

    const geometry = new LineGeometry();
    const dummyLine = new Line2( geometry, data.getMaterial("orangeLine") );
    addAnnoInfo(dummyLine);

    dummyLine.rotation.z = data.getCurrentModel().rotation.z;

    data.setPickedObject(dummyLine);

    data.getCubeGroup().add(dummyLine);

    screenLine.clear();

}

/* Adds a property annoInfo to object containing the infos that shall later be exported */
function addAnnoInfo(object) {

    const jsonString = '{"type":"Annotation",'
        + '"body":[],'
        + '"target":{'
            + '"source":"' + data.getCurrentModel().filename + '",'
            + '"selector":{'
                + '"type":"WKTSelector",'
                + '"value":""},'
            + '"rights":"https://creativecommons.org/licenses/by-sa/4.0/"},'
        + '"@context":"http://www.w3.org/ns/anno.jsonld",'
        + '"id":"' + generateUniqueId() +'",'
        + '"rights":"https://creativecommons.org/publicdomain/zero/1.0/",'
        + '"generator":' + JSON.stringify(data.getGenerator()) + '}';
    object.annoInfo = JSON.parse(jsonString);    

}

/* Generates a v4 UUID (s. https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) with an added '#' at the beginning */
function generateUniqueId() {
    return '#' + self.crypto.randomUUID();
}

export {open, done, reset};