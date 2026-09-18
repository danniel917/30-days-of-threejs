// ============================================================================
// DAY 05 - Three shapes under eight lights
// ============================================================================
// Days 01 to 04 got away with one light, or none at all. This one is about
// what the different kinds of light actually do, so there are eight of them
// on three plain grey shapes and a floor.
//
// There are four kinds here:
//   Ambient     - the same faint glow on every surface from every side. It has
//                 no position, so it casts nothing. It only stops the parts
//                 facing away from the other lights from going pure black.
//   Directional - light from very far away, arriving in parallel lines, like
//                 the sun. Its position sets the angle it comes in at, not how
//                 close it is.
//   Point       - a bare bulb. Light leaves one spot in every direction and
//                 fades with distance.
//   Spot        - a cone pointing at a target. The angle sets how wide the
//                 cone opens, the penumbra how soft its edge is.
//
// Shadows are the expensive part. A light that casts one has to render the
// whole scene a second time from where it stands, into a depth image, so the
// renderer can work out what is hidden from it. Eight lights, seven of them
// casting, is far more than a real scene should use. It is here so the panel
// in the corner has something to show.
//
// Open any folder in that panel to move a light, change its colour, or switch
// on the wireframe marker that shows where it sits.
// Guide: https://threejs.org/docs/#api/en/lights/PointLight
// ============================================================================

import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

const gui = new GUI();

// Colours are kept as plain hex numbers because that is the shape the colour
// picker works with. Handing one to light.color.set() lets Three.js convert it
// from a screen colour into the numbers it renders with. Reading the light's
// own colour back into the picker would show that converted value instead,
// which is not the colour anyone picked.
const colours = {
  ambient: 0x000000,
  directional1: 0xfdff55,
  directional2: 0xff0dff,
  directional3: 0xf28322,
  point: 0xcdff00,
  spot1: 0x0000ff,
  spot2: 0xffffff,
  spot3: 0xffffa3,
};

// How bright the ambient glow gets at the top of its pulse. The light's own
// intensity is overwritten every frame, so the slider has to drive this
// instead of the light.
const ambientSettings = { intensity: 0.15 };

// Markers only redraw when asked to, so the visible ones get updated every
// frame. Without that, dragging a position slider moves the light and leaves
// its marker behind.
const helpers = [];

/**
 * Shared setup
 */
// Every shadow casting light needs the same handful of settings. Writing them
// out once here keeps the light definitions below down to what is actually
// different about each one.
function enableShadows(light, { mapSize = 1024, near = 1, far = 10 } = {}) {
  light.castShadow = true;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.camera.near = near;
  light.shadow.camera.far = far;
  // Blurs the shadow edge. Only does anything with the soft shadow type set
  // on the renderer further down this file.
  light.shadow.radius = 10;

  // A directional light arrives in parallel lines, so it has no single point
  // to look out from. Its shadow is taken through a box instead, and anything
  // outside that box is left without one.
  if (light.shadow.camera.isOrthographicCamera) {
    light.shadow.camera.top = 2;
    light.shadow.camera.right = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.left = -2;
  }
}

// Each light gets the same row of controls, so the panel is built by one
// function rather than eight near identical blocks.
function addLightControls(name, light, helper, colourKey, axes = ["x", "y", "z"]) {
  const folder = gui.addFolder(name);
  folder.close();

  folder
    .addColor(colours, colourKey)
    .name("colour")
    .onChange(() => light.color.set(colours[colourKey]));

  folder.add(light, "intensity").min(0).max(10).step(0.01).name("brightness");

  for (const axis of axes) {
    folder.add(light.position, axis).min(-10).max(10).step(0.01);
  }

  if (helper) {
    helper.visible = false;
    helpers.push(helper);
    scene.add(helper);
    folder.add(helper, "visible").name("show marker");
  }

  return folder;
}

/**
 * Lights
 */
// No position and no shadow. It lifts the whole scene off pure black, and the
// animation loop makes it breathe in and out.
const ambientLight = new THREE.AmbientLight(
  colours.ambient,
  ambientSettings.intensity,
);
scene.add(ambientLight);

const ambientFolder = gui.addFolder("Ambient Light");
ambientFolder.close();
ambientFolder
  .addColor(colours, "ambient")
  .name("colour")
  .onChange(() => ambientLight.color.set(colours.ambient));
ambientFolder
  .add(ambientSettings, "intensity")
  .min(0)
  .max(1)
  .step(0.01)
  .name("peak brightness");

// Yellow, from below. Lighting a scene from underneath is the fastest way to
// see that direction is all a directional light has.
const directionalLight1 = new THREE.DirectionalLight(colours.directional1, 0.5);
directionalLight1.position.set(0, -5, 0);
enableShadows(directionalLight1, { far: 20 });
scene.add(directionalLight1);
addLightControls(
  "Directional Light 1",
  directionalLight1,
  new THREE.DirectionalLightHelper(directionalLight1, 1),
  "directional1",
);

// Magenta, from behind and above. Fills in the side the first one misses.
const directionalLight2 = new THREE.DirectionalLight(colours.directional2, 0.35);
directionalLight2.position.set(1, 1, -2);
enableShadows(directionalLight2, { far: 20 });
scene.add(directionalLight2);
addLightControls(
  "Directional Light 2",
  directionalLight2,
  new THREE.DirectionalLightHelper(directionalLight2, 1),
  "directional2",
);

