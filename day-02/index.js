import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from './src/getStarfield.js';
import {getFresnelMat} from './src/getFresnelMat.js';

const width = window.innerWidth;
const height = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = width / height;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 12;
controls.enableDamping = true;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);

const loader = new THREE.TextureLoader();

const geometry = new THREE.IcosahedronGeometry(2, 16);

const earthMaterial = new THREE.MeshStandardMaterial({
  map: loader.load('./textures/compressed/2k_earth_daymap.jpg'),
  normalMap: loader.load('./textures/compressed/2k_earth_normal_map.jpg'),
  metalnessMap: loader.load('./textures/compressed/2k_earth_specular_soft.jpg'),
  metalness: 1,
  roughness: 0.7

});
earthMaterial.map.colorSpace = THREE.SRGBColorSpace;

const earthMesh = new THREE.Mesh(geometry, earthMaterial);
earthGroup.add(earthMesh);

const lightMaterial = new THREE.MeshBasicMaterial({
    map: loader.load('./textures/compressed/2k_earth_nightmap.jpg'),
    blending: THREE.AdditiveBlending,
});
lightMaterial.map.colorSpace = THREE.SRGBColorSpace;

const lightMesh = new THREE.Mesh(geometry, lightMaterial);
lightMesh.scale.setScalar(1.001);
earthGroup.add(lightMesh);

const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
    alphaMap: loader.load('./textures/compressed/2k_earth_clouds.jpg'),
    transparent: true,
});

const cloudMesh = new THREE.Mesh(geometry, cloudMaterial);
cloudMesh.scale.setScalar(1.002);
earthGroup.add(cloudMesh);

const fresnelMaterial = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMaterial);
glowMesh.scale.setScalar(1.003);
earthGroup.add(glowMesh);

const stars = getStarfield({ numStars: 10000 });
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  earthMesh.rotation.y += 0.002;
  lightMesh.rotation.y += 0.002;
  cloudMesh.rotation.y += 0.0023;
  glowMesh.rotation.y += 0.002;
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);