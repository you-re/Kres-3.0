import * as THREE from "three";
import { Capsule } from "three/examples/jsm/Addons.js";
import { Octree } from "three/examples/jsm/Addons.js";
import { createRenderer } from "./renderer";

// Animations
import { createCamera, playGunAnimation } from "../components/camera";

const GRAVITY = 20;
const STEPS_PER_FRAME = 5;

// Animation Variables
const renderer = createRenderer();
const clock = new THREE.Clock();
let mixer = null; // ✅ Global mixer for animations
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

function createPhysics(scene) {
  const worldOctree = new Octree();

  const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35
  );
  playerCollider.onFloor = false;

  const playerVelocity = new THREE.Vector3();
  const playerDirection = new THREE.Vector3();
  let playerOnFloor = false;

  // Function to reset the player
  function resetPlayer(x = 0, y = 0.35, z = 0) {
    playerVelocity.set(0, 0, 0);

    playerCollider.start.set(x, y, z);
    playerCollider.end.set(x, y + 0.65, z); // keep capsule height

    camera.position.copy(playerCollider.end);
  }

  // ⚙️💡SHOOTER CONTROLS & SOUNDS
  /*

  // 🎵 **Preload Sounds**
  const sounds = {
    reload: new Audio("/sounds/reload.mp3"),
  };

  // Reload flag to prevent shooting during reload
  let isReloading = false; // Prevent shooting during reload
  let isAnimationPlaying = false; // Flag to track if animation is playing

  // ✅ **Play Animation + Sound**
  function playAction(
    animationName,
    soundKey,
    autoIdle = true,
    idleDelay = 300
  ) {
    if (isAnimationPlaying) return; // Prevent animation overlap

    isAnimationPlaying = true; // Mark animation as playing
    playGunAnimation(animationName); // ✅ Play animation

    // **Play the sound**
    if (soundKey && sounds[soundKey]) {
      sounds[soundKey].pause(); // Stop any existing sound
      sounds[soundKey].currentTime = 0; // Restart sound
      sounds[soundKey].play();
    }

    // **Return to idle after action (if applicable)**
    if (autoIdle) {
      setTimeout(() => {
        playGunAnimation("Armature|Idle");
        isAnimationPlaying = false; // Reset animation state after idle
      }, idleDelay);
    }

    // Handle reload animation completion
    if (animationName === "Armature|Reload") {
      setTimeout(() => {
        isReloading = false; // Allow shooting again after reload
        isAnimationPlaying = false; // Mark reload animation as complete
      }, 3000); // Adjust timing based on reload animation duration (3 seconds here)
    }
  }


  // ✅ **Ensure Animation Updates Every Frame**
  function update(deltaTime) {
    if (mixer) mixer.update(deltaTime);
  }

  // **Run Animation in Game Loop**
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    update(delta); // Keep animations running
    renderer.render(scene, camera);
  });
  
  */
  //   -----END----SHOOTER WITH AUDIO AND GUN LOAD-----

  // Check for infinite falling
  let infiniteFalling = false;

  function setInfiniteFalling(value) {
    infiniteFalling = value;
  }

  // Check if running
  let isRunning = false;

  function setIsRunning(value) {
    isRunning = value;
  }

  function updatePlayer(deltaTime, worldOctree, camera) {
    if (!playerCollider || !playerCollider.end) return;

    // PROBABLY NOT NEEDED ANYMORE
    let dampingStrength = isRunning ? 0 : 32;

    let damping = Math.exp(-dampingStrength * deltaTime) - 1;

    if (!playerOnFloor) {
      playerVelocity.y -= GRAVITY * deltaTime;
      damping *= 0.01;
    }

    // Player movement damping
    playerVelocity.addScaledVector(playerVelocity, damping);
    playerCollider.translate(playerVelocity.clone().multiplyScalar(deltaTime));

    const result = worldOctree.capsuleIntersect(playerCollider);
    playerOnFloor = result ? result.normal.y > 0 : false;
    playerCollider.onFloor = playerOnFloor;

    if (result) {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
      playerCollider.translate(result.normal.multiplyScalar(result.depth * 0.9));
    }

    if (playerCollider && playerCollider.end) {
      camera.position.copy(playerCollider.end);
    }

    // Reset player if falling too fast
    if ((playerVelocity.y < -20) && !infiniteFalling) {
      resetPlayer();
    }
  }

  return {
    playerCollider,
    playerVelocity,
    playerDirection,
    updatePlayer,
    worldOctree,
    setInfiniteFalling,
    resetPlayer,
    setIsRunning
  };
}

export { createPhysics, STEPS_PER_FRAME };