// Orange, from the front. The brightest of the three, so it decides what the
// shapes look like from the side the camera usually sits on.
const directionalLight3 = new THREE.DirectionalLight(colours.directional3, 1.8);
directionalLight3.position.set(1.74, 0, 3);
enableShadows(directionalLight3, { far: 20 });
scene.add(directionalLight3);
addLightControls(
  "Directional Light 3",
  directionalLight3,
  new THREE.DirectionalLightHelper(directionalLight3, 1),
  "directional3",
);

// The only light that moves on its own. It drifts around under the shapes on
// two overlapping waves, so its path never repeats the same loop twice.
// It sits below the floor, so it lights the shapes from underneath. It still
// casts a shadow, there is just nothing under there to catch it. Lift it above
// the floor with the slider in the panel and the shadows appear.
const pointLight = new THREE.PointLight(colours.point, 5);
pointLight.position.set(-1, -1, 1);
// A point light throws in every direction, so its shadow is taken through the
// six faces of a cube around it. Near has to stay small, or surfaces close to
// the bulb fall out of range and lose their shadow.
enableShadows(pointLight, { near: 0.1 });
scene.add(pointLight);
// Only the height is adjustable. The animation loop overwrites x and z every
// frame, so sliders for those two would snap back the moment they were let go.
addLightControls("Point Light", pointLight, new THREE.PointLightHelper(pointLight), "point", [
  "y",
]);

// Blue, close overhead, with the cone opened as wide as it goes.
const spotLight1 = new THREE.SpotLight(colours.spot1, 5, 0, Math.PI, 1, 2);
spotLight1.position.set(0, 1, 1);
enableShadows(spotLight1);
scene.add(spotLight1);
addLightControls(
  "Spot Light 1",
  spotLight1,
  new THREE.SpotLightHelper(spotLight1),
  "spot1",
);

// White, in front of the shapes, and the one with a reach: the third argument
// is a distance, so its light dies out after five units instead of carrying on
// forever like the others.
const spotLight2 = new THREE.SpotLight(colours.spot2, 10, 5, Math.PI, 1, 2);
spotLight2.position.set(0, -0.47, 3);
enableShadows(spotLight2);
scene.add(spotLight2);
addLightControls(
  "Spot Light 2",
  spotLight2,
  new THREE.SpotLightHelper(spotLight2),
  "spot2",
);

// Warm white from up on the left, and the only one shaped the way a spotlight
// usually is: a narrow cone with a fairly hard edge. It draws the sharpest
// shadows in the scene, so it gets a larger depth image than the rest.
const spotLight3 = new THREE.SpotLight(
  colours.spot3,
  2.5,
  0,
  Math.PI * 0.25,
  0.25,
  1,
);
spotLight3.position.set(-2, 2, 5);
enableShadows(spotLight3, { mapSize: 2048 });
scene.add(spotLight3);
addLightControls(
  "Spot Light 3",
  spotLight3,
  new THREE.SpotLightHelper(spotLight3),
  "spot3",
);

/**
 * Objects
 */
// MeshStandardMaterial is the one that answers to light properly. Roughness is
// how scattered the reflection is: low looks polished, high looks chalky.
const material = new THREE.MeshStandardMaterial({ roughness: 0.4 });
const floorMaterial = new THREE.MeshStandardMaterial({ roughness: 0.5 });

// Casting and receiving are separate switches, and both start off. The shapes
// throw shadows, the floor takes them, and nothing here needs to do both.
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), material);
sphere.position.x = -1.5;
sphere.castShadow = true;

const cube = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), material);
cube.castShadow = true;

const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.2, 32, 64), material);
torus.position.x = 1.5;
torus.castShadow = true;

// A plane is built standing up facing the camera, so it gets tipped a quarter
// turn backwards to lie flat, then dropped below the shapes.
const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = -0.65;
floor.receiveShadow = true;

scene.add(sphere, cube, torus, floor);

/**
 * Camera and renderer
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(-2, 3, 2);
scene.add(camera);

// Drag to turn, scroll to move closer. Damping lets the movement coast to a
// stop instead of halting the moment you let go, which needs controls.update()
// called every frame to work.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
// Retina screens would otherwise render four times the pixels for very little
// gain. Capping at 2 keeps it sharp without cooking the laptop.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Shadows are off until asked for, and the plain type comes out blocky. This
// one blurs the edges as they are sampled.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // The camera holds its own idea of the window shape, and only rebuilds it
  // when told to. Skip this and everything ends up stretched.
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Animate
 */
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  for (const shape of [sphere, cube, torus]) {
    shape.rotation.y = 0.5 * elapsedTime;
    shape.rotation.x = 0.15 * elapsedTime;
  }

  // Two waves of different speeds added together. One on its own would trace
  // the same circle over and over.
  pointLight.position.x =
    Math.sin(elapsedTime * 1.5) + Math.sin(elapsedTime * 0.7) * 0.5;
  pointLight.position.z =
    Math.cos(elapsedTime * 1.3) + Math.cos(elapsedTime * 0.8) * 0.5;

  // Math.abs folds the bottom half of the wave up, so the glow fades away and
  // swells again instead of going negative.
  ambientLight.intensity =
    Math.abs(Math.sin(elapsedTime * 0.5)) * ambientSettings.intensity;

  for (const helper of helpers) {
    if (helper.visible) helper.update();
  }

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

animate();
