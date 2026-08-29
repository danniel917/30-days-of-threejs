// ============================================================================
// DAY 01 - Icosahedron with a moving spotlight
// ============================================================================
// Think of it as a photo studio:
//   SCENE = the room | CAMERA = the tripod | LIGHTS = the lamps
//   RENDERER = the photographer who presses the shutter
//
// Key idea: creating an object does NOT draw it. Nothing shows up until
// renderer.render() runs. That is the shutter click.
//
// Axes: +X = right, +Y = up, +Z = toward you.
// Manual: https://threejs.org/manual/#en/fundamentals
// ============================================================================


// Grabs the whole library under one name, so everything is THREE.Something.
import * as THREE from 'three';

// OrbitControls is an "addon", not part of core Three.js, so it comes from a
// different folder. The short names 'three' and 'jsm/' work because of the
// importmap in index.html, which maps them to real CDN URLs.
// Docs: https://threejs.org/docs/#examples/en/controls/OrbitControls
// Importmap: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap
import { OrbitControls } from 'jsm/controls/OrbitControls.js';


// Size of the browser window. Stored once because two things need the same
// numbers: the canvas size and the camera's aspect ratio. If they disagree,
// the image comes out stretched.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth
const width = window.innerWidth;
const height = window.innerHeight;


// --- RENDERER: draws the scene onto a <canvas> using the GPU ---------------
// antialias smooths jagged diagonal edges. Our shape is all hard edges plus a
// thin wireframe, so it really needs it.
// Note: this only works as a constructor option, not as a property afterwards.
// https://threejs.org/docs/#api/en/renderers/WebGLRenderer
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Sets how many pixels the GPU renders, and how big the canvas looks on page.
renderer.setSize(width, height);

// renderer.domElement is the <canvas> the renderer made. Nothing is visible
// until we put it on the page.
document.body.appendChild(renderer.domElement);


// --- CAMERA ----------------------------------------------------------------
// The camera sees a pyramid-shaped volume called the "frustum". These four
// numbers define it. Anything outside is not drawn.
//
//        near              far
//         |                 |
//    /----+-----------------+----\
//   O fov |    VISIBLE      |     \
//  camera |                 |     /
//    \----+-----------------+----/
//
// https://threejs.org/docs/#api/en/cameras/PerspectiveCamera

// FOV = "field of view": how wide the lens is, in degrees (measured
// vertically). Low (~30) = zoomed-in and flat. High (~100) = wide and
// distorted at the edges. 75 is the common default: looks natural.
const fov = 75;

// Aspect ratio = width divided by height. It tells the camera the shape of the
// canvas, so a circle renders as a circle instead of an oval. A 1600x900
// window gives 1.777 (16:9). This is why the resize handler at the bottom has
// to recalculate it whenever the window changes shape.
const aspect = width / height;

// Clipping planes: nothing closer than 0.1 or further than 10 gets drawn.
// Keep this range tight. The GPU only has so much depth precision, and a huge
// near-to-far range spreads it too thin, making close surfaces flicker
// (an artifact called "z-fighting").
const near = 0.1;
const far = 10;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

// Cameras start at (0,0,0) - which is inside our shape. Back away so we can
// see it. position is a Vector3 (.x .y .z plus helper methods).
// https://threejs.org/docs/#api/en/math/Vector3
camera.position.z = 2.5;


// --- SCENE: the container. Anything not added to it is not drawn. ----------
// https://threejs.org/docs/#api/en/scenes/Scene
const scene = new THREE.Scene();

// 0x444444 is a hex colour (0x = hexadecimal, then RR GG BB). Equal values =
// grey. Mid-grey is chosen so both the lit and shadowed sides of the shape
// stay visible - black would hide the dark side, white the bright side.
// https://threejs.org/docs/#api/en/math/Color
scene.background = new THREE.Color(0x1b1b1b);


// --- ORBIT CONTROLS: drag the mouse to look around --------------------------
// It moves the CAMERA in a circle around the object - the object itself never
// moves. Second argument is the canvas, so it only listens for drags there.
const controls = new OrbitControls(camera, renderer.domElement);

// How close you can zoom. The shape has radius 1, so anything under that would
// put the camera inside it.
controls.minDistance = 1.5;

