import * as THREE from '../libs/other/three.module.r82.js';
import { RaytracingRenderer } from '../libs/other/raytracingRenderer.js';

var scene, renderer;

var container = document.createElement('div');
document.body.appendChild(container);

var scene = new THREE.Scene();

// The canvas is in the XY plane.
// Hint: put the camera in the positive side of the Z axis and the
// objects in the negative side
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
/*
console.log("Heigh: " + window.innerHeight)
console.log("Width: " + window.innerWidth)
console.log("Ratio: " + window.innerHeight / window.innerWidth)
console.log("Ratio: " + window.innerWidth / window.innerHeight)
*/
camera.aspect = 2;
console.log(camera.aspect)
camera.position.z = 5;
camera.position.y = 2.5;

// light
var intensity = 0.5;
var light = new THREE.PointLight(0xffffff, intensity);
light.position.set(0, 3.50, 0);
scene.add(light);

var light = new THREE.PointLight(0x55aaff, intensity);
light.position.set(-1.00, 2.50, 2.00);
scene.add(light);

var light = new THREE.PointLight(0xffffff, intensity);
light.position.set(1.00, 2.50, 2.00);
scene.add(light);

renderer = new RaytracingRenderer(window.innerWidth, window.innerHeight, 32, camera);
container.appendChild(renderer.domElement);

// Materiais do plano
var baseMaterial = new THREE.MeshLambertMaterial({
	color: "rgb(150,190,220)",
});

var phongMaterialBox = new THREE.MeshLambertMaterial({
	color: "rgb(255,255,255)",
});

var phongMaterialBoxBottom = new THREE.MeshLambertMaterial({
	color: "rgb(180,180,180)",
});

var phongMaterialBoxLeft = new THREE.MeshLambertMaterial({
	color: "rgb(42, 103, 189)",
});

var phongMaterialBoxRight = new THREE.MeshLambertMaterial({
	color: "rgb(42, 103, 189)",
});

// Definindo o plano:
var planeGeometry = new THREE.BoxGeometry(6.00, 0.05, 3.00);
var planeGeometry2 = new THREE.BoxGeometry(3.00, 0.05, 6.00);

// bottom
var plane = new THREE.Mesh(planeGeometry, phongMaterialBoxBottom);
plane.position.set(0, 1, -1.50);
scene.add(plane);

// top
var plane = new THREE.Mesh(planeGeometry, phongMaterialBox);
plane.position.set(0, 4, -1.50);
scene.add(plane);

// back
var plane = new THREE.Mesh(planeGeometry, phongMaterialBox);
plane.rotation.x = 1.57;
plane.position.set(0, 2.50, -3.00);
scene.add(plane);

// left
var plane = new THREE.Mesh(planeGeometry2, phongMaterialBoxLeft);
plane.rotation.z = 1.57;
plane.position.set(-3.00, 2.50, -3.00)
scene.add(plane);

// right
var plane = new THREE.Mesh(planeGeometry2, phongMaterialBoxRight);
plane.rotation.z = 1.57;
plane.position.set(3.00, 2.50, -3.00)
scene.add(plane);


// Materiais
var douradoMaterial = new THREE.MeshPhongMaterial({
	color: "rgb(255, 179, 0)",
	specular: "rgb(255,255,255)",
	shininess: 1000
})
douradoMaterial.mirror = true;
douradoMaterial.reflectivity = 0.1;

var vermeiMaterial = new THREE.MeshPhongMaterial({
	color: "rgb(214, 0, 0)",
	specular: "rgb(255,255,255)",
	shininess: 1000
})
vermeiMaterial.mirror = true;
vermeiMaterial.reflectivity = 0.1;

var mirrorMaterial = new THREE.MeshPhongMaterial({
	color: "rgb(0,0,0)",
	specular: "rgb(255,255,255)",
	shininess: 1000,
});
mirrorMaterial.mirror = true;
mirrorMaterial.reflectivity = 1;

// Geometrias
var sphereGeometry = new THREE.SphereGeometry(1, 24, 24);
var CylGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 80);
var CylGeometry2 = new THREE.CylinderGeometry(0.5, 0.1, 0.8, 80);
var torusGeometry = new THREE.TorusKnotGeometry(4, 1.2);

var cyl1 = new THREE.Mesh(CylGeometry, baseMaterial);
var cyl2 = new THREE.Mesh(CylGeometry, baseMaterial);
var cyl3 = new THREE.Mesh(CylGeometry, baseMaterial);
cyl1.position.set(-2., 1.5, -0.75);
cyl2.position.set(0, 1.5, -1.5);
cyl3.position.set(2, 1.5, -0.75);
scene.add(cyl1)
scene.add(cyl2)
scene.add(cyl3)

var torus = new THREE.Mesh(torusGeometry, douradoMaterial);
torus.scale.multiplyScalar(0.05);
torus.position.set(-2, 2.3, -0.75);
scene.add(torus)

var sphere = new THREE.Mesh(sphereGeometry, mirrorMaterial);
sphere.scale.multiplyScalar(0.5);
sphere.position.set(0, 2.5, -1.5);
scene.add(sphere);

var vaso = new THREE.Mesh(CylGeometry2, vermeiMaterial);
vaso.position.set(2, 2.3, -0.75);
scene.add(vaso);

render();

function render() {
	renderer.render(scene, camera);
}
