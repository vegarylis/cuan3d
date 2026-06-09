import * as THREE from 'three'
import * as menuAnnoDisplay from './menuAnnoDisplay.js';
import * as infoTransliteration from './infoTransliteration.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene;
let camera;
let controls;
let renderer;

let pickedObject = null;

let currentModel = null;
let cubeList = null;
let cubeGroup = new THREE.Group();

let credentials = null;
let generator = {
    "id": "https://vegarylis.github.io/cuan3d ",
    "type": "Software",
    "name": "Cuan3D 0.3",
    "homepage": "https://vegarylis.github.io/cuan3d "
};

let transliteration = null;

// materials

const materialGrey = new THREE.MeshPhongMaterial( { color: 0xffffff, shininess: 0, specular: 0x111111, emissive: 0x000000} );
// const materialGreen = new THREE.MeshPhongMaterial({color: 0x44d7a8, opacity: 0.4, transparent: true});
// const materialOrange = new THREE.MeshPhongMaterial({color: 0xD6883A, opacity: 0.4, transparent: true});
// const materialPink = new THREE.MeshPhongMaterial({color: 0xd74473, opacity: 0.4, transparent: true});
const materialGreen = new THREE.MeshPhongMaterial({color: 0x6ca7be, opacity: 0.6, transparent: true});
const materialOrange = new THREE.MeshPhongMaterial({color: 0xc61592, opacity: 0.5, transparent: true});
const materialPink = new THREE.MeshBasicMaterial({color: 0x0b0e25, transparent: false});

// const materialGreenLine = new LineMaterial( { color: 0x44d7a8, linewidth: 7 } );
// const materialOrangeLine = new LineMaterial( { color: 0xD6883A, linewidth: 7 } );
const materialGreenLine = new LineMaterial( { color: 0x6ca7be, linewidth: 7 } );
const materialOrangeLine = new LineMaterial( { color: 0xc61592, linewidth: 7 } );

// Default tags
const curnamespace = "http://purl.org/cuneiform#";
const mlVocabulary=[{"label":"Broken","uri":curnamespace+"Broken"},{"label":"Character","uri":curnamespace+"Character"},{"label":"Line","uri":curnamespace+"Line"},{"label":"Image","uri":curnamespace+"Image"},{"label":"Word","uri":curnamespace+"Word"},{"label":"Seal","uri":curnamespace+"Seal"},{"label":"Phrase","uri":curnamespace+"Phrase"},{"label":"Erased","uri":curnamespace+"Erased"},{"label":"StrikeOut","uri":curnamespace+"StrikeOut"},{"label":"Wordstart","uri":curnamespace+"Wordstart"},{"label":"Wordend","uri":curnamespace+"Wordend"},{"label":"InWord","uri":curnamespace+"InWord"},{"label":"Wedge","uri":curnamespace+"Wedge"},{"label":"UnknownIfWord","uri":curnamespace+"UnknownIfWord"}];

const mappings={
    "PaleoCode":{"uri":curnamespace+"PaleoCode"},
    "TabletSide":{"uri":curnamespace+"TabletSide"},
    "SignRotation":{"uri":curnamespace+"SignRotation"},
    "Transliteration":{"uri":curnamespace+"Transliteration"},
    "Column":{"uri":curnamespace+"Column"},
    "Line":{"uri":curnamespace+"Line"},
    "Charindex":{"uri":curnamespace+"Charindex"},
    "Wedgeindex":{"uri":curnamespace+"Wedgeindex"},
    "Wedgetype":{"uri":curnamespace+"Wedgetype"},
    "Wordindex":{"uri":curnamespace+"Wordindex"}
}

let polygonMode;
let dijkstraGraph = null;

let turningBoxInsteadOfModel = false;

/* Getter */

function getScene(){
    return scene;
}

function getCamera(){
    return camera;
}

function getRenderer(){
    return renderer;
}

function getControls(){
    return controls;
}