// How far you can zoom out. Stays well under camera.far (10), or the shape
// would get clipped away entirely.
controls.maxDistance = 5;

// Panning slides the object off-centre and users get lost. Off keeps it framed.
controls.enablePan = false;

// Damping = inertia, so the camera glides instead of stopping dead.
// dampingFactor is how much of the remaining distance it covers each frame:
// lower = heavier and floatier, higher = snappier.
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// Damping only works if controls.update() runs every frame - see the call
// inside animate() below. Without it the camera stops dead on mouse release.
// Rule: if enableDamping or autoRotate is on, call controls.update() each
// frame. It fails silently otherwise - no error, it just does nothing.


// --- GEOMETRY + MATERIAL = MESH ---------------------------------------------
// Geometry is the SHAPE. Material is HOW IT LOOKS. Mesh combines them into a
// real object you can position. They are separate so they can be reused.

// Icosahedron = the 20-triangle solid. First argument is the radius.
// Second is "detail": how many times to subdivide. Each level splits every
// triangle into 4 and rounds it out more:
//     0 = 20 faces | 1 = 80 | 2 = 320 (ours) | 3 = 1280
// Level 2 is faceted but still reads as a ball. Careful going higher - the
// count multiplies by 4 each time and will slow things down.
// https://threejs.org/docs/#api/en/geometries/IcosahedronGeometry
const geometry = new THREE.IcosahedronGeometry(1.0, 2);

// MeshStandardMaterial reacts realistically to light.
// IMPORTANT: it needs lights in the scene. With no lights it renders black -
// this is the most common "why is my object invisible?" beginner problem.
// https://threejs.org/docs/#api/en/materials/MeshStandardMaterial
const material = new THREE.MeshStandardMaterial({
    // Base colour of the surface.
    color: 0xe62510,

    // This one line creates the whole faceted look. Normally the GPU blends
    // lighting smoothly across triangles, so 320 faces look like a smooth
    // ball. flatShading lights each triangle as one flat plane instead, so
    // every edge becomes visible. Set it to false and reload to see.
    flatShading: true,

    // How scattered the reflections are. 0 = mirror, 1 = chalky/matte.
    // 0.39 gives a soft sheen, so the moving spotlight leaves a visible
    // highlight travelling across the faces.
    roughness: .39,

    // Is it metal? Nearly a yes/no in real life: 0 = plastic/wood/stone,
    // 1 = metal. Avoid the middle - nothing real is half-metal.
    //
    // We are at 0.95, almost fully metallic, and that choice drives the whole
    // look of this scene. Metals work differently from plastics:
    //   - NO diffuse. A metal has no soft base colour of its own, so there is
    //     nothing for a general fill light to land on.
    //   - YES specular. It still reflects direct lights as sharp highlights,
    //     tinted by `color` above.
    //
    // So with no environment map, the spotlight's highlight is essentially the
    // ONLY thing lighting this shape - bright glints skating across the facets
    // with near-black between them. That is the dark, high-contrast look.
    //
    // Consequence to know about: the hemisphereLight further down is now
    // almost inert. That 0.05 of non-metal is all it has to work with.
    // If you ever want soft overall light back, this is the number to lower.
    metalness: .95,

    // How strongly a reflected environment shows on the surface.
    // NOTE: currently does NOTHING - it multiplies scene.environment, and we
    // removed that. Kept as the dial to reach for if an environment map ever
    // comes back: 1 = full reflections (washes the colour out), 0.2 = subtle.
    envMapIntensity: 0.2
});

// Mesh = geometry + material, with a position, rotation and scale.
// https://threejs.org/docs/#api/en/objects/Mesh
const mesh = new THREE.Mesh(geometry, material);

// Without add(), the mesh exists but is never drawn. No error - just missing.
scene.add(mesh);


// --- WIREFRAME OVERLAY ------------------------------------------------------
// MeshBasicMaterial ignores lighting completely, so this outline stays an even
// orange as the spotlight sweeps past, instead of fading into shadow.
// https://threejs.org/docs/#api/en/materials/MeshBasicMaterial
const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xf76640,

    // Draw only the triangle edges, not filled faces.
    wireframe: true,

    // These two go together: opacity is IGNORED unless transparent is true.
    // Setting opacity on its own does nothing - a very common gotcha.
    transparent: true,
    opacity: .5
});

