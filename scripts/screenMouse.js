import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import * as data from './data.js';
import * as screenLine from './screenLine.js';
import * as menuOverlay from './menuOverlay.js';

// raycasting (mouse functionality)
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.querySelector("#c");

let controls;
let enabled = false;

let points = [];

let editPolygonFormMode = false;

let countVerticesHit = 0;
let countVertexFormManipulated = 0;
let oldFormPoint, newFormPoint;
const savedFormManipulationPoints = [];

let countLines = 0;
let lineStartIndex = -1;
let closestVertex = null;
let firstIndex = null;

let savedLines;
let resetForm = false;

const geometry = new THREE.SphereGeometry( 0.05, 9, 6 ); 
// const material = new THREE.MeshBasicMaterial( { color: 0xd74473 } ); 
const sphere = new THREE.Mesh( geometry, data.getMaterial("pink") ); 

let overlayBtns;

/* Determines mouse position */
function setPointer(event) {
  const pos = getCanvasRelativePosition(event);
  pointer.x = (pos.x / canvas.width ) *  2 - 1;
  pointer.y = (pos.y / canvas.height) * -2 + 1;  
}

function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}

/* Changes color of box/line clicked and set box/line as pickedObject */
function selectPickedObject() {

  // cast a ray through the frustum
  raycaster.setFromCamera(pointer, data.getCamera());
  // get list of objects the ray intersects
  if(data.getCubeList()){

    // get intersectedObjects
    const listToBeIntersected = data.getCubeList().filter(elem => elem.geometry.type == "BoxGeometry").concat(data.getCubeList().filter(elem => elem.geometry.type == "LineGeometry").map(line => line.children).flat());
    let intersectedObjects = raycaster.intersectObjects(listToBeIntersected);

    if (intersectedObjects.length > 0) {

      if(intersectedObjects[0].object.geometry.type == "LineGeometry"){
        
        const parent = intersectedObjects[0].object.userData.parent;

        screenLine.clear();
        let lineIndex = 0;
        for(let child of parent.children){
          screenLine.addToLineIndexToLine(lineIndex, child);
          for(let vertexIndex of child.userData.vertices){
            screenLine.addToVertexIndexToLineIndex(vertexIndex, lineIndex)
          }
          lineIndex++;
        }
        
        data.setPickedObject(parent);

      }
      else {

        data.setPickedObject(intersectedObjects[0].object);

      }

    }
    
  }
}

/* Enables the user to select an annotation */
function enablePickingObject() { 
  canvas.addEventListener('click', selectPickedObject);   
  enabled = true;
}

/* Prevents the user from being able to select an annotation */
function disablePickingObject() {
  canvas.removeEventListener('click', selectPickedObject);
  enabled = false;
}

/* Enables DragControls */
function enableMovingPickedObject() {

  // enable DragControls
  controls = new DragControls([data.getPickedObject()], data.getCamera(), data.getRenderer().domElement);

  // disable OrbitControls while dragging
  controls.addEventListener('dragstart', function (event) {data.getControls().enabled = false;});
  controls.addEventListener('dragend', function (event) {data.getControls().enabled = true;});
  
}

/* Disables DragControls */
function disableMovingPickedObject() {

  // remove EventListeners added in dragPickedObject
  controls.removeEventListener('dragstart', function (event) {data.getControls().enabled = false;});
  controls.removeEventListener('dragend', function (event) {data.getControls().enabled = true;});

  // disable DragControls
  controls.disconnect();

}

