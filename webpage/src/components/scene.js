import { Scene, Color, Fog, FogExp2 } from "three";

function createScene() {
  let fogColor = 0x000000;
  let fogDensity = 0.05;

  const scene = new Scene();
  const color = 0x000000;
  scene.background = new Color(color);
  // scene.fog = new Fog(color, 5, 40); // color, near, far
  scene.fog = new FogExp2(color, fogDensity);

  function setFogColor(value) {
    const c = new Color(value);

    scene.background.set(c);    
    scene.fog.color.set(c);
  }

  function setFogDensity(value) {
    fogDensity = value;
    scene.fog.density = value;
  }

  return {
    scene,
    setFogColor,
    setFogDensity
  };
}

export { createScene };