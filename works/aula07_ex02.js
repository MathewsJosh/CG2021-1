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

var cylinGeometry = new THREE.CylinderGeometry(1, 1, 4, 30, 10, true);
var cylinMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,255,255)", side: THREE.DoubleSide });
var cylin = new THREE.Mesh(cylinGeometry, cylinMaterial);


var circleGeometry = new THREE.CircleGeometry(cylinGeometry.parameters.radiusTop, 30);
var circleMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,255,255)", side: THREE.DoubleSide });
var circle1 = new THREE.Mesh(circleGeometry, circleMaterial);
var circle2 = new THREE.Mesh(circleGeometry, circleMaterial);
circle1.rotateX(Math.PI / 2)
circle1.position.y = -cylinGeometry.parameters.height / 2;
circle2.rotateX(Math.PI / 2)
circle2.position.y = cylinGeometry.parameters.height / 2;


//-- Use TextureLoader to load texture files
var textureLoader = new THREE.TextureLoader();
var madeiraLateral = textureLoader.load('../assets/textures/wood.png');
var madeiraTopos = textureLoader.load('../assets/textures/woodtop.png');

// Apply texture to the 'map' property of the planes
cylin.material.map = madeiraLateral;
cylin.material.map.repeat.set(1, 1);
cylin.material.map.wrapS = THREE.RepeatWrapping;
cylin.material.map.wrapT = THREE.RepeatWrapping;
cylin.material.map.minFilter = THREE.LinearFilter;
cylin.material.map.magFilter = THREE.LinearFilter;

circle1.material.map = madeiraTopos;
circle1.material.map.repeat.set(1, 1);
circle1.material.map.wrapS = THREE.RepeatWrapping;
circle1.material.map.wrapT = THREE.RepeatWrapping;
circle1.material.map.minFilter = THREE.LinearFilter;
circle1.material.map.magFilter = THREE.LinearFilter;

//Create a group to rotate the entire wood
var madeira = new THREE.Group();
madeira.add(cylin)
madeira.add(circle1)
madeira.add(circle2)
scene.add(madeira)


var rotateMadeira = false;
function rotacionamadeira() {
  if (rotateMadeira) {
    madeira.rotateY(0.01)
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
    this.rotateMadeira = false;

    this.onChangeAnimation = function () {
      rotateMadeira = !rotateMadeira;
    };
  })();

  // GUI interface
  var gui = new GUI();
  gui
    .add(controls, "onChangeAnimation", true)
    .name("Rotate On/Off");
}

renderer.setClearColor("rgb(30, 30, 42)");
function render() {
  stats.update();
  trackballControls.update();

  rotacionamadeira()
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
