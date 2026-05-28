import * as THREE from "three";
import { vec3 } from "three/tsl";

function setupControls(camera, playerVelocity, playerDirection, resetPlayer, setIsRunning) {
  const keyStates = {};

  const acceleration = 20;
  const maxSpeed = 10;
  const glideSpeed = 0.01;

  let run = false;
  let jump = false;
  let jumpTimer = 0;
  const jumpDelay = 20;

  let speed = 0;

  document.addEventListener(
    "keydown",
    (event) => {
      keyStates[event.code] = true;

      // ← Add reset logic here with run/jump
      if (event.code === "KeyR") {
        resetPlayer();
      }
    }
  );

  document.addEventListener(
    "keyup",
    (event) => (keyStates[event.code] = false)
  );

  document.body.addEventListener("click", () =>
    document.body.requestPointerLock()
  );

  document.body.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === document.body) {
      camera.rotation.y -= event.movementX / 500;
      camera.rotation.x -= event.movementY / 500;
    }
  });

  // Mouse controls event listener
  document.body.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = true;
    }
    if (e.button === 2) { // 2 = right mouse button
      jump = true;
      jumpTimer = jumpDelay;
    }
  });

  // Run event listener
  document.body.addEventListener("mouseup", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = false;
    }
  });

  function applyControls(deltaTime, playerOnFloor, camera) {
    const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

    // ✅ Manually update the camera's world matrix
    camera.updateMatrixWorld();

    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();

    // ✅ Use matrixWorld here safely
    if (camera.matrixWorld) {
      forward.setFromMatrixColumn(camera.matrixWorld, 0);
      forward.crossVectors(camera.up, forward).normalize();

      side.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    }

    // Jump
    if (jump && playerOnFloor && jumpTimer > 0) {
      playerVelocity.y = 10;
      jump = false;
      playerOnFloor = false;
    }

    jumpTimer -= 1;

    // Run
    if (run) {
      speed += deltaTime * acceleration;
      speed = Math.min(speed, maxSpeed);
      
      let newVelocity = forward.clone().multiplyScalar(speed);
      newVelocity.y = playerVelocity.y;
      playerVelocity.copy(newVelocity);
    }
    else if (!run && playerOnFloor)
      {
      speed = 0;
    }

    setIsRunning(run);

    console.log(playerOnFloor);
  }

  return applyControls;
}

export { setupControls };
