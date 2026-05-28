import { Scene, Color, Fog, FogExp2 } from "three";

function createScene() {
  const scene = new Scene();
  const color = 0x110000;
  scene.background = new Color(color);
  // scene.fog = new Fog(color, 5, 40); // color, near, far
  scene.fog = new FogExp2(color, 0.1);
  return scene;
}

export { createScene };