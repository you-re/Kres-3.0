import * as THREE from "three";

// Components
import { createScene } from "./components/scene";
import { createCamera, gunMixer } from "./components/camera";
import { createLights } from "./components/lights";
import { loadWorld, worldAnimationMixers } from "./components/world";
// import { addBgMusic } from "./components/music";

// Systems
import { createRenderer } from "./systems/renderer";
import { createStats } from "./systems/stats";
import { Resizer } from "./systems/resizer";
import { createComposer } from "./systems/postprocessing";
// Health System
import { createHealthSystem } from "./systems/health"

// Physics & Controls
import { createPhysics, STEPS_PER_FRAME } from "./systems/physics";
import { setupControls } from "./systems/controls";
import { createTriggerSystem } from "./systems/triggers";

// UI & Debug
import { createDebugGUI } from "./components/debug";
import { createUI } from "./components/UI";

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
const { composer, setRadialBlurStrength, setColorOverlayStrength } = createComposer(renderer, scene, camera);
container.appendChild(renderer.domElement);
let stats;
if (import.meta.env && import.meta.env.DEV) {
  stats = createStats();
  container.appendChild(stats.domElement);
} else {
  // No-op stats for production builds so `stats.update()` is safe to call
  stats = { update: () => {} };
}

// Initialize Health
const {
  takeDamage,
  restoreHealth,
  getHealth,
  setOnDeath,
  setOnHealthChange
} = createHealthSystem ();

let setMovementEnabled = () => {};

const ui = createUI();
ui.updateHealth(getHealth());

// Initialize Physics & Controls
const {
  playerCollider,
  playerVelocity,
  updatePlayer,
  worldOctree,
  setInfiniteFalling,
  resetPlayer
} = createPhysics( scene, animations, takeDamage ); // Pass animations to createPhysics

const controls = setupControls(
  camera,
  playerVelocity,
  resetPlayer
);
const { applyControls } = controls;
setMovementEnabled = controls.setInputEnabled;

setOnHealthChange(ui.updateHealth);

const triggerSystem = createTriggerSystem({
  scene,
  playerCollider,
  onTrigger: (trigger) => {
    const message = trigger.text || `Triggered: ${trigger.name || trigger.id}`;
    // pass optional duration (ms) from trigger data to UI
    ui.showTriggerMessage(message, trigger.duration);
    // restore player's health when touching a trigger
    if (typeof restoreHealth === "function") restoreHealth(true);
  },
  debug: false,
});
triggerSystem.loadTriggers();

setOnDeath(() => {
  triggerSystem.resetTriggers();
  if (typeof ui.clearTriggerMessage === "function") {
    ui.clearTriggerMessage();
  }
  resetPlayer();
});

// Create debug UI
if (import.meta.env && import.meta.env.DEV) {
  createDebugGUI({
    onInfiniteFallingChange: setInfiniteFalling,
    setFogColor: setFogColor,
    setFogDensity: setFogDensity,
    setSunColor: setSunColor,
    setHorizonColor: setHorizonColor,
    onTriggerDebugChange: triggerSystem.setDebug,
  });
}

// Load World
loadWorld(scene, worldOctree);

// Add Background Sound Effects
// addBgMusic();

// Animation Loop

function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
  const elapsedTime = clock.getElapsedTime();

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    applyControls(deltaTime, playerCollider.onFloor, camera);
    updatePlayer(deltaTime, worldOctree, camera);
    if (playerCollider.onFloor) {
      triggerSystem.checkTriggers();
    }
  }

  // ✅ Update gun animations
  if (gunMixer) gunMixer.update(deltaTime);

  // ✅ Update world object animations
  worldAnimationMixers.forEach((mixer) => mixer.update(deltaTime * 5));

  triggerSystem.updateTriggerObjects(deltaTime, elapsedTime);

  let verticalSpeedEffect = THREE.MathUtils.clamp((Math.max(0, (-playerVelocity.y)) / 20) - 1, 0, 10.0);

  setRadialBlurStrength(verticalSpeedEffect);
  setColorOverlayStrength(Math.pow(verticalSpeedEffect, 2));

  composer.render();
  stats.update();
}

// Resizer
Resizer(camera, renderer, composer);
