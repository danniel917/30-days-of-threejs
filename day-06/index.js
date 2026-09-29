// ============================================================================
// DAY 06 - A bouncing ball and its painted shadow
// ============================================================================
// Day 05 showed what real shadows cost: every light that casts one renders the
// whole scene a second time. This day skips all of that. The shadow under the
// ball is not worked out by the renderer at all. It is a blurry dark spot in a
// small picture, laid flat on the floor, that follows the ball around.
//
// That trick is called a baked shadow, and games use it all the time. It is
// almost free to draw, it is always soft, and it never flickers. What it cannot
// do is react to the light. Move the light with the panel and the spot stays
// right where it is, straight under the ball.
//
// To sell the effect, the spot fades as the ball rises and darkens as it comes
// back down, the way a real shadow gets fainter the further an object is from
// the ground.
// Guide: https://threejs.org/docs/#api/en/materials/MeshBasicMaterial.alphaMap
// ============================================================================

import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

const gui = new GUI();

/**
 * Textures
 */
// A white blur on black. Used as an alpha map further down, where white means
// solid and black means see through, so only the blurry middle shows.
// textures/bakedShadow.jpg is here too: a full shadow painted onto the floor
// for a ball that never moves. It is the other half of the same idea.
const textureLoader = new THREE.TextureLoader();
const simpleShadow = textureLoader.load("./textures/simpleShadow.jpg");
simpleShadow.colorSpace = THREE.SRGBColorSpace;

/**
 * Lights
 */
// Neither light casts a shadow. The only shadow in the scene is the painted
// one, which is the point of the day.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Straight overhead, pointing down at the floor. From there a real shadow
// would land directly under the ball, so the painted one looks right.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 3, 0);
scene.add(directionalLight);

const lightsFolder = gui.addFolder("Lights");
lightsFolder
  .add(ambientLight, "intensity")
  .min(0)
  .max(3)
  .step(0.001)
  .name("glow brightness");
lightsFolder
  .add(directionalLight, "intensity")
  .min(0)
  .max(3)
  .step(0.001)
  .name("light brightness");
// Drag these and watch the shading on the ball swing round while the shadow
// under it does not budge. That is the one giveaway of a painted shadow.
lightsFolder.add(directionalLight.position, "x").min(-5).max(5).step(0.001).name("light x");
lightsFolder.add(directionalLight.position, "y").min(-5).max(5).step(0.001).name("light y");
lightsFolder.add(directionalLight.position, "z").min(-5).max(5).step(0.001).name("light z");

/**
 * Material
 */
// One material shared by the ball and the floor, so the two sliders below
// change both at once.
const material = new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.5 });

const surfaceFolder = gui.addFolder("Surface");
surfaceFolder.add(material, "metalness").min(0).max(1).step(0.001);
surfaceFolder.add(material, "roughness").min(0).max(1).step(0.001);

/**
 * Objects
 */
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), material);

// A plane is built standing up facing the camera, so it gets tipped a quarter
// turn backwards to lie flat, then dropped to where the bottom of the ball
// sits when it lands.
const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), material);
plane.rotation.x = -Math.PI * 0.5;
plane.position.y = -0.5;

scene.add(sphere, plane);

// The shadow itself: a flat black square with the blur picture as its alpha
// map, so the square's edges vanish and only the soft spot is left.
// MeshBasicMaterial ignores light entirely, which is what a shadow should do.
// transparent has to be on or the alpha map and opacity are ignored.
const sphereShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 1.5),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    alphaMap: simpleShadow,
    transparent: true,
  }),
);
sphereShadow.rotation.x = -Math.PI * 0.5;
// A hair above the floor. At exactly the same height the two surfaces fight
// over the same pixels and the shadow flickers in and out.
sphereShadow.position.y = plane.position.y + 0.01;
scene.add(sphereShadow);

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
camera.position.set(1, 1, 2);
scene.add(camera);

// Drag to turn, scroll to move closer. Damping lets the movement coast to a
// stop instead of halting the moment you let go, which needs controls.update()
// called every frame to work.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// No shadowMap settings here, unlike day 05. The renderer is never asked to
// work out a shadow, so it never renders the scene a second time.
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
// Retina screens would otherwise render four times the pixels for very little
// gain. Capping at 2 keeps it sharp without cooking the laptop.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
  // Seconds since the page opened, measured in real time. Everything below is
  // worked out from this, so the ball moves at the same speed on any screen.
  // Adding a bit on every frame would run faster on a faster screen.
  const elapsedTime = clock.getElapsedTime();

  // Cosine for x and sine for z traces a circle 1.5 units wide around the
  // middle of the floor.
  sphere.position.x = Math.cos(elapsedTime) * 1.5;
  sphere.position.z = Math.sin(elapsedTime) * 1.5;
  // Math.abs folds the bottom half of the wave up, so instead of sinking
  // through the floor the ball hits it and bounces. The bounce runs three
  // times faster than the circle, and folding doubles it again, so the ball
  // lands six times on every trip around.
  sphere.position.y = Math.abs(Math.sin(elapsedTime * 3));

  // The shadow slides along the floor underneath but stays at floor height.
  sphereShadow.position.x = sphere.position.x;
  sphereShadow.position.z = sphere.position.z;
  // Half strength when the ball touches down, fading to nothing at the top of
  // the bounce, where y reaches 1.
  sphereShadow.material.opacity = (1 - sphere.position.y) * 0.5;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

animate();
