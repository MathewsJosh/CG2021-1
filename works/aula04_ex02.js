import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        InfoBox,
        onWindowResize,
        lightFollowingCamera} from "../libs/util/util.js";

var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var light  = initDefaultBasicLight(scene, new THREE.Vector3(7, 7, 7));
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.lookAt(0,0,0);
camera.position.set(0, -40, 20);
camera.up.set(0, 1, 0);

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add(axesHelper);

// create the ground plane
var planeGeometry = new THREE.PlaneGeometry(25, 25);
planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(150, 150, 150)",
    side: THREE.DoubleSide,
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

// Adicionando uma esfera
const sphere_geometry = new THREE.SphereGeometry(1, 32, 32);                        // Geometria da esfera
const sphere_material = new THREE.MeshBasicMaterial({color: "rgba(20, 150, 20)"});   // Material da esfera      cor:  {color: "#5ad5ed"} 
const sphere = new THREE.Mesh(sphere_geometry, sphere_material);                    // Cria o "objeto" esfera?
sphere.position.set(10.0, -10.0, 1.0);                                              // Posiciona da esfera
scene.add(sphere); 

// Iluminação sugerida em exercicios anteriores
scene.add(new THREE.HemisphereLight())
scene.add(light);

// Set angles of rotation
var posX = 10.0;
var posY = -10.0;
var posZ = 1.0;
var animationOn = false; // control if animation is on or of

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Enable Shadows in the Renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

buildInterface();
render();

function moverBola()
{
  sphere.rotation.x += 3;
  if(animationOn)
  {
    var velocidade = 0.05;

    // Move em X
    if (sphere.position.x > posX)
    {
      sphere.position.x -= velocidade;
    }
    if (sphere.position.x < posX)
    {
      sphere.position.x += velocidade;
    }

    // Move em Y
    if (sphere.position.y < posY)
    {
      sphere.position.y += velocidade;
    }
    if (sphere.position.y > posY)
    {
      sphere.position.y -= velocidade;
    }

    // Move em Z
    if (sphere.position.z < posZ)
    {
      sphere.position.z += velocidade;
    }
    if (sphere.position.z > posZ)
    {
      sphere.position.z -= velocidade;
    }
  }
}

function buildInterface()
{
  var controls = new function ()
  {
    this.onChangeAnimation = function(){
      animationOn = !animationOn;
      moverBola(this.posX, this.posY, this.poxZ);
    };
    this.posX = 10.0
    this.posY = -10.0;
    this.posZ = 1.0;

    this.changeX = function(){
        posX = this.posX;
    };
    this.changeY = function(){
        posY = this.posY;
    };
    this.changeZ = function(){
        posZ = this.posZ;
    };
  };

  // GUI interface
  var gui = new GUI();
    gui.add(controls, 'onChangeAnimation',true).name("Moving animation On/Off");
    gui.add(controls, 'posX', -10.0, 10.0)
        .onChange(function(e) { controls.changeX() })
        .name("X");
    gui.add(controls, 'posY', -10.0, 10.0)
        .onChange(function(e) { controls.changeY() })
        .name("Y");
    gui.add(controls, 'posZ', 1.0, 10.0)
        .onChange(function(e) { controls.changeZ() })
        .name("Z");
}



function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  moverBola()
  requestAnimationFrame(render);
  renderer.setClearColor("rgb(150,200,220)");
  renderer.render(scene, camera) // Render scene
}