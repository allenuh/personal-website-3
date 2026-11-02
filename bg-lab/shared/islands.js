// "Islands" scene: three nested fbm lookups (a feeds b feeds c), each panned on its own slow
// sine so the field sways rather than scrolls; squaring pools the result into islands that a
// colour ramp paints. Optional slow breathing zoom and a large drifting shadow layer.
import { NOISE, PERLIN, fbmFn, glslFloat as f, glslVec3 as vec3 } from './glsl.js';

// stops: [baseColour, [lo, hi, colour], ...] - each stop fades in over lo..hi of the pattern value
const ramp = ([base, ...stops]) => /* glsl */ `
  vec3 ramp(float v) {
    vec3 c = ${vec3(base)};
    ${stops.map(([lo, hi, col]) => `c = mix(c, ${vec3(col)}, smoothstep(${f(lo)}, ${f(hi)}, v));`).join('\n    ')}
    return c;
  }
`;

export function islandsFrag({ stops, scale = 1, speed = 1, breathe = 0, gamma = 2, shadow = 0, shadowTint = [0.3, 0.05, 0.35] }) {
  return /* glsl */ `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    ${NOISE}
    ${PERLIN}
    ${fbmFn('islandFbm', { octaves: 8, lacunarity: 1.9, gain: 0.6 })}
    ${ramp(stops)}

    float pattern(vec2 p, float t) {
      float a = islandFbm(p * 3.0 + vec2(sin(t * 0.021), sin(t * 0.034)) * 3.0);
      float b = islandFbm((p + a) * 0.6 + vec2(sin(t * 0.04), sin(t * 0.03)));
      return islandFbm((p + b) * 2.6 + vec2(-0.6, -0.5) + vec2(sin(-t * 0.013), sin(t * 0.027)) * 2.0);
    }

    void main() {
      float t = u_time * ${f(speed)};
      vec2 c = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
      c *= ${f(scale)} * (1.0 + ${f(breathe)} * sin(t * 0.11));
      vec2 p = c + vec2(0.5 * u_res.x / u_res.y, 0.5) + (u_mouse - 0.5) * 0.08;

      vec3 col = ramp(pow(pattern(p, t), ${f(gamma)}) * 1.05);

      float s = islandFbm(c * 0.6 + vec2(t * 0.011, -t * 0.008) + 7.0);
      col *= mix(vec3(1.0), ${vec3(shadowTint)}, smoothstep(0.45, 0.72, s) * ${f(shadow)});

      gl_FragColor = vec4(col, 1.0);
    }
  `;
}
