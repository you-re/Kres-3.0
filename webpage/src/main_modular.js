import * as THREE from "three";

// Components
import { createScene } from "./components/scene";
import { createCamera } from "./components/camera";
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

// UI & Debug
import { createDebugGUI } from "./components/debug";
import { createUI } from "./components/UI";
import { createTriggerSystem } from "./systems/triggers";

const clock = new THREE.Clock();

// SCENE, BACKGROUND, FOG)
const {
  scene,
  setFogColor,
  setFogDensity
} = createScene();

const { camera } = createCamera(scene); // Get the camera instance
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

const HEALTH_TIMER = 0.5;
let healthOverlayTimer = 0;
let healthRestored = false;

const {
  takeDamage,
  restoreHealth,
  getHealth,
  setOnDeath,
  setOnHealthChange,
  setOnDamage
} = createHealthSystem ();

let setInputEnabled = () => {};
// UI is visual-only; control input toggling is handled elsewhere when needed
const ui = createUI();
ui.updateHealth(getHealth());

// DAMAGE FLASH
const DAMAGE_FLASH_TIME = 0.25;
let damageOverlayTimer = 0;

setOnDamage((amount) => {
  damageOverlayTimer = DAMAGE_FLASH_TIME;
});

// Initialize Physics & Controls
const {
  playerCollider,
  playerVelocity,
  playerDirection,
  updatePlayer,
  worldOctree,
  setInfiniteFalling,
  resetPlayer
} = createPhysics( scene, takeDamage );

const triggerSystem = createTriggerSystem(
  scene,
  playerCollider,
  (trigger) => {
    const message = trigger.text || `Triggered: ${trigger.name || trigger.id}`;
    ui.showTriggerMessage(message);
    // Health restore
    healthOverlayTimer = HEALTH_TIMER;
  },
  restoreHealth,
  {
    debug: false,
    onTriggerExit: () => ui.clearTriggerMessage(),
  }
);

triggerSystem.loadTriggers();

// Overlay for two seconds
const RESPAWN_TIMER = 2.0;
let respawnOverlayTimer = RESPAWN_TIMER;

setOnHealthChange(ui.updateHealth);
setOnDeath(() => {
  triggerSystem.resetTriggers();
  resetPlayer();
  respawnOverlayTimer = RESPAWN_TIMER;
});

// Create debug UI
if (import.meta.env && import.meta.env.DEV) {
  createDebugGUI({
    onInfiniteFallingChange: setInfiniteFalling,
    setFogColor: setFogColor,
    setFogDensity: setFogDensity,
    setSunColor: setSunColor,
    setHorizonColor: setHorizonColor
  });
}

const controls = setupControls(
  camera, // Pass the correct camera instance
  playerVelocity,
  playerDirection,
  resetPlayer
);
const { applyControls, setInputEnabled: setInputEnabledFromControls } = controls;
setInputEnabled = setInputEnabledFromControls || setInputEnabled;

// Load World
let loadPercent = 0;
let worldLoaded = false;

loadWorld(
  scene,
  worldOctree,
  (percent) => {
    loadPercent = percent;
  },
  () => {
    worldLoaded = true;
  }
);

// Add Background Sound Effects
// addBgMusic();

// Animation Loop
function animate() {
  // console.log("Loading: " + loadPercent + "%");
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  if (loadPercent >= 100) {
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      applyControls(deltaTime, playerCollider.onFloor, camera);
      updatePlayer(deltaTime, worldOctree, camera);
    }
  }

  // Update animations
  const frameDelta = deltaTime * STEPS_PER_FRAME;
  worldAnimationMixers.forEach((mixer) => {
    mixer.update(frameDelta);
  });

  if (playerCollider.onFloor) {
    triggerSystem.checkTriggers();
  }

  const verticalSpeedEffect = THREE.MathUtils.clamp((Math.max(0, (-playerVelocity.y)) / 20) - 1, 0, 10.0);

  // Sun color based on player position
  const colorA = new THREE.Color(0xffffff);
  const colorB = new THREE.Color(0x000000);
  const sunColor = new THREE.Color();
  const fogMin = 200;

  const t = THREE.MathUtils.clamp((fogMin + camera.position.y) / fogMin, 0, 1);

  sunColor.copy(colorA).lerp(colorB, t);

  if (t > 0) {
    // console.log("setting color to: " + sunColor + " t: " + t);
    setSunColor(sunColor);
    setFogDensity(t * 0.18 + 0.02);
  };
  // REMOVE
  // setSunColor(colorA);
  // setFogDensity(0.025);

  // Post effects while falling
  setRadialBlurStrength(verticalSpeedEffect);
  setColorOverlayStrength(Math.pow(verticalSpeedEffect, 2), new THREE.Color(0x000000));

  if (damageOverlayTimer > 0) {
    const t = damageOverlayTimer / DAMAGE_FLASH_TIME;
  
    setColorOverlayStrength(Math.pow(t, 2), new THREE.Color(0xff3333));
  
    damageOverlayTimer -= deltaTime * STEPS_PER_FRAME;
  }

  if ( healthOverlayTimer > 0) {
    setColorOverlayStrength ( Math.pow(healthOverlayTimer / HEALTH_TIMER, 2.0), new THREE.Color(0x3399ff));
    healthOverlayTimer -= (deltaTime * STEPS_PER_FRAME ); // * STEPS_PER_FRAME to restore real time
  }

  if ( respawnOverlayTimer > 0 ) {
    setColorOverlayStrength ( Math.pow(respawnOverlayTimer / (RESPAWN_TIMER), 0.5), new THREE.Color(0xffffff));
    respawnOverlayTimer -= (deltaTime * STEPS_PER_FRAME ); // * STEPS_PER_FRAME to restore real time
  }

  if (loadPercent < 100) {
    ui.clearTriggerMessage();

    setColorOverlayStrength ( 1.0, new THREE.Color(0x000000));

    ui.showTriggerMessage("Loading: " + loadPercent + "%");
  }

  composer.render();
  stats.update();
}

// Resizer
Resizer(camera, renderer, composer);
