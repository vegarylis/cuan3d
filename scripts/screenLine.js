import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import { Vector3 } from 'three';

import PriorityQueue from './polygonCreateClasses.js';
import * as data from './data.js';


let vertexIndexToLineIndex = new Map();
let lineIndexToLine = new Map();

/* Draws a line between two vertices on the surface of the object's mesh */
function makeLine(points, dijkstra=false, indices=true, alreadyOnMesh=false, manualLineIndex=undefined) {
    
    const graphFromMesh = data.getDijkstraGraph();

    let newLineIndex = lineIndexToLine.size;
    if(manualLineIndex !== undefined){
        newLineIndex = manualLineIndex;
    }
    
    const geometry = new LineGeometry();
    
    // collect vertices of line
    let vertices = [];
    if(dijkstra){

        let path;
        if(indices){
            path = getShortestPath(points[0], points[1], graphFromMesh.nodes);
        }
        else {
            path = getShortestPath(
                getClosestVertex([points[0], points[1], points[2]], graphFromMesh.nodes).index, 
                getClosestVertex([points[3], points[4], points[5]], graphFromMesh.nodes).index, 
                graphFromMesh.nodes
            );   
        }

        for (let point of path){
            vertices.push(point.value.x, point.value.y, point.value.z);
            vertexIndexToLineIndex.set(point.index, newLineIndex);
        }
    }
    else {
        // if points are already mesh vertices one doesn't have to calculate getClosestVertex --> performance improvement
        if(alreadyOnMesh){
            if(indices){
                for (let index of Array.from(points)){
                    const point = graphFromMesh.nodes.get(index).value;
                    vertices.push(point.x, point.y, point.z);
                    vertexIndexToLineIndex.set(index, newLineIndex);
                }                
            }
            else {
                vertices = points;
                for (let i=0; i<points.length; i=i+3){
                    const index = graphFromMesh.nodeValueToIndex.get("" + points[i] + " " + points[i+1] + " " + points[i+2]);
                    vertexIndexToLineIndex.set(index, newLineIndex);
                }   
            }

        }
        else {
            for (let i=0; i<points.length; i=i+3){
                const vertex = getClosestVertex([points[i], points[i+1], points[i+2]], graphFromMesh.nodes);
                vertices.push(vertex.value.x, vertex.value.y, vertex.value.z);
                vertexIndexToLineIndex.set(vertex.index, newLineIndex);
            }            
        }
    }

    // set geometry from collected vertices
    geometry.setPositions(vertices);
  
    const line = new Line2(geometry, data.getMaterial("orangeLine"));

    const indicesOfVertices = [];
    for(let i=0; i<vertices.length; i=i+3){
        indicesOfVertices.push(graphFromMesh.nodeValueToIndex.get("" + vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]));
    }
    line.userData.vertices = indicesOfVertices;

    // update lineIndexToLine
    lineIndexToLine.set(newLineIndex, line);

    data.getPickedObject().add(line);
    line.userData.parent = data.getPickedObject();
  
}

/* Sets position of a clicked vertex to a new point selected by mouse click on the model and redraws lines */
function computeReformedLine(oldPoint, newPoint) {

    const lineIndexToLineCopy = new Set(lineIndexToLine.entries());

    for(let [key, value] of lineIndexToLineCopy.values()){
        const index = value.userData.vertices.indexOf(oldPoint.index)
        if(index !== -1){

            // clean up references to old line
            for(let index of value.userData.vertices){
                vertexIndexToLineIndex.delete(index);  
            }
            // lineIndexToLine.delete(key);
            value.removeFromParent();
            value.geometry.dispose();

            if(index !== 0){
                lineIndexToLine.delete(key);
                makeLine(
                    [value.userData.vertices[0], getClosestVertex([newPoint.value.x, newPoint.value.y, newPoint.value.z], data.getDijkstraGraph().nodes).index], 
                    true, true, false, key
                );
            }

            if(index !== value.userData.vertices.length-1){
                let keyToInsertLine = lineIndexToLine.size;
                if(index == 0){
                    lineIndexToLine.delete(key);
                    keyToInsertLine = key; 
                }
                makeLine(
                    [getClosestVertex([newPoint.value.x, newPoint.value.y, newPoint.value.z], data.getDijkstraGraph().nodes).index, value.userData.vertices[value.userData.vertices.length-1]], 
                    true, true, false, keyToInsertLine
                );
            }

            

            

        }
    }
}
  
