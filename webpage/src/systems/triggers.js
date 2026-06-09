import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_TRIGGER_RADIUS = 0.5;
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

  if (node.isMesh && node.geometry) {
    node.geometry.computeBoundingSphere();
    const sphere = node.geometry.boundingSphere;
    if (sphere && sphere.radius >= 0) {
      const scale = new THREE.Vector3();
      node.getWorldScale(scale);
      return sphere.radius * Math.max(scale.x, scale.y, scale.z);
    }
  }

  return DEFAULT_TRIGGER_RADIUS;
}

function getTriggerData(triggerId, textMap) {
  // Returns { text: string, duration: number|null }
  const result = { text: "", duration: null };
  if (!triggerId || !textMap) return result;
  const key = String(triggerId).trim();
  if (key === "") return result;

  let entry = undefined;
  if (key in textMap) entry = textMap[key];
  if (entry === undefined) {
    const normalized = key.toLowerCase();
    for (const entryKey of Object.keys(textMap)) {
      if (String(entryKey).toLowerCase() === normalized) {
        entry = textMap[entryKey];
        break;
      }
    }
  }

  if (entry === undefined) return result;

  if (typeof entry === "string") {
    result.text = entry;
    return result;
  }

  if (entry && typeof entry === "object") {
    if (typeof entry.text === "string") result.text = entry.text;
    const d = Number(entry.duration);
    if (!Number.isNaN(d) && d > 0) result.duration = d;
    return result;
  }

  return result;
}

function isTriggerNode(node) {
  if (!node.name) return false;
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
    const data = getTriggerData(triggerId, textMap);
    const text = data.text;
    const duration = data.duration;
    const center = node.getWorldPosition(new THREE.Vector3());

    triggers.push({
      id: triggerId,
      name: node.name,
      center,
      radius,
      text,
      duration,
      object: node,
      triggered: false,
      inside: false,
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
  const TRIGGER_ROTATION_SPEED = Math.PI * 1.0; // radians per second

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
      const insideNow = sphereIntersectsCapsule(trigger.center, trigger.radius, playerCollider);

      if (insideNow) {
        if (!trigger.inside && !trigger.triggered) {
          trigger.triggered = true;
          if (trigger.object) {
            trigger.object.visible = false;
          }
          if (typeof onTrigger === "function") {
            onTrigger(trigger);
          }
        }
        trigger.inside = true;
      } else {
        trigger.inside = false;
      }
    }
  }

  function updateTriggerObjects(deltaTime, elapsedTime) {
    if (!loaded || triggers.length === 0 || !(deltaTime > 0)) return;
    const rotationDelta = TRIGGER_ROTATION_SPEED * deltaTime;
    const transfromDelta = Math.sin(elapsedTime) * 0.005;

    for (const trigger of triggers) {
      if (trigger.object && trigger.object.visible) {
        trigger.object.rotateY(rotationDelta);
        trigger.object.translateY(transfromDelta);
      }
    }
  }

  function resetTriggers() {
    triggers = triggers.map((trigger) => ({
      ...trigger,
      triggered: false,
      inside: false,
    }));
    triggers.forEach((trigger) => {
      if (trigger.object) {
        trigger.object.visible = true;
      }
    });
  }

  return {
    loadTriggers,
    checkTriggers,
    resetTriggers,
    setDebug,
    updateTriggerObjects,
  };
}

export { createTriggerSystem };
