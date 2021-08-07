import * as THREE from "../build/three.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import { GUI } from "../build/jsm/libs/dat.gui.module.js";
import { TrackballControls } from "../build/jsm/controls/TrackballControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  initRenderer,
  onWindowResize,
  initDefaultBasicLight,
} from "../libs/util/util.js";

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information

var renderer = initRenderer(); // View function in util/utils
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0, 0, 0);
camera.position.set(10, 10, -10);
camera.up.set(0, 1, 0);

var light = initDefaultBasicLight(scene, true, new THREE.Vector3(100, 100, -100));
var ambientColor = "rgb(50,50,50)";
var ambientLight = new THREE.AmbientLight(ambientColor);
scene.add(ambientLight);


// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);

// Painel de FPS
function createStats() {
  stats.setMode(0);

  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0";
  stats.domElement.style.top = "0";

  return stats;
}
// To show FPS
stats = createStats();
document.body.appendChild(stats.domElement);

// Listen window size changes
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);


// Creating all planes of the cube
var planeGeometry = new THREE.PlaneGeometry(4.0, 4.0, 10, 10);
var planeMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,255,255)", side: THREE.DoubleSide });
var upPlane = new THREE.Mesh(planeGeometry, planeMaterial);
var downPlane = new THREE.Mesh(planeGeometry, planeMaterial);
var leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
var rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
var frontPlane = new THREE.Mesh(planeGeometry, planeMaterial);

// Positioning them on the scene
upPlane.translateZ(2)
upPlane.translateY(2)
upPlane.rotateX(Math.PI / 2)

leftPlane.rotateY(Math.PI / 2)
leftPlane.translateZ(-2)
leftPlane.translateX(-2)

rightPlane.rotateY(Math.PI / 2)
rightPlane.translateZ(2)
rightPlane.translateX(-2)

frontPlane.rotateX(Math.PI / 2)
frontPlane.translateY(2)
frontPlane.translateZ(2)

//-- Use TextureLoader to load texture files
var textureLoader = new THREE.TextureLoader();
var floor = textureLoader.load('../assets/textures/marble.png');

// Apply texture to the 'map' property of the planes
upPlane.material.map = floor;
upPlane.material.map.repeat.set(5, 5);
upPlane.material.map.wrapS = THREE.RepeatWrapping;
upPlane.material.map.wrapT = THREE.RepeatWrapping;
/*
upPlane.material.map.minFilter = THREE.LinearFilter;
upPlane.material.map.magFilter = THREE.LinearFilter;
*/

var cubo = new THREE.Group();
cubo.add(upPlane)
cubo.add(downPlane)
cubo.add(leftPlane)
cubo.add(rightPlane)
cubo.add(frontPlane)
scene.add(cubo)




var rotateCube = false;
function rotacionaCubo() {
  if (rotateCube) {
    cubo.rotateY(0.005)
  }
}

buildInterface();
render();
function buildInterface() {
  var controls = new (function () {
    this.speed = 0.0;
    this.onRed = true;
    this.onGreen = true;
    this.onBlue = true;
    this.rotateCube = false;

    this.onChangeAnimation = function () {
      rotateCube = !rotateCube;
    };
  })();

  // GUI interface
  var gui = new GUI();
  gui
    .add(controls, "onChangeAnimation", true)
    .name("Rotate On/Off");
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
renderer.setClearColor("rgb(30, 30, 42)");
function render() {
  stats.update();
  trackballControls.update();

  rotacionaCubo()
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
