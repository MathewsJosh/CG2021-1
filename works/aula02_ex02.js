import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {gui, GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        initDefaultLighting,
        onWindowResize, 
        degreesToRadians, 
        lightFollowingCamera} from "../libs/util/util.js";

        
var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(20, 20, 20)); // Init camera in this position
var light  = initDefaultLighting(scene, new THREE.Vector3(7, 7, 7));
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Set angles of rotation
//var angle = [-1.57, 0, 0, 0, 0, 0, 0, 0, 0]; // In degreesToRadians
var angulo_C1 = [0,0,degreesToRadians(270)]
var angulo_C2 = [0,0,0]
var angulo_C3 = [0,0,0]

// Show world axes
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

var s1 = createSphere();
scene.add(s1);

var c1 = createCylinder();
s1.add(c1);

var s2 = createSphere();
c1.add(s2);

var c2 = createCylinder();
s2.add(c2);

// Novo Braço
var s3 = createSphere();
c2.add(s3);

var c3 = createCylinder();
s3.add(c3);


// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

buildInterface();
render();

function createSphere()
{
  var sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  var sphereMaterial = new THREE.MeshPhongMaterial( {color:'rgb(180,180,255)'} );
  var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  return sphere;
}

function createCylinder()
{
  var cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.0, 25);
  var cylinderMaterial = new THREE.MeshPhongMaterial( {color:'rgb(100,255,100)'} );
  var cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
  return cylinder;
}

function rotateCylinder()
{
  // More info:
  // https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
  c1.matrixAutoUpdate = false;
  s2.matrixAutoUpdate = false;
  c2.matrixAutoUpdate = false;
  
  // Novo Braço
  s3.matrixAutoUpdate = false;
  c3.matrixAutoUpdate = false;


  var mat4 = new THREE.Matrix4();

  // resetting matrices
  c1.matrix.identity();
  s2.matrix.identity();
  c2.matrix.identity();

  // Resetando novo braço
  s3.matrix.identity();
  c3.matrix.identity();

  // Will execute T1 and then R1, R2 e R3
  c1.matrix.multiply(mat4.makeRotationX(angulo_C1[0])); // R1
  c1.matrix.multiply(mat4.makeRotationY(angulo_C1[1])); // R2
  c1.matrix.multiply(mat4.makeRotationZ(angulo_C1[2])); // R3
  c1.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T1
  
  // Just need to translate the sphere to the right position
  s2.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0));

  // Will execute T2 and then R2
  c2.matrix.multiply(mat4.makeRotationX(angulo_C2[0])); // R1
  c2.matrix.multiply(mat4.makeRotationY(angulo_C2[1])); // R2
  c2.matrix.multiply(mat4.makeRotationZ(angulo_C2[2])); // R3
  c2.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T2

  // Executa translação e multiplicação do novo braço
  s3.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0));
  c3.matrix.multiply(mat4.makeRotationX(angulo_C3[0])); // R1
  c3.matrix.multiply(mat4.makeRotationY(angulo_C3[1])); // R2
  c3.matrix.multiply(mat4.makeRotationZ(angulo_C3[2])); // R3
  c3.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T2

}

function buildInterface()
{
  var controls = new function ()
  {
    //Eixos X
    this.joint1 = 0;
    this.joint2 = 0;
    this.joint3 = 0;

    //Eixos Y
    this.joint4 = 0;
    this.joint5 = 0;
    this.joint6 = 0;

    //Eixos Z
    this.joint7 = 270;
    this.joint8 = 0;
    this.joint9 = 0;
    

    this.rotate = function(){
      angulo_C1[0] = degreesToRadians(this.joint1);
      angulo_C1[1] = degreesToRadians(this.joint4);
      angulo_C1[2] = degreesToRadians(this.joint7);

      angulo_C2[0] = degreesToRadians(this.joint2);
      angulo_C2[1] = degreesToRadians(this.joint5);
      angulo_C2[2] = degreesToRadians(this.joint8);

      angulo_C3[0] = degreesToRadians(this.joint3);
      angulo_C3[1] = degreesToRadians(this.joint6);
      angulo_C3[2] = degreesToRadians(this.joint9);

      rotateCylinder();
    };
  };

  // GUI interface
  var gui = new GUI();
  var folderX = gui.addFolder( 'Eixo X' );
  
  folderX.add(controls, 'joint1', 0, 360)
  .onChange(function(e) { controls.rotate() })
  .name("First Joint");
  folderX.add(controls, 'joint2', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Second Joint");
  folderX.add(controls, 'joint3', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Third Joint");
  folderX.open();

  var gui = new GUI();
  var folderY = gui.addFolder( 'Eixo Y' );
  
  folderY.add(controls, 'joint4', 0, 360)
  .onChange(function(e) { controls.rotate() })
  .name("First Joint");
  folderY.add(controls, 'joint5', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Second Joint");
  folderY.add(controls, 'joint6', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Third Joint");
  folderY.open();

  var gui = new GUI();
  var folderZ = gui.addFolder( 'Eixo Z' );
  
  folderZ.add(controls, 'joint7', 0, 360)
  .onChange(function(e) { controls.rotate() })
  .name("First Joint");
  folderZ.add(controls, 'joint8', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Second Joint");
  folderZ.add(controls, 'joint9', -170, 170)
  .onChange(function(e) { controls.rotate() })
  .name("Third Joint");
  folderZ.open();
  
}



function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  rotateCylinder();
  lightFollowingCamera(light, camera);
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
