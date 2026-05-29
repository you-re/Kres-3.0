import { GUI } from "lil-gui";

export function createDebugGUI({ onInfiniteFallingChange, setFogColor, setFogDensity, setSunColor, setHorizonColor } = {}) {
  const gui = new GUI({ width: 200 });

  const params = {
    infiniteFalling: false,
    fogColor: "#000000",
    fogDensity: 0.05,
    sunColor: "#ffffff",
    horizonColor: "#000000",
  };  

  gui.add(params, "infiniteFalling").onChange((value) => {
    console.log("Infinite Falling:", value);
    if (typeof onInfiniteFallingChange === "function") {
      onInfiniteFallingChange(value);
    }
  });

  gui.addColor(params, "fogColor").onChange((value) => {
    console.log("Fog color:", value.toString(16));
    if (typeof setFogColor === "function") {
      setFogColor(value);
    }
  });

  gui.add(params, "fogDensity", 0, 1, 0.0001).onChange((value) => {
    console.log("Fog density:", value);
    if (typeof setFogDensity === "function") {
      setFogDensity(value);
    }
  });

  gui.addColor(params, "sunColor").onChange((value) => {
    console.log("Sun color:", value.toString(16));
    if (typeof setSunColor === "function") {
      setSunColor(value);
    }
  });

  gui.addColor(params, "horizonColor").onChange((value) => {
    console.log("Horizon color:", value.toString(16));
    if (typeof setHorizonColor === "function") {
      setHorizonColor(value);
    }
  });
    
  return gui;
}
