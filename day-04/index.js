// ============================================================================
// DAY 04 - 3D Text in a field of donuts
// ============================================================================
// Text in 3D is not a font drawn on a flat surface. The letter shapes get read
// out of a font file, turned into real geometry with thickness, and then lit
// like any other object in the scene.
//
// Around it sit a hundred donuts. They all share one shape and one surface,
// because building a hundred separate copies of the same thing is wasted work.
// Only their position, turn and size differ.
// Guide: https://threejs.org/docs/#examples/en/geometries/TextGeometry
// ============================================================================

import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { FontLoader } from "jsm/loaders/FontLoader.js";
import { TextGeometry } from "jsm/geometries/TextGeometry.js";

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

// A matcap is a photo of a sphere lit a certain way. Three.js reads the colour
// straight off that photo depending on which way the surface is facing, so the
// object looks lit without a single light in the scene. Cheap, and it never
// changes as you move around.
// https://threejs.org/docs/#api/en/materials/MeshMatcapMaterial
const textureLoader = new THREE.TextureLoader();
const matcapTexture = textureLoader.load("./textures/matcaps/8.png");
// The image was saved for screens, so say so, or the colours come out washed.
matcapTexture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });

// Font files have to be downloaded before any letters can be built, so
// everything that needs the font happens inside this callback.
const fontLoader = new FontLoader();
fontLoader.load("./fonts/helvetiker_regular.typeface.json", (font) => {
  const textGeometry = new TextGeometry("Hello Three.js", {
    font,
    size: 0.5,
    depth: 0.2, // how far the letters stick out towards you
    curveSegments: 12, // smoothness of the rounded parts of each letter
    bevelEnabled: true, // softens the hard front edge of every letter
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  });

  // Text is built starting from its left edge, so it sits off to one side.
  // This shifts the shape so its middle lands on the centre of the scene.
  textGeometry.center();

  scene.add(new THREE.Mesh(textGeometry, material));

  // One shape, built once, handed to every donut. Making a new TorusGeometry
  // inside the loop would build the same rings a hundred times over.
  const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);

  for (let i = 0; i < 100; i++) {
    const donut = new THREE.Mesh(donutGeometry, material);

    // Math.random() gives 0 to 1. Taking off a half gives -0.5 to 0.5, so the
    // donuts spread out in both directions instead of only one.
    donut.position.x = (Math.random() - 0.5) * 10;
    donut.position.y = (Math.random() - 0.5) * 10;
    donut.position.z = (Math.random() - 0.5) * 10;

    // Turning on two axes is enough to make a donut look randomly thrown.
    // Spinning it a third time would not add anything you could see.
    donut.rotation.x = Math.random() * Math.PI;
    donut.rotation.y = Math.random() * Math.PI;

    const scale = Math.random();
    donut.scale.set(scale, scale, scale);

    scene.add(donut);
  }
});

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

function animate() {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

animate();
