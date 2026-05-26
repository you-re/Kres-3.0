import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function loadWorld(scene, worldOctree, setInfiniteFalling) {
  const loader = new GLTFLoader().setPath("./models/");
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