/* Gets the vertex the user clicked on an initiates drawing a line between that vertex and the previously clicked vertex */
function getVertexOnSurface() {

  // cast a ray through the frustum
  raycaster.setFromCamera(pointer, data.getCamera());

  const intersectedObjects = raycaster.intersectObject(data.getCurrentModel());

  if (intersectedObjects.length > 0) {

    closestVertex = screenLine.getClosestVertex([intersectedObjects[0].point.x, intersectedObjects[0].point.y, intersectedObjects[0].point.z], data.getDijkstraGraph().nodes);

    if(!editPolygonFormMode){

      // add line to polygon until it's closed

      const intersectedPoint = intersectedObjects[0].point;
      points.push(intersectedPoint);
      
      if(points.length > 1){

          // remove sphere from scene
          data.getPickedObject().remove(sphere); 

          // lineStartIndex is needed for correctly reseting line after pressing ctrl+z
          if(countLines == 1){
            lineStartIndex = Array.from(screenLine.getIndicesOfUserAddedVertices())[0];
          }
          countLines++;

          const len = points.length;
          screenLine.makeLine(
            [points[len-2].x, points[len-2].y, points[len-2].z, 
            points[len-1].x, points[len-1].y, points[len-1].z], 
            true, false, false
          );

          if(firstIndex == null){
            [firstIndex] = screenLine.getIndicesOfUserAddedVertices();
            firstIndex = structuredClone(firstIndex);
          }

          // check if polygon is closed
          if(closestVertex.index == firstIndex){
            editPolygonFormMode = true;
            countVertexFormManipulated = 0;

            sphere.position.set(closestVertex.value.x, closestVertex.value.y, closestVertex.value.z);
            data.getPickedObject().add( sphere ); 

            // save current lines (be able to later reset lines when pressing ctrl+z after already changing vertices positions)
            savedLines = {...Array.from(screenLine.getUserAddedLines())};
          }
      }   
      else {
        // first point set --> add sphere to give user feedback that point has been set
        sphere.position.set(closestVertex.value.x, closestVertex.value.y, closestVertex.value.z);
        data.getPickedObject().add(sphere); 
      }
    }
    else {

      switch (countVerticesHit){

        case 0:

          // start vertex hit
          if(Array.from(screenLine.getIndicesOfUserAddedVertices()).includes(closestVertex.index)){
            console.log("vertex " + closestVertex.index + " hit");

            const line = screenLine.getLineByVertexIndex(closestVertex.index);
            const vertexValue = data.getDijkstraGraph().nodes.get(closestVertex.index)
            sphere.position.set(vertexValue.value.x, vertexValue.value.y, vertexValue.value.z);
            line.add( sphere ); 

            countVerticesHit = 1;
            oldFormPoint = closestVertex;
          }
          break;

        case 1:

          countLines = 0;
          // destination vertex hit
          newFormPoint = closestVertex;
          savedFormManipulationPoints.push([oldFormPoint, newFormPoint]);

          screenLine.getLineByVertexIndex(oldFormPoint.index).remove(sphere);

          screenLine.computeReformedLine(oldFormPoint, newFormPoint);

          countVertexFormManipulated++;
          countVerticesHit = 0;
          break;
      }
    }
  }
}

/* Enables the user to select a point on the mesh */
function enablePickingVertex() { 
  firstIndex = null;
  canvas.addEventListener('click', getVertexOnSurface); 
  document.getElementById("mainWindow").addEventListener('keydown', handleKeyboardInput); 
}

/* Disables the user to select a point on the mesh */
function disablePickingVertex() { 
  canvas.removeEventListener('click', getVertexOnSurface); 
  document.getElementById("mainWindow").removeEventListener('keydown', handleKeyboardInput); 
  sphere.removeFromParent();
}

/* Enables either picking vertices (if in 'polygon' mode) or dragging boxes (if in 'box' mode) */
function enableEditingForm(withCreate) {
  if(data.isPolygonMode()){

    editPolygonFormMode = !withCreate;
    enablePickingVertex();
    
  }
  else {
    if(!enabled){
      enableMovingPickedObject();
    }
  }
}

