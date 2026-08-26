import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

const width = window.innerWidth;
const height = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = width / height;
const near = 0.1;
const far = 10;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2.5;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x444444);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 1.5;
controls.maxDistance = 5;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const geometry = new THREE.IcosahedronGeometry(1.0, 2);
const material = new THREE.MeshStandardMaterial({
    color: 0xe62510,
    flatShading: true,
    roughness: 0.39,
    metalness: 0.1
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xf76640,
    wireframe: true,
    transparent: true,
    opacity: .5
});

const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
wireframeMesh.scale.setScalar(1.001);
mesh.add(wireframeMesh);

const spotLight = new THREE.SpotLight(0xffffff, 20, 10, Math.PI / 5, 0.4, 2);
spotLight.position.set(2, 3, 3);
scene.add(spotLight);

// const spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

// scene.add(new THREE.AxesHelper(5));
// scene.add(new THREE.GridHelper(10, 10));

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xc6c6c6, 0.4);
scene.add(hemisphereLight);

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.001;
  mesh.rotation.y += 0.001;
  spotLight.position.x = Math.sin(Date.now() * 0.001) * 3;
  spotLight.position.y = Math.cos(Date.now() * 0.001) * 3;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);