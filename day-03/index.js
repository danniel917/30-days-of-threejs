import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const width = window.innerWidth;
const height = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = width / height;
const near = 0.01;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
const bgColor = 0xffa200;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(bgColor, 0.2);
scene.background = new THREE.Color(bgColor);
scene.add(camera);

// Create a closed wavey loop
const curve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-10, 0, 10),
    new THREE.Vector3(-5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, -5, 5),
    new THREE.Vector3(10, 0, 10),
  ],
  true,
);
const points = curve.getPoints(100);
const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
const pointsMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
// Create the final object to add to the scene
const curveObject = new THREE.Line(pointsGeometry, pointsMaterial);
// scene.add(curveObject);

const TUBULAR = 222;
const RADIAL = 16;

const tubeGeometry = new THREE.TubeGeometry(curve, TUBULAR, 1, RADIAL, true);
const tubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e1e24,
  // wireframe: true,
  side: THREE.BackSide,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
  roughness: 0.8,
  metalness: 0.1,
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

// Build only the rings and the lengthwise lines, skipping the triangle diagonals
function buildTubeGrid(geo, tubular, radial) {
  const pos = geo.attributes.position;
  const verts = [];
  const idx = (i, j) => i * (radial + 1) + j;
  const push = (a, b) => {
    verts.push(pos.getX(a), pos.getY(a), pos.getZ(a));
    verts.push(pos.getX(b), pos.getY(b), pos.getZ(b));
  };
  for (let i = 0; i <= tubular; i++) {
    for (let j = 0; j < radial; j++) {
      push(idx(i, j), idx(i, j + 1));
      if (i < tubular) push(idx(i, j), idx(i + 1, j));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

const gridGeometry = buildTubeGrid(tubeGeometry, TUBULAR, RADIAL);

const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1e1e24 });
const line = new THREE.LineSegments(gridGeometry, lineMaterial);
scene.add(line);

const spotLight = new THREE.SpotLight(0xffa200, 8, 1.5, Math.PI / 12, 0.2, 1);
camera.add(spotLight);
camera.add(spotLight.target);
spotLight.target.position.set(0, 0, -1);
const boxes = [];
const numBoxes = 25;
const boxSize = 0.035;
const FADE_NEAR = 0.05;
const FADE_FAR = 0.35;

const shapes = [
  new THREE.BoxGeometry(boxSize, boxSize, boxSize),
  new THREE.IcosahedronGeometry(boxSize, 0),
  new THREE.TetrahedronGeometry(boxSize),
  new THREE.OctahedronGeometry(boxSize),
  new THREE.TorusGeometry(boxSize, boxSize * 0.4, 8, 12),
];

for (let index = 0; index < numBoxes; index++) {
  const progress = (index / numBoxes + Math.random() * 0.1) % 1;
  const position = curve.getPointAt(progress);
  position.x += Math.random() - 0.4;
  position.z += Math.random() - 0.4;

  const rotation = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );

  // const color = new THREE.Color().setHSL(0.7 - progress, 1, 0.5);
  const color = new THREE.Color(0xffffff);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
  });

  const geometry = shapes[Math.floor(Math.random() * shapes.length)];
  const box = new THREE.Mesh(geometry, boxMaterial);
  box.position.copy(position);
  box.rotation.set(rotation.x, rotation.y, rotation.z);
  scene.add(box);
  boxes.push(box);
}

function updateCameraPosition() {
  const time = performance.now() * 0.00002;
  const t = time % 1;
  const pos = curve.getPointAt(t);
  const lookAt = curve.getPointAt((t + 0.03) % 1);
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate() {
  requestAnimationFrame(animate);
  updateCameraPosition();
  boxes.forEach((box) => {
    box.rotation.x += 0.02;
    box.rotation.y += 0.02;
    const distance = camera.position.distanceTo(box.position);
    box.material.opacity = THREE.MathUtils.smoothstep(
      distance,
      FADE_NEAR,
      FADE_FAR,
    );
  });
  renderer.render(scene, camera);
}

animate();

window.addEventListener(
  "resize",
  function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false,
);
