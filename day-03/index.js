// ============================================================================
// DAY 03 - Tunnel flythrough along a spline
// ============================================================================
// A curve is a path in space, not something you can see. To make it visible
// you either sample points off it (a Line) or extrude a shape along it
// (a Tube). Here we do both, then fly the camera down the middle.
//
// Key idea: one curve drives three separate things - the tunnel walls, where
// the floating shapes sit, and where the camera is on every frame.
// Manual: https://threejs.org/manual/#en/custom-buffergeometry
// ============================================================================

import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const width = window.innerWidth;
const height = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = width / height;
// Anything closer than 'near' is clipped away. Kept low because the camera
// flies right past the floating shapes.
const near = 0.01;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
const bgColor = 0xffa200;
const scene = new THREE.Scene();

// FogExp2 fades distant surfaces into a colour, thickening exponentially with
// distance. Matching it to the background hides where the tunnel ends.
// https://threejs.org/docs/#api/en/scenes/FogExp2
scene.fog = new THREE.FogExp2(bgColor, 0.2);
scene.background = new THREE.Color(bgColor);

// A light is parented to the camera further down. Children only render if
// their parent is in the scene graph, so the camera itself must be added.
scene.add(camera);

// CatmullRomCurve3 runs a smooth 3D curve through the points you give it.
// (SplineCurve is the 2D version and takes Vector2 - it cannot make a tunnel.)
// The second argument closes the loop, so the flythrough never hits an end.
// https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3
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

// The curve sampled as a thin line - useful for checking the path shape, but
// it runs dead centre through the tunnel so it stays switched off.
// https://threejs.org/docs/#api/en/core/BufferGeometry.setFromPoints
const points = curve.getPoints(100);
const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
const pointsMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const curveObject = new THREE.Line(pointsGeometry, pointsMaterial);
// scene.add(curveObject);

// TUBULAR = slices along the length, so how many rings. RADIAL = sides of the
// circular cross-section, so how many lengthwise lines and how round it looks.
const TUBULAR = 222;
const RADIAL = 16;

// TubeGeometry sweeps a circle along the curve.
// Args: path, tubularSegments, radius, radialSegments, closed.
// https://threejs.org/docs/#api/en/geometries/TubeGeometry
const tubeGeometry = new THREE.TubeGeometry(curve, TUBULAR, 1, RADIAL, true);
const tubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e1e24,
  // wireframe: true,
  // BackSide renders the inward-facing faces. The camera is inside the tube,
  // and by default Three.js culls faces that point away from you.
  // https://threejs.org/docs/#api/en/constants/Materials
  side: THREE.BackSide,
  // The grid lines sit at exactly the same depth as this surface, so the GPU
  // cannot decide which is in front and they flicker. This pushes the wall
  // back a hair so the lines always win.
  // https://threejs.org/docs/#api/en/materials/Material.polygonOffset
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
  roughness: 0.8,
  metalness: 0.1,
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

// Draw the tube as a clean quad grid: the rings plus the lengthwise lines,
// and none of the triangle diagonals.
//
// EdgesGeometry cannot do this. Its single threshold angle has to both keep
// the gentle lengthwise bends and discard the near-flat diagonals, and on a
// smooth tube those two demands overlap - you get diagonals or gaps, never
// neither.
//
// So walk the vertices instead. TubeGeometry lays them out predictably as
// (tubular + 1) rings of (radial + 1) points, which puts vertex (i, j) at
// index i * (radial + 1) + j. From there, join j to j+1 for the rings and
// i to i+1 for the lengthwise lines, and simply never emit a diagonal.
// https://threejs.org/docs/#api/en/core/BufferGeometry
function buildTubeGrid(geo, tubular, radial) {
  const pos = geo.attributes.position;
  const verts = [];
  const idx = (i, j) => i * (radial + 1) + j;
  const push = (a, b) => {
    verts.push(pos.getX(a), pos.getY(a), pos.getZ(a));
    verts.push(pos.getX(b), pos.getY(b), pos.getZ(b));
  };
  for (let i = 0; i <= tubular; i++) {
    // j stops before radial: the last vertex of each ring duplicates the
    // first, and is only there to close the seam.
    for (let j = 0; j < radial; j++) {
      push(idx(i, j), idx(i, j + 1));
      if (i < tubular) push(idx(i, j), idx(i + 1, j));
    }
  }
  // Float32BufferAttribute reads the flat array 3 numbers at a time as x,y,z.
  // Every geometry in Three.js is built this way underneath.
  // https://threejs.org/docs/#api/en/core/BufferAttribute
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

const gridGeometry = buildTubeGrid(tubeGeometry, TUBULAR, RADIAL);

// The one-line alternative, kept for comparison. Swap it into LineSegments
// below to see the diagonals it lets through at this threshold.
// https://threejs.org/docs/#api/en/geometries/EdgesGeometry
const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);

