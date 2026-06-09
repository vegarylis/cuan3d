import { Vector3 } from 'three';

/* Code taken and apdapted from the tutorial "Optimal Route Crafting: Finding the shortest path on the surface of a mesh" written by Christian Marques (https://blog.promaton.com/optimal-route-crafting-finding-the-shortest-path-on-the-surface-of-a-mesh-8e77dcaea689) */

class Node {

    constructor(index, value, edges=[]) {
        this.index = index; //Integer
        this.value = value; //Vector3
        this.edges = edges; //List of Edge
    }

}

class Edge {

    constructor(node1, node2, weight) {
        this.node1 = node1; //Node
        this.node2 = node2; //Node
        this.weight = weight; //Number
    }
}

class Graph {

    constructor(target) {
        this.adjacencyList = new Map();
        this.nodes = new Map();
        this.nodeValueToIndex = new Map();
        // target: Mesh (optional)
        if(target){
            this.target = target;
        }
    }

    clear() {
        this.nodes.clear();
        this.adjacencyList.clear();
    }

    addNode(index, value) {

        // index: int
        // value: Vector3

        if (!this.nodes.get(index)) {
            const newNode = new Node(index, value);
            this.nodes.set(index, newNode);
            this.adjacencyList.set(index, []);
        }

        // update nodeValueToIndex 
        this.nodeValueToIndex.set("" + value.x + " " + value.y + " " + value.z, index);
    }

    addEdge(index1, index2, weight = 1) {

        // index1: Integer
        // index2: Integer, 
        // weight: Number

        const node1 = this.nodes.get(index1);
        const node2 = this.nodes.get(index2);

        if (!node1 || !node2) {
            throw "Node not found";
        }

        const newEdge = new Edge(node1, node2, weight);
        node1.edges.push(newEdge);
        node2.edges.push(newEdge);

        if (!this.adjacencyList.get(index1)) {
            this.adjacencyList.set(index1, []);
        }
        if (!this.adjacencyList.get(index2)) {
            this.adjacencyList.set(index2, []);
        }

        this.adjacencyList.get(index1).push(index2);
        this.adjacencyList.get(index2).push(index1);
    }

    computeGraph() {

        if (!this.target) {
            return
        }
         
        const positions = this.target.geometry.getAttribute("position");
        const indices = this.target.geometry.index;

        if(!indices) {
            throw "Mesh geometry is not indexed. Can only compute indexed geometries."
        }
         
        let vertex; // Vector3
        const addedEdges = new Set();

        const offset = positions.itemSize;

        // Add nodes to the graph
        for (let i=0; i<positions.count; i++) {

            vertex = new Vector3(positions.array[i*offset], positions.array[(i*offset)+1], positions.array[(i*offset)+2]); 
            // apply matrix of this.target to vertex
            vertex.applyMatrix4(this.target.matrix);
            this.addNode(i, vertex.clone());
        }

        let weightAB, weightBC, weightCA;

        console.log("done with adding nodes");

        // Add edges to the graph
        for (let i=0; i<indices.count; i=i+3) { 

            const indexA = indices.array[i];
            const indexB = indices.array[i+1];
            const indexC = indices.array[i+2];

            const edgeAB = Math.min(indexA, indexB) + "-" + Math.max(indexA, indexB);
            const edgeBC = Math.min(indexB, indexC) + "-" + Math.max(indexB, indexC);
            const edgeCA = Math.min(indexC, indexA) + "-" + Math.max(indexC, indexA);

            if (!addedEdges.has(edgeAB)) {

                // calculate distance between nodes at indexA and indexB
                weightAB = new Vector3(positions.array[indexA*offset], positions.array[(indexA*offset)+1], positions.array[(indexA*offset)+2]).distanceTo(new Vector3(positions.array[indexB*offset], positions.array[(indexB*offset)+1], positions.array[(indexB*offset)+2]));
                this.addEdge(indexA, indexB, weightAB);
                addedEdges.add(edgeAB);

            }

            if (!addedEdges.has(edgeBC)) {

                // calculate distance between nodes at indexB and indexC
                weightBC = new Vector3(positions.array[indexB*offset], positions.array[(indexB*offset)+1], positions.array[(indexB*offset)+2]).distanceTo(new Vector3(positions.array[indexC*offset], positions.array[(indexC*offset)+1], positions.array[(indexC*offset)+2]));
                this.addEdge(indexB, indexC, weightBC);
                addedEdges.add(edgeBC);
                
            }

            if (!addedEdges.has(edgeCA)) {

                // calculate distance between nodes at indexC and indexA
                weightCA = new Vector3(positions.array[indexC*offset], positions.array[(indexC*offset)+1], positions.array[(indexC*offset)+2]).distanceTo(new Vector3(positions.array[indexA*offset], positions.array[(indexA*offset)+1], positions.array[(indexA*offset)+2]));
                this.addEdge(indexC, indexA, weightCA);
                addedEdges.add(edgeCA);
                
            }

        }

        console.log("done with adding edges");
        console.log("done with computing graph");

    }

}

export default class PriorityQueue {

    constructor () {
        this.elements = [];
    }

    enqueue(node, priority) {
        this.elements.push({"node":node, "priority": priority});
        this.bubbleUp(this.elements.length - 1);
    }

    /* TODO: check for endless while-loops */

    dequeue() {
        const first = this.elements[0];
        const last = this.elements.pop();
        if (this.elements.length > 0) {
            this.elements[0] = last;
            this.bubbleDown(0);
        }

        return first.node
    }

    isEmpty() {
        return (this.elements.length == 0);
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.elements[parentIndex].priority <= this.elements[index].priority){
                break;
            }
            // swap elements[parentIndex] with elements[index]
            const temp = this.elements[parentIndex];
            this.elements[parentIndex] = this.elements[index];
            this.elements[index] = temp;
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        
        const length = this.elements.length;
        const element = this.elements[index];

        let swapIndex = null;
        let leftChildIndex, rightChildIndex;

        do {
            swapIndex = null;
            leftChildIndex = 2 * index + 1;
            rightChildIndex = 2 * index + 2;

            if (leftChildIndex < length && this.elements[leftChildIndex].priority < element.priority) {
                swapIndex = leftChildIndex;
            }

            if (rightChildIndex < length) {
                if (!swapIndex && this.elements[rightChildIndex].priority < element.priority) {
                    swapIndex = rightChildIndex;
                }
                else if (!swapIndex && this.elements[rightChildIndex].priority < this.elements[leftChildIndex].priority){
                    swapIndex = rightChildIndex;
                }
            }

            if (swapIndex !== null) {
                this.elements[index] = this.elements[swapIndex];
                this.elements[swapIndex] = element;
                index = swapIndex;
            }
        }
        while (swapIndex !== null);
    }
}

export {Graph}
