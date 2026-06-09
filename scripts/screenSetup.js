import * as THREE from 'three'
import * as loader from './loader.js';
import * as data from './data.js';

let scene, camera, renderer, controls;

let container = document.getElementById("mainWindow"); // contains the part of the screen where the scene shall be rendered

function init(){

    // scene
    scene = new THREE.Scene(); 
    scene.background = new THREE.Color(0xffffff);
    data.setScene(scene); // set scene in data (so that other modules can easily access it)

    // camera
    camera = new THREE.PerspectiveCamera(30,  container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 100);
    data.setCamera(camera); // set camera in data (so that other modules can easily access it)

    // renderer
    const canvas = document.querySelector('#c'); // canvas in index.html to be connected with renderer
    renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.setSize(container.clientWidth, container.clientHeight);  
    container.appendChild(renderer.domElement);
    data.setRenderer(renderer);

    // camera movement 
    data.createControls();

    // light
    const lightFront = new THREE.DirectionalLight(0xFFFFFF, 2);
    lightFront.position.set(0,0,0);
    camera.add(lightFront);
    scene.add(camera);

    // set event listener to rescale mainWindow if window gets resized
    window.addEventListener('resize', onWindowResize, false);
    
    // load 3D model (ply-file)
    loader.loadModel('./resources/models/HS_1174_HeiCuBeDa_GigaMesh.ply', 'HS_1174_HeiCuBeDa_GigaMesh.ply');
    // loader.loadModel('https://heidicon.ub.uni-heidelberg.de/eas/partitions/3/0/583000/583054/a5e951f784a1da028677f56675eab4b14633a29e/application/x-ply/HS_2015_HeiCuBeDa_GigaMesh.ply', 'https://heidicon.ub.uni-heidelberg.de/eas/partitions/3/0/583000/583054/a5e951f784a1da028677f56675eab4b14633a29e/application/x-ply/HS_2015_HeiCuBeDa_GigaMesh.ply');

    // load annotations for 3D model
    loader.loadAnnotation('./resources/annotations/annojson_1174.json');

    animate();

}

/* Renders scene in a loop */
function animate() {

    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}

/* Resizes stone when resizing window */
function onWindowResize() {
    const camera = data.getCamera();
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

export {init}