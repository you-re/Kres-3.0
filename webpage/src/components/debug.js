import { GUI } from "lil-gui";

export function createDebugGUI({ onInfiniteFallingChange } = {}) {
  const gui = new GUI({ width: 200 });

  gui.add({ infiniteFalling: false }, "infiniteFalling").onChange((value) => {
    console.log("Infinite Falling:", value);
    if (typeof onInfiniteFallingChange === "function") {
      onInfiniteFallingChange(value);
    }
  });

  gui.addColor({ fogColor: 0x000000 }, "fogColor");
  gui.add({ fogDensity: 0.1 }, "fogDensity", 0, 1, 0.0001);

  gui.addColor({ hemisphereTopColor: 0xffffff }, "hemisphereTopColor");
  gui.addColor({ hemisphereBottomColor: 0x000000 }, "hemisphereBottomColor");
  gui.add({ fogDensity: 0.0025 }, "fogDensity", 0, 0.1, 0.0001);


  gui.add({RESET: "R resets"}, "RESET").disable();
  gui.add({RUN: "Left click → RUN"}, "RUN").disable();
  gui.add({JUMP: "Right click → JUMP"}, "JUMP").disable();
  
  return gui;
}
