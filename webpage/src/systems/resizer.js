function Resizer(camera, renderer, composer) {
  window.addEventListener("resize", onWindowResize);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      const fxaaPass = composer.passes.find(
        (pass) => pass.material && pass.material.uniforms && pass.material.uniforms.resolution
      );
      if (fxaaPass) {
        fxaaPass.material.uniforms.resolution.value.set(
          1 / window.innerWidth,
          1 / window.innerHeight
        );
      }
    }
  }
}

export { Resizer };
