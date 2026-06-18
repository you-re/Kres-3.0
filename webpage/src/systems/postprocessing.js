import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { ACESFilmicToneMappingShader } from "three/examples/jsm/shaders/ACESFilmicToneMappingShader.js";
import { Vector2, Color } from "three";
import { RadialEdgeBlurShader } from "../shaders/radialEdgeBlurShader.js";
import { ColorOverlayShader } from "../shaders/colorOverlayShader.js";

function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);

  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    1.2,
    0.1,
    0.5
  );
  bloomPass.threshold = 1.2;
  bloomPass.strength = 0.1;
  bloomPass.radius = 0.5;

  composer.addPass(bloomPass);

  const radialBlurPass = new ShaderPass(RadialEdgeBlurShader);
  composer.addPass(radialBlurPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.material.uniforms.resolution.value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
  composer.addPass(fxaaPass);

  const toneMapPass = new ShaderPass(ACESFilmicToneMappingShader);
  toneMapPass.material.uniforms.exposure.value = 1.0;
  composer.addPass(toneMapPass);

  const colorOverlayPass = new ShaderPass(ColorOverlayShader);
  composer.addPass(colorOverlayPass);

  return {
    composer,
    setRadialBlurStrength(value) {
      radialBlurPass.material.uniforms.strength.value = value;
    },
    setColorOverlayStrength(value, color = new Color(0x000000)) {
      colorOverlayPass.material.uniforms.strength.value = value;
      colorOverlayPass.material.uniforms.overlayColor.value = color;
    }
  };
}

export { createComposer };