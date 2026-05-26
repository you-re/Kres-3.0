import * as THREE from "three";

function setupControls(camera, playerVelocity, playerDirection, resetPlayer) {
  const keyStates = {};

  let run = false;
  let jump = false;
  let jumpTimer = 0;
  const jumpDelay = 20;

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

  // Jump event listener
  document.body.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = true;
    }
    if (e.button === 2) { // 2 = right mouse button
      jump = true;
      jumpTimer = jumpDelay;
    }
  });

  // Jump event listener
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
    
    // if (keyStates["KeyW"])
      // playerVelocity.add(forward.clone().multiplyScalar(speedDelta));
    // if (keyStates["KeyS"])
      // playerVelocity.add(forward.clone().multiplyScalar(-speedDelta));
    // if (keyStates["KeyA"])
      // playerVelocity.add(side.clone().multiplyScalar(-speedDelta));
    // if (keyStates["KeyD"])
      // playerVelocity.add(side.clone().multiplyScalar(speedDelta));

    // Run forward
    if (run) {
      playerVelocity.add(forward.clone().multiplyScalar(speedDelta));
    }

    // Jump
    if (jump && playerOnFloor && jumpTimer > 0) {
      playerVelocity.y = 15;
      jump = false;
    }

    jumpTimer -= 1;
  }

  return applyControls;
}

export { setupControls };
