const ColorOverlayShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.0 },
    overlayColor: { value: { x: 0, y: 0, z: 0 } }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec3 overlayColor;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 overlay = vec4(overlayColor, 1.0);
      gl_FragColor = mix(color, overlay, strength);
    }
  `
};

export { ColorOverlayShader };