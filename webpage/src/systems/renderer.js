import { WebGLRenderer, VSMShadowMap, NoToneMapping } from "three";

function createRenderer(animate) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (typeof animate === "function") {
    renderer.setAnimationLoop(animate);
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.toneMapping = NoToneMapping;
  return renderer;
}

export { createRenderer };
