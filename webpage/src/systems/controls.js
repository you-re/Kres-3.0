import * as THREE from "three";
import { vec3 } from "three/tsl";

function setupControls(camera, playerVelocity, playerDirection, resetPlayer) {
  const keyStates = {};

  const acceleration = 20;
  const maxSpeed = 10;
  const glideSpeed = 0.01;

  let run = false;
  let jump = false;
  let jumpTimer = 0;
  const jumpDelay = 20;

  let onFloor = false;
  let onFloorCounter = 0;
  const onFloorDelay = 4;

  let speed = 0;

  let disabledMovement = false;

  document.addEventListener(
    "keydown",
    (event) => {
      keyStates[event.code] = true;

      // ← Add reset logic here with run/jump
      if (event.code === "KeyR") {
        resetPlayer();
      }

      // Disable or enable player movement
      if (event.code === "KeyM") {
        disabledMovement = !disabledMovement;
        if (disabledMovement) {
          document.exitPointerLock();
        }
        else {
          document.body.requestPointerLock();
        }
        console.log("Movement: ");
      }
    }
  );

  document.addEventListener(
    "keyup",
    (event) => (keyStates[event.code] = false)
  );

  document.body.addEventListener("click", () => {
    if (!disabledMovement) {
      document.body.requestPointerLock()
      }
    }
  );

  document.body.addEventListener("mousemove", (event) => {
    if ((document.pointerLockElement === document.body) && !disabledMovement) {
      camera.rotation.y -= event.movementX / 500;
      camera.rotation.x -= event.movementY / 500;
    }
  });

  // Mouse controls event listener
  document.body.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = true;
      jump = true;

      // Delay jump to make movement feel more responsive
      jumpTimer = jumpDelay;
    }
    /*
    if (e.button === 2) { // 2 = right mouse button
      jump = true;
      jumpTimer = jumpDelay;
    }
    */
  });

  // Run event listener
  document.body.addEventListener("mouseup", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = false;
    }
  });

  function applyControls(deltaTime, playerOnFloor, camera) {

    // Stabilize collision detection over onFloorDelay frames
    if ( playerOnFloor ) {
     onFloorCounter = onFloorDelay;
    }

    if ( onFloorCounter > 0 ) {
      onFloor = true;
    }
    else {
      onFloor = false;
    }

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

    if (!disabledMovement) {
      // Jump
      if (jump && onFloor && jumpTimer > 0) {
        playerVelocity.y = 10;
        jump = false;
        onFloor = false;
      }

      // Run
      if (run && !onFloor) {
        speed += deltaTime * acceleration;
        speed = Math.min(speed, maxSpeed);
        
        let newVelocity = forward.clone().multiplyScalar(speed);
        newVelocity.y = playerVelocity.y;
        playerVelocity.copy(newVelocity);
      }
    };

    if (onFloor)
      {
      speed = 0;
    }

    onFloorCounter -= 1;

    jumpTimer -= 1;
  }

  return applyControls;
}

export { setupControls };
