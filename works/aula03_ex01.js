import * as THREE from '../build/three.module.js';
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer,
        onWindowResize,
        createGroundPlaneWired,
        degreesToRadians} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils

// Painel de FPS
function createStats() {
  stats.setMode(0);
  
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0';
  stats.domElement.style.top = '0';

  return stats;
}
// To show FPS
stats = createStats();
document.body.appendChild( stats.domElement );

// Main camera
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.lookAt(0, 0, 0);
camera.position.set(0.0, 2.0, 0.0);
camera.up.set(0, 1, 0);

// CameraHolder pedido no exercicio
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0.0, 2.0, 0.0);
cameraHolder.lookAt(0, 0, 0);
cameraHolder.up.set(0, 1, 0);
scene.add(cameraHolder);
cameraHolder.add(camera);

var keyboard = new KeyboardState();

// WiredPlane pedido no exercicio
var groundPlane = createGroundPlaneWired(50, 50, 100, 100); // width, height
scene.add(groundPlane);

// Iluminação pedida no exercicio
scene.add(new THREE.HemisphereLight())

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();

function keyboardUpdate() {

  keyboard.update();
  var angle = degreesToRadians(0.3);
  var rotX = new THREE.Vector3(1, 0, 0); // Set X axis
  var rotY = new THREE.Vector3(0, 1, 0); // Set Y axis
  var rotZ = new THREE.Vector3(0, 0, 1); // Set Z axis

  //Rotaciona em X
  if (keyboard.pressed("up")) cameraHolder.rotateOnAxis(rotX, angle);
  if (keyboard.pressed("down")) cameraHolder.rotateOnAxis(rotX, -angle);
  //Rotaciona em Y
  if (keyboard.pressed(",")) cameraHolder.rotateOnAxis(rotY, -angle);
  if (keyboard.pressed(".")) cameraHolder.rotateOnAxis(rotY, angle);
  //Rotaciona em Z
  if (keyboard.pressed("left")) cameraHolder.rotateOnAxis(rotZ, -angle);
  if (keyboard.pressed("right")) cameraHolder.rotateOnAxis(rotZ, angle);

  // Translada
  if (keyboard.pressed("space")) cameraHolder.translateY(-0.03) //translateZ(0.2);
  if (keyboard.pressed("C")) cameraHolder.translateY (+0.03) //translateZ(0.2);
}


function render() {
  requestAnimationFrame(render); // Show events
  //trackballControls.update();
  keyboardUpdate();
  //renderer.setClearColor("rgb(32,219,217)");
  renderer.clear(); // Clean the window
  renderer.render(scene, camera) // Render scene
}