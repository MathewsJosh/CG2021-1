import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        InfoBox,
        onWindowResize,
        degreesToRadians,
        lightFollowingCamera} from "../libs/util/util.js";

var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var light  = initDefaultBasicLight(scene, new THREE.Vector3(7, 7, 7));
var camera = initCamera(new THREE.Vector3(0, -60, 30)); // Init camera in this position

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add(axesHelper);

// create the ground plane
var planeGeometry = new THREE.PlaneGeometry(25, 25);
planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(0, 150, 150)",
    side: THREE.DoubleSide,
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

// Iluminação sugerida em exercicios anteriores
scene.add(new THREE.HemisphereLight())
//scene.add(light);


//======================================Criação da turbina eolica================================
// Materiais da turbina
var base = new THREE.MeshPhongMaterial({color: 0xc05050, side: THREE.DoubleSide});
var metal_cinza = new THREE.MeshPhongMaterial({color: 0x595959, side: THREE.DoubleSide});
var metal_dourado = new THREE.MeshPhongMaterial({color: 0xb8860b, side: THREE.DoubleSide});
var metal_azul = new THREE.MeshToonMaterial({color: 0x0031e7, side: THREE.DoubleSide});

var baseGeometry = new THREE.BoxGeometry(5, 5, 1);
var baseMaterial = base;
var base1 = new THREE.Mesh(baseGeometry, baseMaterial);
base1.position.z = 0.5;

var torreGeometry = new THREE.CylinderGeometry(0.5, 1, 12);
var torreMaterial = metal_cinza;
var torre1 = new THREE.Mesh(torreGeometry, torreMaterial);
torre1.rotation.x = Math.PI/2;
torre1.position.z = baseGeometry.parameters.depth/2 + torreGeometry.parameters.height/2;
base1.add(torre1)

var motorGeometry = new THREE.BoxGeometry(2, 4, 2);
var motorMaterial = metal_azul;
var motor1 = new THREE.Mesh(motorGeometry, motorMaterial);
motor1.rotation.y = Math.PI/2;
motor1.rotation.x = Math.PI/2;
motor1.position.y = torreGeometry.parameters.height/2 + baseGeometry.parameters.depth;
torre1.add(motor1)

var rotatorGeometry = new THREE.ConeGeometry(1, 3);
var rotatorMaterial = metal_azul;
var rotator = new THREE.Mesh(rotatorGeometry, rotatorMaterial);
rotator.position.y = motorGeometry.parameters.depth+rotatorGeometry.parameters.height/2;
motor1.add(rotator)

var pa1Geometry = new THREE.ConeGeometry(0.6, 7);
var pa1Material = metal_dourado;
var pa1 = new THREE.Mesh(pa1Geometry, pa1Material);
pa1.rotation.z = degreesToRadians(-90);
pa1.position.x = pa1Geometry.parameters.height/2;
pa1.position.y = -0.4;
rotator.add(pa1)

var pa2Geometry = new THREE.ConeGeometry(0.6, 7);
var pa2Material = metal_dourado;
var pa2 = new THREE.Mesh(pa2Geometry, pa2Material);
pa2.rotation.z = Math.PI/2;
pa2.rotation.y = degreesToRadians(60);
pa2.position.x = -pa2Geometry.parameters.height/4;
pa2.position.z = pa2Geometry.parameters.height/2.5;
pa2.position.y = -0.4;
rotator.add(pa2)

var pa3Geometry = new THREE.ConeGeometry(0.6, 7);
var pa3Material = metal_dourado;
var pa3 = new THREE.Mesh(pa3Geometry, pa3Material);
pa3.rotation.z = Math.PI/2;
pa3.rotation.y = degreesToRadians(-60);
pa3.position.x = -pa3Geometry.parameters.height/4;
pa3.position.z = -pa2Geometry.parameters.height/2.5;
pa3.position.y = -0.4;
rotator.add(pa3)


scene.add(base1);












function rotate(){
  if (animationOn){
    rotator.rotation.y += speed;
  }
}

var animationOn = false;
var speed = 0;

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

buildInterface();
render();

function buildInterface()
{
  var controls = new function ()
  {
    this.onChangeAnimation = function(){
      animationOn = !animationOn;
      
    };

    this.speed = -0.3;

    this.changeSpeed = function(){
      speed = this.speed;
    }
  }

  // GUI interface
  var gui = new GUI();
    gui.add(controls, 'onChangeAnimation',true).name("Moving animation On/Off");
    gui.add(controls, 'speed', -0.3, 0.3)
        .onChange(function(e) { controls.changeSpeed() })
        .name("speed");
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  requestAnimationFrame(render);
  rotate();
  renderer.setClearColor("rgb(150,200,220)");
  renderer.render(scene, camera) // Render scene
}