import { HemisphereLight, DirectionalLight } from "three";

function createLights() {
  let sunColor = 0xffffff;
  let horizonColor = 0x000000;

  // Fill Light
  const fillLight1 = new HemisphereLight(horizonColor, sunColor, 1.5);
  fillLight1.position.set(0, 0, 0);

  // Sun Light
  const directionalLight = new DirectionalLight(sunColor, 5);
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

  function setSunColor(value) {
    sunColor = value;

    directionalLight.color.set(sunColor);
    fillLight1.color.set(value)
  }

  function setHorizonColor(value) {
    horizonColor = value;
    
    fillLight1.groundColor.set(horizonColor);
  }

  return {
    fillLight1,
    directionalLight,
    setSunColor,
    setHorizonColor
  };
}

export { createLights };
