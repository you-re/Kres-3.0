import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

function loadWorld(scene, worldOctree, setInfiniteFalling) {

  // const dracoLoader = new DRACOLoader();
  // dracoLoader.setDecoderPath('/draco/');

  // IMPLEMENT CHUNK LOADING
  const loader = new GLTFLoader().setPath("/models/");
  // loader.setDRACOLoader(dracoLoader);

  // Load ground
  loader.load("ground.glb", (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material.map) child.material.map.anisotropy = 4;
      }
    });
  });

  // Load mouth
  loader.load("mouth.glb", (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material.map) child.material.map.anisotropy = 4;
      }
    });
  });

  loader.load("collision-world.glb", (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material.map) child.material.map.anisotropy = 4;
      }
    });
  });
}

export { loadWorld };