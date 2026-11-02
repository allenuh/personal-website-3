// "Drift" scene: a cloud warp whose strength varies across the screen (soft puffs beside
// stringy wisps), slid along `velocity`, thresholded into clouds over a dark sky gradient.
// Optional larger, slower back layer for parallax, and a breathing warp strength.
import { NOISE, PERLIN, glslFloat as f, glslVec3 as vec3 } from './glsl.js';

export function driftFrag({
  sky: [skyLow, skyHigh, skyAccent],
  back = null,
  body,
  core,
  glow,
  coreMix = 0.65,
  glowMix = 0.5,
  velocity = [0.035, 0],
  scale = 2.2,
  lo = 0.47,
  hi = 0.72,
  breathe = 0,
}) {
  return /* glsl */ `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    ${NOISE}
    ${PERLIN}

    // slow-falloff fbm (lacunarity 1.6, gain 0.6) keeps lots of fine wisp detail
    float cloudFbm(vec2 x) {
      float h = 0.0;
      float a = 0.54;
      for (int i = 0; i < 6; i++) {
        h += perlin01(x) * a;
        x = OCT * x * 1.6 + vec2(3.1, 1.7);
        a *= 0.6;
      }
      return h / 1.27;
    }

    float warp(vec2 p, float mm, float t) {
      float m = 4.0;
      vec2 q = vec2(cloudFbm(p), cloudFbm(p + vec2(0.05 * t, 1.08)));
      vec2 r = vec2(cloudFbm(p + q * m + vec2(0.1, 4.741)), cloudFbm(p + q * m + vec2(1.952, 7.845)));
      return cloudFbm(p + r * (m / mm));
    }

    float clouds(vec2 p, float t) {
      float mm = (12.0 + cloudFbm(p * 1.25) * 16.0) * (1.0 + ${f(breathe)} * sin(t * 0.13));
      return warp(p, mm, t);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p = gl_FragCoord.xy / u_res.y * ${f(scale)} + (u_mouse - 0.5) * 0.1;
      float t = u_time;
      vec2 vel = vec2(${f(velocity[0])}, ${f(velocity[1])});

      vec3 col = mix(${vec3(skyLow)}, ${vec3(skyHigh)}, uv.y);
      col = mix(col, ${vec3(skyAccent)}, smoothstep(0.3, 1.0, uv.x * 0.6 + uv.y * 0.4));

      ${back ? `
      float cb = clouds(p * 0.55 + vel * t * 0.5 + vec2(13.1, 7.3), t * 0.7);
      col = mix(col, ${vec3(back)}, smoothstep(${f(lo - 0.04)}, ${f(hi + 0.08)}, cb) * 0.7);` : ''}

      float c = clouds(p + vel * t, t);
      col = mix(col, ${vec3(body)}, smoothstep(${f(lo)}, ${f(hi)}, c));
      col = mix(col, ${vec3(core)}, smoothstep(${f(lo + 0.13)}, ${f(hi + 0.08)}, c) * ${f(coreMix)});
      col = mix(col, ${vec3(glow)}, smoothstep(${f(hi)}, ${f(hi + 0.16)}, c) * ${f(glowMix)});

      gl_FragColor = vec4(col, 1.0);
    }
  `;
}