/* Disables either picking vertices (if in 'polygon' mode) or dragging boxes (if in 'box' mode) */
function disableEditingForm() {

  if(data.isPolygonMode()){
    disablePickingVertex();

    // open overlay to ask if polygon should be closed (if necessary)
    if(!editPolygonFormMode && firstIndex != null){
      overlayBtns = menuOverlay.openOverlay("The drawn polygon is not closed. Do you want it to be closed automatically or leave it as it is?", ["Close", "Leave it open"]);

      overlayBtns[0].addEventListener('click', closePolygon);
      overlayBtns[1].addEventListener('click', rmvEventListeners);
    }

    if(firstIndex == null){
      data.setPickedObject(null);
    }

  }
  else {
    disableMovingPickedObject();
  }
}

/* Clears up variables to start anew when creating new annotation */
function clear(){
  points = [];
  editPolygonFormMode = false;
  screenLine.clear();
}

/* Handles keyboard input if vertex picking is enabled */
function handleKeyboardInput(event){
  
  // remove last added line (Strg + z)
  if(event.ctrlKey && event.key === "z"){
    if(editPolygonFormMode) {
      if(countVertexFormManipulated == 0){
        if(resetForm){
          // remove current lines
          const children = Array.from(data.getPickedObject().children);
          for (let child of children){
            child.removeFromParent();
            child.geometry.dispose();
          }
          screenLine.clear();
          // set up savedLines
          for (let line of Object.values(savedLines)){
            screenLine.makeLine(line.userData.vertices, false, true, true);
            line.geometry.dispose();
          }
        }
        resetLastLine();
        editPolygonFormMode = false;
      }
      else if(countVertexFormManipulated > 0){
        resetLastFormManipulation();
      }
    }
    else {
      resetLastLine();
    }
  }

  // cut connection to previously drawn line (esc)
  // if(event.key === "Escape"){
  //   pointsSaved = pointsSaved.concat(points);
  //   points = [];
  // }
}

/* Removes last added line from scene and cleans up necessary stuff */
function resetLastLine() {

  if(points.length !== 0){
    points.pop();
  }

  const [lastLineIndex, lastLine] = screenLine.popFromLineIndexToLineIndex();

  // remove vertices belonging to line from vertexIndexToLineIndex
  screenLine.removeFromVertexIndexToLineIndex(lastLineIndex, lineStartIndex);

  lastLine.removeFromParent();
  lastLine.geometry.dispose();
  
}

/* Undos last polygon form manipulation */
function resetLastFormManipulation() {
  const [newFormPoint, oldFormPoint] = savedFormManipulationPoints.pop();
  screenLine.computeReformedLine(oldFormPoint, newFormPoint);
  countVertexFormManipulated--;
  countVerticesHit = 0;
  resetForm = true;
}

/* Sets the position of the picked annotation box to the position the user selected with the mouse */
function setPositionOfBox(){

  const box = data.getPickedObject();

  // cast a ray through the frustum
  raycaster.setFromCamera(pointer, data.getCamera());

  const intersectedObjects = raycaster.intersectObject(data.getCurrentModel());

  if (intersectedObjects.length > 0) {

    const closestVertex = screenLine.getClosestVertex([intersectedObjects[0].point.x, intersectedObjects[0].point.y, intersectedObjects[0].point.z], data.getDijkstraGraph().nodes);

    box.position.set(closestVertex.value.x, closestVertex.value.y, closestVertex.value.z);

  }
  else {
    box.position.set(0,0,0);
  }

  data.getCubeGroup().add(box);
}

/* Closes the polygon which was created last */
function closePolygon() {

  closestVertex = screenLine.getClosestVertex([points[points.length-1].x, points[points.length-1].y, points[points.length-1].z], data.getDijkstraGraph().nodes);

  screenLine.makeLine([closestVertex.index,firstIndex], true, true);
  rmvEventListeners();

}

/* Removes event listeners from overlay buttons */
function rmvEventListeners() {

  overlayBtns[0].removeEventListener('click', closePolygon);
  overlayBtns[1].removeEventListener('click', rmvEventListeners);

}

window.addEventListener('mousemove', setPointer);

export {enablePickingObject, disablePickingObject, enableEditingForm, disableEditingForm, clear, setPositionOfBox};