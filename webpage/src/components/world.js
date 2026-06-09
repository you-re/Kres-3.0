import { AnimationMixer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const worldAnimationMixers = [];

function setupWorldMesh(child) {
  if (!child.isMesh) return;
  child.castShadow = true;
  child.receiveShadow = true;
  if (child.material.map) child.material.map.anisotropy = 4;
}

function loadModel(loader, fileName, scene, worldOctree, onLoad) {
  loader.load(fileName, (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);
    gltf.scene.traverse(setupWorldMesh);
    if (typeof onLoad === "function") onLoad(gltf);
  });
}

function loadWorld(scene, worldOctree) {
  // const dracoLoader = new DRACOLoader();
  // dracoLoader.setDecoderPath('/draco/');

  const loader = new GLTFLoader().setPath("./models/");
  // loader.setDRACOLoader(dracoLoader);

  loadModel(loader, "ground.glb", scene, worldOctree);

  loadModel(loader, "mouth.glb", scene, worldOctree, (gltf) => {
    if (gltf.animations && gltf.animations.length) {
      const mixer = new AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      worldAnimationMixers.push(mixer);
    }
  });

  loadModel(loader, "collision-world-01.glb", scene, worldOctree);
  loadModel(loader, "collision-world-02.glb", scene, worldOctree);
  loadModel(loader, "collision-world-03.glb", scene, worldOctree);
  loadModel(loader, "collision-world-04.glb", scene, worldOctree);
  loadModel(loader, "collision-world-05.glb", scene, worldOctree);
}

export { loadWorld, worldAnimationMixers };