// LineSegments draws the vertices as disconnected PAIRS. THREE.Line would
// chain them into one continuous path and stitch unrelated edges together.
// https://threejs.org/docs/#api/en/objects/LineSegments
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1e1e24 });
const line = new THREE.LineSegments(gridGeometry, lineMaterial);
scene.add(line);

// SpotLight throws a cone, unlike PointLight which glows in every direction.
// Args: color, intensity, distance, angle, penumbra, decay.
// It aims at its .target, and that target has to be in the scene graph too or
// its matrix never updates - so both are parented to the camera, giving a
// headlight that rides along. -Z is the direction a camera looks.
// https://threejs.org/docs/#api/en/lights/SpotLight
const spotLight = new THREE.SpotLight(0xffa200, 8, 1.5, Math.PI / 12, 0.2, 1);
camera.add(spotLight);
camera.add(spotLight.target);
spotLight.target.position.set(0, 0, -1);

const shapes = [];
const numShapes = 25;
const shapeSize = 0.035;
// A shape is invisible below FADE_NEAR and solid above FADE_FAR, so it
// dissolves just before the near plane could clip it away.
const FADE_NEAR = 0.05;
const FADE_FAR = 0.35;

// Built once and shared by all the meshes. A new geometry per object would
// allocate GPU buffers 25 times over for five distinct shapes.
const shapeGeometries = [
  new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize),
  new THREE.IcosahedronGeometry(shapeSize, 0),
  new THREE.TetrahedronGeometry(shapeSize),
  new THREE.OctahedronGeometry(shapeSize),
  new THREE.TorusGeometry(shapeSize, shapeSize * 0.4, 8, 12),
];

for (let index = 0; index < numShapes; index++) {
  // Spread them evenly along the curve, then jitter so they do not read as
  // beads on a string.
  const progress = (index / numShapes + Math.random() * 0.1) % 1;
  const position = curve.getPointAt(progress);
  // getPointAt returns a point ON the curve - the tunnel's centre line. Nudge
  // them off it so they are not all sitting in the flight path.
  position.x += Math.random() - 0.4;
  position.z += Math.random() - 0.4;

  const rotation = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );

  // const color = new THREE.Color().setHSL(0.7 - progress, 1, 0.5);
  const color = new THREE.Color(0xffffff);
  // Each shape needs its own material because opacity is animated per shape.
  // A shared material would fade them all together.
  const shapeMaterial = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
  });

  const geometry =
    shapeGeometries[Math.floor(Math.random() * shapeGeometries.length)];
  const shape = new THREE.Mesh(geometry, shapeMaterial);
  shape.position.copy(position);
  shape.rotation.set(rotation.x, rotation.y, rotation.z);
  scene.add(shape);
  shapes.push(shape);
}

function updateCameraPosition() {
  // performance.now() is real elapsed time, so the ride runs at the same speed
  // on any monitor. A counter incremented once per frame would not.
  const time = performance.now() * 0.00002;
  const t = time % 1;
  // getPointAt walks the curve by real distance, keeping speed constant.
  // getPoint would surge through tight bends and crawl along the straights.
  // https://threejs.org/docs/#api/en/extras/core/Curve.getPointAt
  const pos = curve.getPointAt(t);
  // Aim at a point slightly further along rather than computing a rotation.
  const lookAt = curve.getPointAt((t + 0.03) % 1);
  // .copy() writes x,y,z into the existing vector. Assigning would swap the
  // object out from under Three.js, which holds a reference to it.
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate() {
  requestAnimationFrame(animate);
  updateCameraPosition();
  shapes.forEach((shape) => {
    shape.rotation.x += 0.02;
    shape.rotation.y += 0.02;
    const distance = camera.position.distanceTo(shape.position);
    // smoothstep returns 0 below the first bound, 1 above the second, and
    // eases between them - a soft fade instead of a hard pop.
    // https://threejs.org/docs/#api/en/math/MathUtils
    shape.material.opacity = THREE.MathUtils.smoothstep(
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