// Reuses the same `geometry` as the solid mesh above. The shape data is sent
// to the GPU once and shared, instead of stored twice. Geometries and
// materials are meant to be reused like this.
const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);

// setScalar(n) means scale(n, n, n) on all three axes.
// Why 1.001? At exactly 1.0 the wireframe and the surface sit at the identical
// depth, and the GPU cannot tell which is in front - it flickers. Making it
// 0.1% bigger lifts it just clear. Too small a difference to see.
wireframeMesh.scale.setScalar(1.001);

// mesh.add(), not scene.add() - this makes the wireframe a CHILD of the mesh,
// so it automatically inherits the rotation applied below and stays locked to
// the surface. Otherwise we would have to rotate both by hand.
mesh.add(wireframeMesh);


// --- LIGHTS: one to shape the object, one to keep it readable ---------------
// SpotLight(color, intensity, distance, angle, penumbra, decay)
//   color     white, so the material's own colour shows untinted
//   intensity 20 - looks huge, but see decay below
//   distance  10 - range where the light fades to nothing (0 = infinite)
//   angle     the cone width, in RADIANS not degrees. Math.PI = 180 deg, so
//             Math.PI/5 = 36 deg. Three.js uses radians everywhere.
//   penumbra  0.4 - softness of the cone's edge (0 = hard circle, 1 = soft)
//   decay     2 = realistic falloff, light dims with the square of distance
//
// Intensity is 400 BECAUSE decay is 2 - always read those two together.
// decay 2 is realistic inverse-square falloff, so brightness drops with the
// SQUARE of distance. The light swings out on a radius-8 circle (see animate()
// below), putting it around 9-10 units from the shape, so only a small
// fraction of its stated strength ever arrives. 400 is not "blinding", it is
// "enough once physics has taken its cut".
//
// distance is 0, meaning INFINITE range. That matters here: a spotlight fades
// to nothing as it approaches its distance limit, so the old value of 10 would
// have killed the light at the far end of a radius-8 swing. The light would
// have pulsed brighter and dimmer around the circle instead of sweeping
// evenly. Widening the orbit and setting distance to 0 go together.
//
// IF YOU WANT IT BRIGHTER STILL, in order of how much they help:
//   1. raise intensity - it is just a number, nothing caps it
//   2. lower decay to 1 (gentler falloff) or 0 (none - unrealistic but even)
//   3. shrink the orbit radius in animate() so it passes closer
//   4. raise roughness on the material for a broader, softer highlight rather
//      than a small hot glint
// If the highlight goes flat white and stops looking brighter, it is clipping.
// Add renderer.toneMapping = THREE.ACESFilmicToneMapping instead of pushing on.
// https://threejs.org/docs/#api/en/lights/SpotLight
const spotLight = new THREE.SpotLight(0xffffff, 400, 0, Math.PI / 5, 0.4, 2);

// Placed to the side and above, not straight on. Lighting from an angle means
// faces catch different amounts of light, and that difference is what makes
// the object look 3D. Head-on lighting looks flat.
spotLight.position.set(2, 3, 3);

// LIGHT FOLLOWS THE VIEWER.
// Adding the light to the CAMERA instead of the scene makes it a "headlight":
// its position is now relative to the camera, so when you orbit round to the
// back of the shape the light comes with you. Every side gets lit.
//
// If it were added to the scene it would sit at a fixed spot in the world, and
// orbiting behind the object would just show you its unlit back.
//
// The light still aims at spotLight.target, which stays at the world origin
// (0,0,0) where the mesh is - so it keeps pointing at the shape no matter
// where the camera goes.
camera.add(spotLight);

// REQUIRED: renderer.render() only walks the scene tree. The camera is not
// part of it by default, so its child light would never be found. Adding the
// camera to the scene puts the light on the tree. (The camera itself renders
// nothing, so this has no other visual effect.)
scene.add(camera);

// Later gotcha: a spotlight aims at spotLight.target, which sits at (0,0,0) by
// default. Our shape is there, so it works. If you ever move the target, you
// must also do scene.add(spotLight.target) or it silently will not update.