/* Returns the vertex of the object's mesh the clicked point is closest to */
function getClosestVertex(pointAsArray, vertices) {

    if(pointAsArray.length !== 3){
        throw "Point in getClosestArray is not composed of 3 values (x,y,z)"; 
    }

    // transform values in array (x,y,z) into Vector3 
    const point = new Vector3(0,0,0);
    point.fromArray(pointAsArray);

    // calculate closest vertex
    let min = point.distanceTo(vertices.get(0).value);
    let minVertex = vertices.get(0).index;
    let tempDistance;
    for(const vertex of vertices.values()){
        tempDistance = point.distanceTo(vertex.value);
        if(tempDistance < min){
            min = tempDistance;
            // minVertex = vertex.index;
            minVertex = vertex;
        }
    }
    return minVertex;
}
  
/**
 * Calculates the shortest path between two nodes using Dijkstra's algorithm.
 * @param startIndex - The index of the start node.
 * @param endIndex - The index of the end node.
 * @param nodes - A map of nodes where the key is the node index and the value is the node itself.
 * @returns An array of node values representing the shortest path, or null if no path is found.
 * 
 * Code taken and apdapted from https://blog.promaton.com/optimal-route-crafting-finding-the-shortest-path-on-the-surface-of-a-mesh-8e77dcaea689 *
**/
function getShortestPath(startIndex, endIndex, nodes) {
   
    const startNode = nodes.get(startIndex);
    const endNode = nodes.get(endIndex);
  
    if (!startNode || !endNode) {
        throw "Start or end node is undefined";
    }
  
    const distances = new Map();
    const previousNodes = new Map();
    const queue = new PriorityQueue();
  
    distances.set(startNode, 0);
    queue.enqueue(startNode, 0);
  
    let currentNode, path, node, adjacentNode, currentDistance, newDistance, adjacentNodeDistance;
  
    while (!queue.isEmpty()) {
  
        currentNode = queue.dequeue();
  
        if (currentNode == endNode) {
            path = [];
            node = currentNode;
  
            while (node) {
                path.unshift(node);
                node = previousNodes.get(node);
            }
            return path;
        }
  
  
        for (let edge of currentNode.edges) {
  
            if(edge.node1 !== currentNode){
                adjacentNode = edge.node1;
            }
            else {
                adjacentNode = edge.node2;
            }
  
            currentDistance = distances.get(currentNode);
  
            if (typeof currentDistance !== "undefined") {
                newDistance = currentDistance + edge.weight;
                adjacentNodeDistance = distances.get(adjacentNode);
  
                if (adjacentNodeDistance == null || newDistance < adjacentNodeDistance) {
                    distances.set(adjacentNode, newDistance);
                    previousNodes.set(adjacentNode, currentNode);
                    queue.enqueue(adjacentNode, newDistance);
                }
            } 
        }
    }
    console.log("Failed to find path");
    return null
  
}

/* Clears up variables to start anew when creating new annotation */
function clear() {
    vertexIndexToLineIndex.clear();
    lineIndexToLine.clear();
}

function getIndicesOfUserAddedVertices() {
    return vertexIndexToLineIndex.keys();
}

function getUserAddedLines() {
    return lineIndexToLine.values();
}

function addToVertexIndexToLineIndex(key, value){
    vertexIndexToLineIndex.set(key, value);
}

function addToLineIndexToLine(key, value){
    lineIndexToLine.set(key, value);
}

function removeFromVertexIndexToLineIndex(lineIndex, firstLineStartIndex=-1){

    const keysToRemove = [];
    for (let [key,value] of vertexIndexToLineIndex.entries()){
        if(value === lineIndex){
            if(key !== firstLineStartIndex){
                keysToRemove.push(key);
            }  
        }
    }
    for (let key of keysToRemove){
      vertexIndexToLineIndex.delete(key);
    }
}

function popFromLineIndexToLineIndex(){
    const lastLineIndex = lineIndexToLine.size-1;
    const lastLine = lineIndexToLine.get(lastLineIndex);
    lineIndexToLine.delete(lineIndexToLine.size-1);

    return [lastLineIndex, lastLine];
}

function getLineByVertexIndex(index) {
    return lineIndexToLine.get(vertexIndexToLineIndex.get(index));
}

export {makeLine, computeReformedLine, clear, getClosestVertex, getIndicesOfUserAddedVertices, getUserAddedLines, addToVertexIndexToLineIndex, addToLineIndexToLine, removeFromVertexIndexToLineIndex, popFromLineIndexToLineIndex, getLineByVertexIndex}
  