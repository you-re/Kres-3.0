// Minimal color helpers used by the health bar.
function parseHexColor(hex) {
  const v = parseInt(String(hex).replace("#", ""), 16) || 0;
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function formatHexColor({ r, g, b }) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = (h * 60 + 360) % 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100; h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255); return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2 = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p;
  };
  return {
    r: Math.round(hue2(h + 1/3) * 255),
    g: Math.round(hue2(h) * 255),
    b: Math.round(hue2(h - 1/3) * 255),
  };
}

function lerpHueColor(aHex, bHex, t) {
  const a = rgbToHsl(parseHexColor(aHex));
  const b = rgbToHsl(parseHexColor(bHex));
  let dh = ((b.h - a.h + 540) % 360) - 180;
  const h = (a.h + dh * t + 360) % 360;
  const s = a.s + (b.s - a.s) * t;
  const l = a.l + (b.l - a.l) * t;
  return formatHexColor(hslToRgb({ h, s, l }));
}

function createUI(options = {}) {
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

  const colorLow = "#671f1a";
  const colorHigh = "#ff0000";
  // trigger messages are purely visual; input/pointerlock handled by game systems

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

  function showTriggerMessage(text) {
    if (!triggerMessage || !triggerMessageText) return;
    triggerMessageText.textContent = text;
    triggerMessage.classList.remove("hidden");
    if (typeof options.onTriggerMessageShown === "function") {
      try { options.onTriggerMessageShown(); } catch (err) { console.error("onTriggerMessageShown handler threw:", err); }
    }
  }

  function clearTriggerMessage() {
    if (!triggerMessage || !triggerMessageText) return;

    triggerMessage.classList.add("hidden");
    triggerMessageText.textContent = "";

    if (typeof options.onTriggerMessageHidden === "function") {
      try { options.onTriggerMessageHidden(); } catch (err) { console.error("onTriggerMessageHidden handler threw:", err); }
    }
  }

  return {
    updateHealth,
    showTriggerMessage,
    clearTriggerMessage,
  };
}

export { createUI };