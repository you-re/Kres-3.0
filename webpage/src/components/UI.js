function createUI() {
  const uiRoot = document.createElement("div");
  uiRoot.id = "ui-root";
  uiRoot.innerHTML = `
    <div id="health-widget">
      <div id="health-container">
        <div id="health-fill"></div>
      </div>
      <div id="health-text">Health: 100 / 100</div>
    </div>
  `;

  document.body.appendChild(uiRoot);

  const healthFill = uiRoot.querySelector("#health-fill");
  const healthText = uiRoot.querySelector("#health-text");

  function updateHealth(value) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    if (healthFill) healthFill.style.width = `${normalized}%`;
    if (healthText) healthText.textContent = `Health: ${normalized} / 100`;

    if (healthFill) {
      if (normalized <= 20) {
        healthFill.style.background = `
          repeating-linear-gradient(
            135deg,
            #f44336,
            #f44336 12px,
            #ff9800 12px,
            #ff9800 24px
          )
        `;
      } else {
        healthFill.style.background = `
          repeating-linear-gradient(
            135deg,
            #54b848,
            #54b848 12px,
            #8bc34a 12px,
            #8bc34a 24px
          )
        `;
      }
    }
  }

  return {
    updateHealth,
  };
}

export { createUI };