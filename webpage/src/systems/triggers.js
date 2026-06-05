import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_TRIGGER_RADIUS = 2.0;
const TRIGGER_DATA_URL = `${import.meta.env.BASE_URL}data/triggers.json`;

function loadTriggerTextMap(url = TRIGGER_DATA_URL) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load trigger text map: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.warn(error);
      return {};
    });
}

function getTriggerId(node) {
  if (!node.name) return null;
  const name = String(node.name).trim();
  if (!name) return null;
  return node.userData?.triggerID || node.userData?.id || name;
}

function getTriggerRadius(node) {
  const raw = node.userData?.radius || node.userData?.triggerRadius || node.userData?.r;
  const parsed = Number(raw);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  return DEFAULT_TRIGGER_RADIUS;
}

function getTriggerText(triggerId, textMap) {
  if (!triggerId || !textMap) return "";
  const key = String(triggerId).trim();
  if (key === "") return "";
  if (key in textMap) return textMap[key];

  const normalized = key.toLowerCase();
  for (const entryKey of Object.keys(textMap)) {
    if (String(entryKey).toLowerCase() === normalized) {
      return textMap[entryKey];
    }
  }

  return "";
}

function isTriggerNode(node) {
  if (!node.name || node.isMesh) return false;
  const lowerName = String(node.name).toLowerCase();
  if (lowerName.includes("trigger") || lowerName.includes("start_game")) return true;
  return node.userData && Object.keys(node.userData).length > 0;
}

function extractTriggersFromScene(root, textMap, scene) {
  const triggers = [];

  root.traverse((node) => {
    if (!node.isObject3D) return;
    if (!isTriggerNode(node)) return;

    const triggerId = getTriggerId(node);
    if (!triggerId) return;

    const radius = getTriggerRadius(node);
    const text = getTriggerText(triggerId, textMap);
    const center = node.getWorldPosition(new THREE.Vector3());

    triggers.push({
      id: triggerId,
      name: node.name,
      center,
      radius,
      text,
      triggered: false,
    });
  });

  return triggers;
}

function sphereIntersectsCapsule(sphereCenter, sphereRadius, capsule) {
  const line = new THREE.Line3(capsule.start, capsule.end);
  const closestPoint = new THREE.Vector3();
  line.closestPointToPoint(sphereCenter, true, closestPoint);
  return closestPoint.distanceTo(sphereCenter) <= sphereRadius + (capsule.radius || 0);
}

function createTriggerSystem({ scene, playerCollider, onTrigger, debug = false }) {
  let triggers = [];
  let loaded = false;
  let showDebugSpheres = debug;
  let debugSpheres = [];

  function createDebugSpheres() {
    clearDebugSpheres();
    for (const trigger of triggers) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(trigger.radius, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0x00ffcc,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
          depthTest: false,
        })
      );
      sphere.position.copy(trigger.center);
      scene.add(sphere);
      debugSpheres.push(sphere);
    }
  }

  function clearDebugSpheres() {
    debugSpheres.forEach((sphere) => {
      if (sphere.parent) sphere.parent.remove(sphere);
    });
    debugSpheres = [];
  }

  function loadTriggers() {
    return loadTriggerTextMap().then((textMap) => {
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader().setPath("./models/");
        loader.load(
          "triggers.glb",
          (gltf) => {
            scene.add(gltf.scene);
            triggers = extractTriggersFromScene(gltf.scene, textMap, scene);
            loaded = true;
            if (showDebugSpheres && triggers.length > 0) {
              createDebugSpheres();
              console.log(
                "Trigger system loaded:",
                triggers.map((trigger) => ({
                  id: trigger.id,
                  name: trigger.name,
                  radius: trigger.radius,
                  text: trigger.text ? "[mapped]" : "[missing]",
                }))
              );
            }
            if (triggers.length === 0) {
              console.warn("No trigger nodes were found in triggers.glb.");
            }
            resolve(triggers);
          },
          undefined,
          (error) => {
            console.error("Failed to load triggers.glb", error);
            reject(error);
          }
        );
      });
    });
  }

  function setDebug(value) {
    showDebugSpheres = Boolean(value);
    if (!loaded) return;
    if (showDebugSpheres) {
      createDebugSpheres();
    } else {
      clearDebugSpheres();
    }
  }

  function checkTriggers() {
    if (!loaded || triggers.length === 0) return;
    if (!playerCollider) return;

    for (const trigger of triggers) {
      if (trigger.triggered) continue;
      if (sphereIntersectsCapsule(trigger.center, trigger.radius, playerCollider)) {
        trigger.triggered = true;
        if (typeof onTrigger === "function") {
          onTrigger(trigger);
        }
      }
    }
  }

  function resetTriggers() {
    triggers = triggers.map((trigger) => ({ ...trigger, triggered: false }));
  }

  return {
    loadTriggers,
    checkTriggers,
    resetTriggers,
    setDebug,
  };
}

export { createTriggerSystem };
