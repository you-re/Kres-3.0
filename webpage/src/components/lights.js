import { HemisphereLight, DirectionalLight } from "three";

function createLights() {
  // Fill Light
  const col1 = 0x000000;
  const col2 = 0xffffff;
  const fillLight1 = new HemisphereLight(col1, col2, 1.5);
  fillLight1.position.set(2, 1, 1);

  // Sun Light
  const directionalLight = new DirectionalLight(col2, 5);
  directionalLight.position.set(-5, 25, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.00006;

  return { fillLight1, directionalLight };
}

export { createLights };
