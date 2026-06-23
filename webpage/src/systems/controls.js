import * as THREE from "three";

function setupControls(camera, playerVelocity, resetPlayer) {
  const acceleration = 20;
  const maxSpeed = 10;

  let run = false;
  let jump = false;
  let jumpTimer = 0;
  const jumpDelay = 20;

  let onFloor = false;
  let onFloorCounter = 0;
  const onFloorDelay = 4;

  let speed = 0;

  // let disabledMovement = false;
  let inputEnabled = true;

  function setInputEnabled(value) {
    inputEnabled = Boolean(value);
    if (!inputEnabled) {
      run = false;
      jump = false;
    }
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.code === "KeyR") {
        resetPlayer();
      }
      
      if (event.code === "KeyU") {
        // LAZY WAY OF RESETTING THE GAME - FIX THIS LATER
        playerVelocity.copy(new THREE.Vector3(0, -10000, 0));
      }
      /*
      if (event.code === "KeyM") {
        disabledMovement = !disabledMovement;
        if (disabledMovement) {
          document.exitPointerLock();
        } else {
          document.body.requestPointerLock();
        }
        console.log("Movement toggled:", disabledMovement);
      }
      */
    }
  );
  
  /*
  document.body.addEventListener("click", () => {
    if (!disabledMovement && inputEnabled) {
      document.body.requestPointerLock();
    }
  });
  */

  document.body.addEventListener("mousemove", (event) => {
    // if ((document.pointerLockElement === document.body) && !disabledMovement) {
      // X and Y are exchanged -> camera's X axis is up-down
      camera.rotation.y -= event.movementX / 500;
      // Handle vertical camera rotation -> Limits angle
      let newAngleX = camera.rotation.x - event.movementY / 500;
      newAngleX = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, newAngleX));
      camera.rotation.x = newAngleX;
    // }
  });

  // Mouse controls event listener
  document.body.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = true;
      jump = true;

      // Delay jump to make movement feel more responsive
      jumpTimer = jumpDelay;
    }

    // LAZY WAY OF RESETTING THE GAME - FIX THIS LATER
    if (e.button === 1) { // middle mouse button
        playerVelocity.copy(new THREE.Vector3(0, -10000, 0));
    }
  });

  // Run event listener
  document.body.addEventListener("mouseup", (e) => {
    if (e.button === 0) { // 0 = left mouse button
      run = false;
    }
  });

  function applyControls(deltaTime, playerOnFloor, camera) {
    if (!inputEnabled) return;

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

    // if (!disabledMovement) {
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
    // };

    if (onFloor)
      {
      speed = 0;
    }

    onFloorCounter -= 1;

    jumpTimer -= 1;
  }

  return {
    applyControls,
    setInputEnabled,
  };
}

export { setupControls };
