// Color utility helpers
function parseHexColor(hex) {
  const normalizedHex = String(hex).replace("#", "");
  const value = parseInt(normalizedHex, 16) || 0;
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

function formatHexColor({ r, g, b }) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h = h * 60;
  }

  return { h: h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  s = s / 100;
  l = l / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const tR = hk + 1 / 3;
  const tG = hk;
  const tB = hk - 1 / 3;

  function hue2rgb(pv, qv, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return pv + (qv - pv) * 6 * t;
    if (t < 1 / 2) return qv;
    if (t < 2 / 3) return pv + (qv - pv) * (2 / 3 - t) * 6;
    return pv;
  }

  const r = Math.round(hue2rgb(p, q, tR) * 255);
  const g = Math.round(hue2rgb(p, q, tG) * 255);
  const b = Math.round(hue2rgb(p, q, tB) * 255);
  return { r, g, b };
}

function lerpHueColor(startHex, endHex, t) {
  const startRgb = parseHexColor(startHex);
  const endRgb = parseHexColor(endHex);
  const startHsl = rgbToHsl(startRgb);
  const endHsl = rgbToHsl(endRgb);

  // shortest hue interpolation
  let delta = ((endHsl.h - startHsl.h + 540) % 360) - 180;
  const h = (startHsl.h + delta * t + 360) % 360;
  const s = startHsl.s + (endHsl.s - startHsl.s) * t;
  const l = startHsl.l + (endHsl.l - startHsl.l) * t;

  const rgb = hslToRgb({ h, s, l });
  return formatHexColor(rgb);
}

function createUI({ onTriggerMessageShown, onTriggerMessageHidden } = {}) {
  const uiRoot = document.createElement("div");
  uiRoot.id = "ui-root";
  uiRoot.innerHTML = `
    <div id="health-widget">
      <div id="health-container">
        <div id="health-fill">
          <div id="health-fill-inner"></div>
        </div>
        <div id="health-bar-art"></div>
      </div>
      <!--
      <div id="health-text">Health: 100 / 100</div>
    </div>
    -->
    <div id="trigger-message" class="hidden" role="dialog" aria-live="polite">
      <p id="trigger-message-text"></p>
    </div>
  `;

  document.body.appendChild(uiRoot);

  const healthFillInner = uiRoot.querySelector("#health-fill-inner");
  const healthText = uiRoot.querySelector("#health-text");
  const triggerMessage = uiRoot.querySelector("#trigger-message");
  const triggerMessageText = uiRoot.querySelector("#trigger-message-text");

  const colorLow = "#ff1100";
  const colorHigh = "#0091ff";

  function updateHealth(value) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    if (healthFillInner) healthFillInner.style.width = `${normalized}%`;
    if (healthText) healthText.textContent = `Health: ${normalized} / 100`;

    if (healthFillInner) {
      const t = Math.pow(normalized / 100, 0.1);
      const color = lerpHueColor(colorLow, colorHigh, t);
      healthFillInner.style.backgroundColor = color;
    }
  }

  const TRIGGER_DISMISS_LOCK = 400;
  let dismissEnabled = false;
  let dismissEnableTimeout = null;

  function showTriggerMessage(message) {
    if (!triggerMessage || !triggerMessageText) return;
    if (dismissEnableTimeout) {
      clearTimeout(dismissEnableTimeout);
      dismissEnableTimeout = null;
    }

    dismissEnabled = false;
    triggerMessageText.textContent = message;
    triggerMessage.classList.remove("hidden");
    if (typeof onTriggerMessageShown === "function") {
      onTriggerMessageShown();
    }
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    dismissEnableTimeout = setTimeout(() => {
      dismissEnabled = true;
      dismissEnableTimeout = null;
    }, TRIGGER_DISMISS_LOCK);
  }

  function clearTriggerMessage() {
    if (!triggerMessage) return;
    triggerMessage.classList.add("hidden");
    triggerMessageText.textContent = "";
    if (typeof onTriggerMessageHidden === "function") {
      onTriggerMessageHidden();
    }
  }

  function onTriggerMessageClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!dismissEnabled) return;

    clearTriggerMessage();
    if (document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  }

  if (triggerMessage) {
    triggerMessage.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    triggerMessage.addEventListener("click", onTriggerMessageClick);
    triggerMessage.addEventListener("pointerup", onTriggerMessageClick);
  }

  return {
    updateHealth,
    showTriggerMessage,
    clearTriggerMessage,
  };
}

export { createUI };