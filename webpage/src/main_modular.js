import * as THREE from "three";

// Components
import { createScene } from "./components/scene";
import { createCamera, gunMixer } from "./components/camera";
import { createLights } from "./components/lights";
import { loadWorld } from "./components/world";
// import { addBgMusic } from "./components/music";

// Systems
import { createRenderer } from "./systems/renderer";
import { createStats } from "./systems/stats";
import { Resizer } from "./systems/resizer";

// Physics & Controls
import { createPhysics, STEPS_PER_FRAME } from "./systems/physics";
import { setupControls } from "./systems/controls";

// UI & Debug
import { createDebugGUI } from "./components/debug";

const clock = new THREE.Clock();

// SCENE, BACKGROUND, FOG)
const {
  scene,
  setFogColor,
  setFogDensity
} = createScene();

const { camera, animations } = createCamera(scene); // Destructure to get the camera instance and animations
const {
  fillLight1,
  directionalLight,
  setSunColor, 
  setHorizonColor
  } = createLights();
scene.add(fillLight1, directionalLight);

const container = document.getElementById("container");
const renderer = createRenderer(animate);
container.appendChild(renderer.domElement);
const stats = createStats();
container.appendChild(stats.domElement);

// Initialize Physics & Controls
const {
  playerCollider,
  playerVelocity,
  playerDirection,
  updatePlayer,
  worldOctree,
  setInfiniteFalling,
  resetPlayer
} = createPhysics(scene, animations); // Pass animations to createPhysics

// Create debug UI
createDebugGUI({
  onInfiniteFallingChange: setInfiniteFalling,
  setFogColor: setFogColor,
  setFogDensity: setFogDensity,
  setSunColor: setSunColor,
  setHorizonColor: setHorizonColor
});

const applyControls = setupControls(
  camera, // Pass the correct camera instance
  playerVelocity,
  playerDirection,
  resetPlayer
);

// Load World
loadWorld(scene, worldOctree);

// Add Background Sound Effects
// addBgMusic();

// Animation Loop

function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    applyControls(deltaTime, playerCollider.onFloor, camera);
    updatePlayer(deltaTime, worldOctree, camera);
  }

  // ✅ Update gun animations
  if (gunMixer) gunMixer.update(deltaTime);

  renderer.render(scene, camera);
  stats.update();
}

// Resizer
Resizer(camera, renderer);