// Helpers draw invisible things so you can debug them. Left commented for
// later. AxesHelper colours are Red/Green/Blue = X/Y/Z.
// https://threejs.org/docs/#api/en/helpers/AxesHelper
// const spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

// scene.add(new THREE.AxesHelper(5));
// scene.add(new THREE.GridHelper(10, 10));

// HemisphereLight(skyColor, groundColor, intensity) - soft light from above
// and below, normally used as "fill" to stop shadowed sides going pure black.
//
// HEADS UP: it barely does anything here, and raising the intensity will not
// change that. Hemisphere light is purely DIFFUSE, and metalness 0.95 leaves
// only 5% diffuse response for it to act on. It is effectively switched off.
// It only starts to matter if metalness comes down.
// https://threejs.org/docs/#api/en/lights/HemisphereLight
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xc6c6c6, 1);
scene.add(hemisphereLight);


// --- THE RENDER LOOP: like a flip book --------------------------------------
// Nothing moves on its own. Every frame: change some values, draw a new
// picture, ask for the next frame. ~60 times a second, that looks like motion.
function animate() {
  // Asks the browser to run animate() again before the next repaint. Better
  // than setInterval: it matches the screen's refresh rate and pauses in
  // background tabs to save battery.
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
  requestAnimationFrame(animate);

  // rotation is measured in radians. Adding a little each frame = a slow spin.
  // Two axes instead of one so more faces pass through the light.
  // The wireframe is a child of this mesh, so it comes along automatically.
  // https://threejs.org/docs/#api/en/math/Euler
  mesh.rotation.x += 0.001;
  mesh.rotation.y += 0.001;

  // Handy trick worth memorising: sin and cos of the SAME angle trace a
  // CIRCLE. Feed one into x and the other into y and the light orbits.
  //   Date.now() = milliseconds since 1970
  //   * 0.001    = convert to seconds (one full loop about every 6.3s)
  //   * 8        = radius of the circle. Wide, so the light sweeps past like a
  //                searchlight rather than circling tightly. This is why the
  //                spotlight needs intensity 400 and distance 0 - see above.
  // Using the clock rather than counting frames means the motion takes the
  // same real time on a slow machine as a fast one.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin
  spotLight.position.x = Math.sin(Date.now() * 0.001) * 8;
  spotLight.position.y = Math.cos(Date.now() * 0.001) * 8;

  // Applies the damping (inertia) set up above. OrbitControls has no loop of
  // its own, so without this call every frame the camera would stop dead the
  // moment you release the mouse instead of gliding to a stop.
  controls.update();

  // The shutter click. Everything changed above is invisible until this runs.
  renderer.render(scene, camera);
}

// Starts the loop.
animate();


// --- WINDOW RESIZE ----------------------------------------------------------
// The canvas does not adjust itself. TWO things must be fixed, and forgetting
// either is a classic bug.
window.addEventListener('resize', function () {
    // 1. The camera's aspect ratio, or the image comes out stretched.
    camera.aspect = window.innerWidth / window.innerHeight;

    // The line everyone forgets. The camera does not read fov/aspect/near/far
    // directly while rendering - it uses a matrix built from them once, for
    // speed. Changing the values does nothing until you rebuild it with this.
    // Same applies if you ever change fov, near or far.
    camera.updateProjectionMatrix();

    // 2. The canvas size, or you get letterboxing or a cropped view.
    renderer.setSize(window.innerWidth, window.innerHeight);

// The trailing `false` just means "listen during the bubble phase", which is
// already the default. Harmless, common in older code.
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
}, false);


// ============================================================================
// FIVE THINGS TO REMEMBER FROM DAY 01
// ============================================================================
// 1. renderer.render() is the only thing that draws anything.
// 2. Geometry + Material = Mesh, and geometry/materials can be shared.
// 3. parent.add() makes a child inherit the parent's rotation and position.
// 4. Silent no-ops to watch for: camera changes need updateProjectionMatrix(),
//    damping needs controls.update() every frame.
// 5. Animate from the clock (Date.now()), not from a frame count.
// ============================================================================
