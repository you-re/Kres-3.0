import { AnimationMixer } from "three";
import { LoadingManager } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const worldAnimationMixers = [];

function setupWorldMesh(child, shadows = true) {
  if (!child.isMesh) return;

  child.castShadow = shadows;
  child.receiveShadow = shadows;

  if (child.material.map) {
    child.material.map.anisotropy = 4;
  }
}

function loadModel(loader, fileName, scene, worldOctree, onLoad, shadows = true) {
  loader.load(fileName, (gltf) => {
    scene.add(gltf.scene);

    if (worldOctree) {
      worldOctree.fromGraphNode(gltf.scene);
    }

    gltf.scene.traverse((child) => setupWorldMesh(child, shadows));

    if (typeof onLoad === "function") {
      onLoad(gltf);
    }
  });
}

function loadWorld(scene, worldOctree, onProgress, onComplete) {
  const manager = new LoadingManager();

  manager.onProgress = (url, loaded, total) => {
    const percent = Math.round((loaded / total) * 100);
    console.log("Progress:", url, loaded, total);

    if (onProgress) {
      onProgress(percent);
    }
  };

  manager.onLoad = () => {
    console.log("ALL LOADED");
  };

  const loader = new GLTFLoader(manager).setPath("./models/");
  
  // Top collider and ground under player
  loadModel(loader, "spawn.gltf", scene, worldOctree, null, false);
  loadModel(loader, "invisible-collisions.gltf", scene, worldOctree, null, false);

  loadModel(loader, "ground.gltf", scene, worldOctree);

  /*
  loadModel(loader, "mouth.gltf", scene, worldOctree, (gltf) => {
    if (gltf.animations && gltf.animations.length) {
      const mixer = new AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      worldAnimationMixers.push(mixer);
    }
  });
  */

  loadModel(loader, "collision-world-01.gltf", scene, worldOctree);
  loadModel(loader, "collision-world-02.gltf", scene, worldOctree);
  loadModel(loader, "collision-world-03.gltf", scene, worldOctree);
  loadModel(loader, "collision-world-04.gltf", scene, worldOctree);
  loadModel(loader, "collision-world-05.gltf", scene, worldOctree);

  // loadModel(loader, "bottom.gltf", scene, worldOctree);
}

export { loadWorld, worldAnimationMixers };