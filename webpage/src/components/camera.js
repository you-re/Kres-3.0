import { PerspectiveCamera, Object3D, AnimationMixer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function createCamera(scene) {
  const camera = new PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.rotation.order = "YXZ";
  camera.position.set(0, 1.6, 2);

  const player = new Object3D();
  player.add(camera);

  return { camera, player };
}


export { createCamera };
