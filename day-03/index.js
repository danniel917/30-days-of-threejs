// ============================================================================
// DAY 03 - Flying through a tunnel
// ============================================================================
// A curve is just a path through space. You cannot see it on its own.
// To show it, you either draw dots along it, or wrap a shape around it.
// This does both, then puts the camera inside and flies it along the path.
//
// The same curve does three jobs here: it shapes the tunnel, it decides where
// the little shapes float, and it tells the camera where to be each frame.
// Guide: https://threejs.org/manual/#en/custom-buffergeometry
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
// Anything closer to the camera than this gets cut off and disappears.
// Kept small so the floating shapes can come very close before vanishing.
const near = 0.01;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
const bgColor = 0xffa200;
const scene = new THREE.Scene();

// Fog makes things fade into a colour as they get further away. Using the same
// colour as the background means you cannot see where the tunnel stops.
// https://threejs.org/docs/#api/en/scenes/FogExp2
scene.fog = new THREE.FogExp2(bgColor, 0.2);
scene.background = new THREE.Color(bgColor);

// A light gets attached to the camera further down. Anything attached to
// something else only shows up if that thing was added to the scene, so the
// camera has to be added too.
scene.add(camera);

// Draws a smooth curve that passes through the points you give it. There is a
// flat version called SplineCurve, but it only works in 2D so it cannot make a
// tunnel. The true at the end joins the finish back to the start, so the loop
// never runs out.
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

// The curve drawn as a thin line. Useful for checking the shape of the path,
// but it runs right down the middle of the tunnel, so it stays switched off.
// https://threejs.org/docs/#api/en/core/BufferGeometry.setFromPoints
const points = curve.getPoints(100);
const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
const pointsMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const curveObject = new THREE.Line(pointsGeometry, pointsMaterial);
// scene.add(curveObject);

// TUBULAR is how many rings run down the length of the tunnel.
// RADIAL is how many sides the circle has, which is both how many long lines
// you see and how round the tunnel looks.
const TUBULAR = 222;
const RADIAL = 16;

// Wraps a circle around the curve to make a tube.
// The order is: path, rings, how wide, sides of the circle, and whether it
// joins back up at the end.
// https://threejs.org/docs/#api/en/geometries/TubeGeometry
const tubeGeometry = new THREE.TubeGeometry(curve, TUBULAR, 1, RADIAL, true);
const tubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e1e24,
  // wireframe: true,
  // Normally only the outside of a shape gets drawn. The camera is inside the
  // tunnel, so we ask for the inside faces instead.
  // https://threejs.org/docs/#api/en/constants/Materials
  side: THREE.BackSide,
  // The lines sit in exactly the same place as the wall, so the graphics card
  // cannot tell which one is in front and they flicker. This pushes the wall
  // back a tiny bit so the lines always win.
  // https://threejs.org/docs/#api/en/materials/Material.polygonOffset
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
  roughness: 0.8,
  metalness: 0.1,
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

// Draws the tunnel as a simple grid: the rings going around it, the lines
// running along it, and nothing else.
//
// Three.js has a built in helper for this called EdgesGeometry, but it decides
// what to draw from a single angle setting. On a smooth tube that one setting
// either keeps the diagonal lines you do not want, or drops the long lines you
// do. No value gets both right.
//
// So we go through the points ourselves instead. A tube stores its points in a
// very regular order: one ring after another, every ring holding the same
// number of points. Because of that you can work out where any point sits, join
// each one to the next around its ring, join each one to the point behind it,
// and simply never draw a diagonal.
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
    // j stops one short, because the last point of each ring is a copy of the
    // first one. It is only there to close the gap.
    for (let j = 0; j < radial; j++) {
      push(idx(i, j), idx(i, j + 1));
      if (i < tubular) push(idx(i, j), idx(i + 1, j));
    }
  }
  // This reads the long list of numbers three at a time, as x, y and z.
  // Every shape in Three.js is stored like this underneath.
  // https://threejs.org/docs/#api/en/core/BufferAttribute
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

const gridGeometry = buildTubeGrid(tubeGeometry, TUBULAR, RADIAL);

// The one line version, kept here to compare against. Swap it into the line
// below to see the diagonals it lets through at this setting.
// https://threejs.org/docs/#api/en/geometries/EdgesGeometry
const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);

// Draws the points in pairs, each pair its own separate line. THREE.Line would
// join them all into one long line instead, connecting things that should not
// be connected.
// https://threejs.org/docs/#api/en/objects/LineSegments
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1e1e24 });
const line = new THREE.LineSegments(gridGeometry, lineMaterial);
scene.add(line);

// Shines in a cone, like a torch. A PointLight would glow in every direction
// instead. The order is: colour, brightness, how far it reaches, how wide the
// cone is, how soft the edge is, and how fast it fades.
// It points at its target, and that target has to be added to the scene too or
// it never moves. Both are attached to the camera so the light travels with
// you. Cameras look towards -Z, so that is where the target goes.
// https://threejs.org/docs/#api/en/lights/SpotLight
const spotLight = new THREE.SpotLight(0xffa200, 8, 1.5, Math.PI / 12, 0.2, 1);
camera.add(spotLight);
camera.add(spotLight.target);
spotLight.target.position.set(0, 0, -1);

const shapes = [];
const numShapes = 25;
const shapeSize = 0.035;
// A shape is completely see through below FADE_NEAR and completely solid above
// FADE_FAR, so it fades away just before it would get cut off.
const FADE_NEAR = 0.05;
const FADE_FAR = 0.35;

// Made once and shared by all the shapes. Building a new one for every shape
// would waste memory, since there are only five different ones.
const shapeGeometries = [
  new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize),
  new THREE.IcosahedronGeometry(shapeSize, 0),
  new THREE.TetrahedronGeometry(shapeSize),
  new THREE.OctahedronGeometry(shapeSize),
  new THREE.TorusGeometry(shapeSize, shapeSize * 0.4, 8, 12),
];

for (let index = 0; index < numShapes; index++) {
  // Space them out evenly along the path, then move each one a little at
  // random so they do not look like beads on a string.
  const progress = (index / numShapes + Math.random() * 0.1) % 1;
  const position = curve.getPointAt(progress);
  // getPointAt gives a spot on the curve itself, which is the middle of the
  // tunnel. Push them sideways so they are not sitting right in the way.
  position.x += Math.random() - 0.4;
  position.z += Math.random() - 0.4;

  const rotation = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );

  // const color = new THREE.Color().setHSL(0.7 - progress, 1, 0.5);
  const color = new THREE.Color(0xffffff);
  // Each shape needs its own material because they fade one at a time. If they
  // shared one, they would all fade together.
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
  // performance.now() is real time, so the ride goes at the same speed on any
  // screen. Adding a bit on every frame would run faster on a faster screen.
  const time = performance.now() * 0.00002;
  const t = time % 1;
  // getPointAt moves along the curve by real distance, so the speed stays even.
  // getPoint would rush through the bends and crawl along the straight parts.
  // https://threejs.org/docs/#api/en/extras/core/Curve.getPointAt
  const pos = curve.getPointAt(t);
  // Look at a spot a little further ahead, instead of working out an angle.
  const lookAt = curve.getPointAt((t + 0.03) % 1);
  // .copy() puts the numbers into the position we already have. Replacing it
  // would swap out something Three.js is still holding on to.
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
    // smoothstep gives 0 below the first number, 1 above the second, and a
    // smooth slide in between. That is what makes it fade instead of pop.
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
