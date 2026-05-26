import { GUI } from "lil-gui";

export function createDebugGUI({ onInfiniteFallingChange } = {}) {
  const gui = new GUI({ width: 200 });

  gui.add({ infiniteFalling: false }, "infiniteFalling").onChange((value) => {
    console.log("Infinite Falling:", value);
    if (typeof onInfiniteFallingChange === "function") {
      onInfiniteFallingChange(value);
    }
  });

  gui.add({RESET: "R resets"}, "RESET").disable();
  gui.add({RUN: "Left click → RUN"}, "RUN").disable();
  gui.add({JUMP: "Right click → JUMP"}, "JUMP").disable();
  
  return gui;
}
