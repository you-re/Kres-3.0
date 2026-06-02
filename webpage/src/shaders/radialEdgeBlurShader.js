import { Vector2 } from "three";

const RadialEdgeBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.0 },
    center: { value: new Vector2(0.5, 0.5) }
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
    uniform vec2 center;

    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - center;
      float dist = length(dir);
      float blur = smoothstep(0.1, 1.0, dist) * strength;

      vec4 color = texture2D(tDiffuse, vUv);
      vec4 sum = color;
      float total = 1.0;
      const int samples = 32;

      for (int i = 1; i <= samples; i++) {
        float t = float(i) / float(samples);
        vec2 sampleUv = vUv - dir * t * blur;
        sum += texture2D(tDiffuse, sampleUv);
        total += 1.0;
      }

      gl_FragColor = sum / total;
    }
  `
};

export { RadialEdgeBlurShader };