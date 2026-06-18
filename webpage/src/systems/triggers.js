import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_TRIGGER_RADIUS = 1.0;
const BASE_URL = import.meta.env.BASE_URL || "/";
const TRIGGER_TEXT_URL = `${BASE_URL}data/triggers.json`;
const TRIGGER_MODEL_BASE_PATH = `${BASE_URL}models/`;

function loadTriggerTextMap(url = TRIGGER_TEXT_URL) {
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

function getTriggerId(object) {
  if (!object.name) return null;
  const name = String(object.name).trim();
  if (!name) return null;
  return object.userData?.triggerID || object.userData?.id || name;
}

function getTriggerRadius(object) {
  const radiusValue =
    object.userData?.radius ||
    object.userData?.triggerRadius ||
    object.userData?.r;
  const radius = Number(radiusValue);
  return Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_TRIGGER_RADIUS;
}

function getTriggerText(triggerId, textMap) {
  if (!triggerId || !textMap) return "";

  const trimmedId = String(triggerId).trim();
  if (trimmedId === "") return "";
  if (trimmedId in textMap) {
    const textMessage = textMap[trimmedId];
    if (typeof textMessage === "string") return textMessage;
    if (textMessage && typeof textMessage === "object") {
      if (typeof textMessage.text === "string") return textMessage.text;
      // fallback to JSON string if value is not the expected shape
      return String(textMessage);
    }
    return String(textMessage);
  }

  const lowerId = trimmedId.toLowerCase();
  for (const key of Object.keys(textMap)) {
    if (String(key).toLowerCase() === lowerId) {
      const textMessage = textMap[key];
      if (typeof textMessage === "string") return textMessage;
      if (textMessage && typeof textMessage === "object" && typeof textMessage.text === "string") return textMessage.text;
      return String(textMessage);
    }
  }

  return "";
}

function isTriggerNode(object) {
  if (!object.name || object.isMesh) return false;
  const lowerName = String(object.name).toLowerCase();
  if (lowerName.includes("trigger")) return true;
  return (
    lowerName.includes("trigger") ||
    object.userData?.trigger === true ||
    object.userData?.triggerID
  );
}

function createTriggersFromScene(root, textMap) {
  const triggers = [];

  root.traverse((child) => {
    if (!child.isObject3D || !isTriggerNode(child)) return;

    const id = getTriggerId(child);
    if (!id) return;

    const radius = getTriggerRadius(child);
    const text = getTriggerText(id, textMap);
    const center = child.getWorldPosition(new THREE.Vector3());

    triggers.push({
      id,
      name: child.name,
      object: child,
      center,
      radius,
      text,
      triggered: false,
      inside: false,
    });
  });

  return triggers;
}

function createDebugSpheres(scene, triggers) {
  const wireframes = [];
  for (const trigger of triggers) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(trigger.radius, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xff1144,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        depthTest: false,
      })
    );
    sphere.position.copy(trigger.center);
    scene.add(sphere);
    wireframes.push(sphere);
  }
  return wireframes;
}

function isPlayerInsideTrigger(trigger, playerCollider) {
  if (!playerCollider || !playerCollider.start || !playerCollider.end) return false;

  // Compute closest point on the player's capsule segment to the trigger center
  const a = playerCollider.start.clone();
  const b = playerCollider.end.clone();
  const p = trigger.center.clone();

  const ab = b.clone().sub(a);
  const abLenSq = ab.lengthSq();

  let t = 0;
  if (abLenSq > 0) {
    const ap = p.clone().sub(a);
    t = ap.dot(ab) / abLenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const closestPoint = a.clone().add(ab.multiplyScalar(t));
  const playerRadius = playerCollider.radius || 0;

  return closestPoint.distanceTo(p) <= trigger.radius + playerRadius;
}

function createTriggerSystem(scene, playerCollider, onTrigger, restoreHealth, options = {}) {
  let triggers = [];
  let debugHelpers = [];
  let loaded = false;
  let debug = options.debug === true;

  function addDebugHelpers() {
    removeDebugHelpers();
    debugHelpers = createDebugSpheres(scene, triggers);
  }

  function removeDebugHelpers() {
    for (const helper of debugHelpers) {
      if (helper.parent) helper.parent.remove(helper);
    }
    debugHelpers = [];
  }

  function setDebug(enabled) {
    debug = enabled;
    if (!loaded) return;
    if (debug) addDebugHelpers();
    else removeDebugHelpers();
  }

  async function loadTriggers() {
    const textMap = await loadTriggerTextMap(options.textUrl);
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader().setPath(TRIGGER_MODEL_BASE_PATH);
      loader.load(
        "triggers.glb",
        (gltf) => {
          scene.add(gltf.scene);
          triggers = createTriggersFromScene(gltf.scene, textMap);
          loaded = true;
          if (debug && triggers.length > 0) addDebugHelpers();
          if (triggers.length === 0) {
            console.warn("No trigger nodes were found in triggers.glb.");
          } else {
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
          resolve(triggers);
        },
        undefined,
        reject
      );
    });
  }

  function checkTriggers() {
    if (!loaded || triggers.length === 0 || !playerCollider) return;
    for (const trigger of triggers) {
      const inside = isPlayerInsideTrigger(trigger, playerCollider);

      if (inside) {
        if (!trigger.inside) {
          trigger.inside = true;
          if (!trigger.triggered) {
            trigger.triggered = true;
            
            // Hide the trigger object
            // console.log(trigger);
            if ( trigger.object ) {
                trigger.object.visible = false;
            }

            if (typeof onTrigger === "function") {
                onTrigger(trigger);
                restoreHealth();
            }
          }
        }
      } else {
        // player is outside the trigger
        if (trigger.inside) {
          // player just exited
          trigger.inside = false;
          if (typeof options.onTriggerExit === "function") {
            try {
              options.onTriggerExit(trigger);
            } catch (err) {
              console.error("onTriggerExit handler threw:", err);
            }
          }
        }
      }
    }
  }

  function resetTriggers() {
    for (const trigger of triggers) {
        trigger.triggered = false;
        trigger.inside = false;
        trigger.object.visible = true;
      }
  }

  return {
    loadTriggers,
    checkTriggers,
    resetTriggers,
    setDebug,
  };
}

export { createTriggerSystem };
