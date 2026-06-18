import * as THREE from "three";
import { Capsule } from "three/examples/jsm/Addons.js";
import { Octree } from "three/examples/jsm/Addons.js";
import { createRenderer } from "./renderer";

const GRAVITY = 25;
const STEPS_PER_FRAME = 5;

const dampingStrength = 32; 

// Damage system
let recievingDamage = false;
let damageGiven = 0;

// Animation Variables
const renderer = createRenderer();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

function createPhysics( scene, giveDamage ) {
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

  // Check for infinite falling
  let infiniteFalling = false;

  function setInfiniteFalling(value) {
    infiniteFalling = value;
  }

  // Function to reset the player
  function resetPlayer(x = 0, y = 0.35, z = 0) {
    playerVelocity.set(0, 0, 0);

    playerCollider.start.set(x, y, z);
    playerCollider.end.set(x, y + 0.65, z); // keep capsule height

    camera.position.copy(playerCollider.end);
  }

  function updatePlayer(deltaTime, worldOctree, camera) {
    if (!playerCollider || !playerCollider.end) return;

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
    };

    if ( !infiniteFalling ) {

      if (playerVelocity.y < -20) {
        recievingDamage = true;
        damageGiven = Math.min(0, playerVelocity.y);
        // console.log("Velocity: " + playerVelocity.y)
      }

      if ( playerOnFloor && recievingDamage ) {
          giveDamage(Math.abs(damageGiven));
          // console.log("Damage given: " + damageGiven);
          damageGiven = 0;
          recievingDamage = false;
      }

      // Reset player if falling too fast
      if ((playerVelocity.y < -40)) {
        giveDamage(0, true);
        recievingDamage = false;
      }
    };
  }

  return {
    playerCollider,
    playerVelocity,
    playerDirection,
    updatePlayer,
    worldOctree,
    setInfiniteFalling,
    resetPlayer
  };
}

export { createPhysics, STEPS_PER_FRAME };