function getPickedObject(){
    return pickedObject;
}

function getCurrentModel(){
    return currentModel;
}

function getCubeList(){
    return cubeList;
}

function getCubeGroup(){
    return cubeGroup;
}

function getMaterial(color){
    switch (color){
        case "grey":
            return materialGrey;
        case "green":
            return materialGreen;
        case "orange":
            return materialOrange;
        case "pink":
            return materialPink;
        case "greenLine":
            return materialGreenLine;
        case "orangeLine":
            return materialOrangeLine;
        default:
            return null;
    }
}

function getCredentials(){
    return credentials;
}

function getGenerator() {
    return generator;
}

function getTransliteration() {
    return transliteration;
}

function getDefaultTagList() {
    return mlVocabulary;
}

function getAttributes(){
    return mappings;
}

function getFieldsSourceURL(elem){   
    return mappings[elem].uri;
}

function isPolygonMode() {
    return polygonMode;
}

function getDijkstraGraph() {
    return dijkstraGraph;
}

function getTurningBox(){
    return turningBoxInsteadOfModel;
}

/* Setter */

function setScene(newScene){
    scene = newScene;
}

function setCamera(cam) {
    camera = cam;
}

function setRenderer(newRenderer){
    renderer = newRenderer;
}

/* Creates new OrbitControls to be able to deal with camera rotation */
function createControls(){

    const newControls = new OrbitControls(camera, renderer.domElement);
    newControls.target.set(0, 15, 0); // where the camera is looking towards
    newControls.mouseButtons = newControls.mouseButtons = {
        LEFT: THREE.MOUSE.DOLLY,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.PAN
    }
    newControls.update();

    if(controls){
        newControls.enabled = controls.enabled;
        controls.disconnect();
    }

    controls = newControls;
}

function setPickedObject(obj){
    // reset color of currently picked object
    if(pickedObject){
        if(pickedObject.type == "Line2"){
            for(let child of pickedObject.children){
                child.material = materialGreenLine;
            }
        }
        else {
            pickedObject.material = materialGreen; 
        }    
    }
    // update picked object and set its color to orange
    pickedObject = obj;
    if(pickedObject) {
        if(pickedObject.type == "Line2"){
            for(let child of pickedObject.children){
                child.material = materialOrangeLine;
            }
        }
        else {
            pickedObject.material = materialOrange; 
        }  
    }
    // update content of annotation display
    menuAnnoDisplay.update();
}

function setCurrentModel(model){
    currentModel = model;
}

function setCubeList(list){
    cubeList = list;
}

function setCubeGroup(group){
    cubeGroup = group; 
}

function updateCubeList(elem) {
    if(cubeList) {
        // cubeList is not empty
        cubeList.push(elem);
    }
    else {
        // cubeList is empty
        cubeList = [elem];
    }
    
}

function setCredentials(type, name, nickname, orcid) {
    credentials = {
        "type": type,
        "name": name,
    };
    if(nickname !== ""){
        credentials.nickname = nickname;
    }
    if (orcid !== "") {
        credentials.id = orcid;
    }
}

function setTransliteration(translit) {
    transliteration = translit;
    infoTransliteration.update();
}

function setPolygonMode(boolean) {
    polygonMode = boolean;
}

function setDijkstraGraph(graph) {
    dijkstraGraph = graph;
}

function setTurningBox(bool){
    turningBoxInsteadOfModel = bool;
}

export {getScene, getCamera, getRenderer, getControls, getPickedObject, getCurrentModel, getCubeList, getCubeGroup, getMaterial, getCredentials, getGenerator, getTransliteration, getDefaultTagList, getAttributes, getFieldsSourceURL, isPolygonMode, getDijkstraGraph, getTurningBox, setScene, setCamera, setRenderer, createControls, setPickedObject, setCurrentModel, setCubeList, setCubeGroup, updateCubeList, setCredentials, setTransliteration, setPolygonMode, setDijkstraGraph, setTurningBox}

