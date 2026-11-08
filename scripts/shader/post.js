// Post-processing chain for the layered backgrounds.
//
//   scene (low res) -> afterimage/melt (feedback) -> directional blur -> bloom (half of that, 2x H+V gaussian)
//   -> composite at full res: pixelate, colour bleed, bloom, halftone, vignette, posterize/dither, film grain
//
// Every knob lives in CONTROLS (with the ranges used while tuning); DEFAULTS comes from it.

import { program, renderTarget } from './gl.js';

export const CONTROLS = [
  { group: 'grain', key: 'grain', label: 'amount', min: 0, max: 0.4, step: 0.005, value: 0.09 },
  { group: 'grain', key: 'grainSize', label: 'size', min: 1, max: 6, step: 0.1, value: 1, fmt: (v) => `${v.toFixed(1)}px` },

  { group: 'smear', key: 'afterimage', label: 'afterimage', min: 0, max: 0.97, step: 0.01, value: 0.8 },
  { group: 'smear', key: 'melt', label: 'melt', min: 0, max: 1, step: 0.01, value: 0.35 },
  { group: 'smear', key: 'blur', label: 'directional blur', min: 0, max: 1, step: 0.01, value: 0.35 },
  { group: 'smear', key: 'blurAngle', label: 'blur angle', min: 0, max: 180, step: 1, value: 20, fmt: (v) => `${v}°` },

  { group: 'glow', key: 'bloom', label: 'bloom', min: 0, max: 1.5, step: 0.01, value: 0.5 },
  { group: 'glow', key: 'bleed', label: 'colour bleed', min: 0, max: 1, step: 0.01, value: 0.3 },
  { group: 'glow', key: 'vignette', label: 'vignette', min: 0, max: 1, step: 0.01, value: 0.3 },

  { group: 'retro', key: 'pixel', label: 'pixelate', min: 1, max: 32, step: 1, value: 1, fmt: (v) => (v === 1 ? 'off' : `${v}px`) },
  { group: 'retro', key: 'posterize', label: 'posterize', min: 0, max: 1, step: 0.01, value: 0, fmt: (v, s) => (levelsFor(s) ? `${levelsFor(s)} lv` : 'off') },
  { group: 'retro', key: 'dither', label: 'dither', min: 0, max: 1, step: 0.01, value: 0 },
  { group: 'retro', key: 'halftone', label: 'halftone', min: 0, max: 1, step: 0.01, value: 0 },
  { group: 'retro', key: 'halftoneSize', label: 'dot size', min: 3, max: 24, step: 0.5, value: 8, fmt: (v) => `${v}px` },
];

export const DEFAULTS = Object.fromEntries(CONTROLS.map((c) => [c.key, c.value]));

// Posterize strength -> colour levels per channel. Dither on its own quantizes to 6 so the pattern shows.
export function levelsFor(s) {
  if (s.posterize > 0) return Math.round(2 + 30 * (1 - s.posterize) ** 2);
  return s.dither > 0 ? 6 : 0;
}

const HASH = /* glsl */ `
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
`;

// Feedback: blend the new frame over the previous one, sampled slightly above (so trails drip
// downward) with a slow wobble. Dithered write so small 8-bit differences still converge.
const AFTERIMAGE = /* glsl */ `
  precision highp float;
  uniform sampler2D u_new;
  uniform sampler2D u_old;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_damp;
  uniform float u_melt;
  ${HASH}

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec2 wob = vec2(sin(uv.y * 7.0 + u_time * 0.3), cos(uv.x * 5.0 - u_time * 0.23));
    vec2 off = u_melt * (vec2(0.0, 0.004) + wob * vec2(0.0015 * u_res.y / u_res.x, 0.001));
    vec3 c = mix(texture2D(u_new, uv).rgb, texture2D(u_old, uv + off).rgb, u_damp);
    c += (hash13(vec3(gl_FragCoord.xy, mod(u_time * 60.0, 251.0))) - 0.5) / 255.0;
    gl_FragColor = vec4(c, 1.0);
  }
`;

// 16-tap gaussian-weighted blur along one angle, tap positions jittered per pixel to hide banding.
const DIRBLUR = /* glsl */ `
  precision highp float;
  uniform sampler2D u_img;
  uniform vec2 u_res;
  uniform float u_len;
  uniform float u_angle;
  uniform float u_time;
  ${HASH}

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec2 dir = vec2(cos(u_angle), sin(u_angle)) * u_len * vec2(u_res.y / u_res.x, 1.0);
    float j = hash13(vec3(gl_FragCoord.xy, mod(floor(u_time * 24.0), 97.0))) - 0.5;
    vec3 acc = vec3(0.0);
    float wsum = 0.0;
    for (int i = 0; i < 16; i++) {
      float k = (float(i) + j) / 15.0 - 0.5;
      float w = exp(-k * k * 6.0);
      acc += texture2D(u_img, uv + dir * k).rgb * w;
      wsum += w;
    }
    gl_FragColor = vec4(acc / wsum, 1.0);
  }
`;

// Bright pass keyed on the max channel: saturated magenta has low luma but should still glow.
const BRIGHT = /* glsl */ `
  precision highp float;
  uniform sampler2D u_img;
  uniform vec2 u_res;

  void main() {
    vec3 c = texture2D(u_img, gl_FragCoord.xy / u_res).rgb;
    float m = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c * smoothstep(0.25, 0.7, m), 1.0);
  }
`;

const GAUSS = /* glsl */ `
  precision highp float;
  uniform sampler2D u_img;
  uniform vec2 u_res;
  uniform vec2 u_dir;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec3 c = texture2D(u_img, uv).rgb * 0.227027;
    c += (texture2D(u_img, uv + u_dir).rgb + texture2D(u_img, uv - u_dir).rgb) * 0.1945946;
    c += (texture2D(u_img, uv + u_dir * 2.0).rgb + texture2D(u_img, uv - u_dir * 2.0).rgb) * 0.1216216;
    c += (texture2D(u_img, uv + u_dir * 3.0).rgb + texture2D(u_img, uv - u_dir * 3.0).rgb) * 0.054054;
    c += (texture2D(u_img, uv + u_dir * 4.0).rgb + texture2D(u_img, uv - u_dir * 4.0).rgb) * 0.016216;
    gl_FragColor = vec4(c, 1.0);
  }
`;

const COMPOSITE = /* glsl */ `
  precision highp float;
  uniform sampler2D u_img;
  uniform sampler2D u_bloom;
  uniform sampler2D u_soft;
  uniform vec4 u_lens;
  uniform float u_lensRadius;
  uniform float u_lensAmt;
  uniform float u_lensSoft;
  uniform float u_lensWobble;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_grain;
  uniform float u_grainSize;
  uniform float u_bloomAmt;
  uniform float u_bleed;
  uniform float u_vignette;
  uniform float u_pixel;
  uniform float u_levels;
  uniform float u_dither;
  uniform float u_halftone;
  uniform float u_htSize;
  ${HASH}

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  // value noise on an integer grid, z picks an independent layer
  float vnoise(vec2 p, float z) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash13(vec3(i, z)), hash13(vec3(i + vec2(1.0, 0.0), z)), f.x),
               mix(hash13(vec3(i + vec2(0.0, 1.0), z)), hash13(vec3(i + 1.0, z)), f.x), f.y);
  }

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  float bayer2(vec2 a) {
    a = floor(a);
    return fract(dot(a, vec2(0.5, a.y * 0.75)));
  }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

  // red drifts left and blue right, each smeared over two taps, like analog chroma bleed
  vec3 sampleImg(vec2 uv) {
    vec2 bo = vec2(u_bleed * 0.006, 0.0);
    vec3 c;
    c.r = texture2D(u_img, uv - bo).r * 0.55 + texture2D(u_img, uv - 2.0 * bo).r * 0.45;
    c.g = texture2D(u_img, uv).g;
    c.b = texture2D(u_img, uv + bo).b * 0.55 + texture2D(u_img, uv + 2.0 * bo).b * 0.45;
    vec3 b = texture2D(u_bloom, uv).rgb * u_bloomAmt;
    return 1.0 - (1.0 - c) * (1.0 - b);
  }

  // one channel of an RGB halftone: grid rotated per channel, dot area proportional to value
  vec2 htCenter(vec2 frag, float ang) {
    vec2 q = rot(ang) * frag;
    return rot(-ang) * ((floor(q / u_htSize) + 0.5) * u_htSize);
  }

  // dot area / cell area == the channel's linear-light value, so the pattern averages back to the
  // original brightness (slightly boosted so full-on dots just touch)
  float htDot(vec2 frag, vec2 center, float v) {
    float d = length(frag - center) / u_htSize;
    float r = sqrt(pow(clamp(v, 0.0, 1.0), 2.2) / 3.14159) * 1.1;
    float aa = 1.0 / u_htSize;
    return smoothstep(r + aa, r - aa, d);
  }

  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 cell = (floor(frag / u_pixel) + 0.5) * u_pixel;
    vec2 uv = cell / u_res;
    vec3 col = sampleImg(uv);

    // "lens": a darker, heavily blurred window behind page content, its outline a rounded
    // rect whose edge is pushed around by slow noise so it melts instead of cutting
    if (u_lensAmt > 0.0) {
      vec2 halfSize = u_lens.zw * 0.5;
      float n1 = vnoise(frag * 0.008 + vec2(u_time * 0.04, -u_time * 0.03), 3.0);
      float n2 = vnoise(frag * 0.004 - vec2(u_time * 0.02, u_time * 0.025), 11.0);
      float sd = sdRoundRect(frag - u_lens.xy - halfSize, halfSize, u_lensRadius)
               + ((n1 - 0.5) * 48.0 + (n2 - 0.5) * 40.0) * u_lensWobble;
      float m = smoothstep(u_lensSoft, -u_lensSoft, sd) * u_lensAmt;
      vec3 inner = texture2D(u_soft, uv + (vec2(n1, n2) - 0.5) * 0.03).rgb;
      col = mix(col, inner * 0.5 + vec3(0.03, 0.0, 0.02), m);
    }

    if (u_halftone > 0.0) {
      vec2 cr = htCenter(cell, 0.26);
      vec2 cg = htCenter(cell, 1.31);
      vec2 cb = htCenter(cell, 0.79);
      vec3 ht = vec3(htDot(cell, cr, sampleImg(cr / u_res).r),
                     htDot(cell, cg, sampleImg(cg / u_res).g),
                     htDot(cell, cb, sampleImg(cb / u_res).b));
      col = mix(col, ht, u_halftone);
    }

    vec2 d = (frag / u_res - 0.5) * vec2(u_res.x / u_res.y, 1.0);
    col *= 1.0 - u_vignette * dot(d, d);

    if (u_levels > 0.5) {
      float l = u_levels - 1.0;
      float b = (bayer8(floor(frag / u_pixel)) - 0.5) * u_dither;
      col = floor(col * l + 0.5 + b) / l;
    }

    // film grain: value noise on a grid of u_grainSize px, re-rolled at 24fps
    float frame = mod(floor(u_time * 24.0), 113.0);
    float g = vnoise(frag / u_grainSize - 0.5, frame) - 0.5;
    g *= mix(1.0, 1.7, clamp(u_grainSize - 1.0, 0.0, 1.0));
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    // like film, grain reads strongest in the midtones
    col += g * u_grain * (0.45 + 2.2 * luma * (1.0 - luma));

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export function createPost(gl) {
  const P = {
    after: program(gl, AFTERIMAGE),
    blur: program(gl, DIRBLUR),
    bright: program(gl, BRIGHT),
    gauss: program(gl, GAUSS),
    comp: program(gl, COMPOSITE),
  };
  let T = null;

  function draw(p, target, w, h, textures, uniforms) {
    gl.useProgram(p.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, w, h);
    Object.entries(textures).forEach(([name, t], i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.uniform1i(p.u[name], i);
    });
    for (const [name, v] of Object.entries(uniforms)) {
      const loc = p.u[name];
      if (loc == null) continue;
      if (Array.isArray(v)) gl[`uniform${v.length}f`](loc, ...v);
      else gl.uniform1f(loc, v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function free(t) {
    gl.deleteTexture(t.tex);
    gl.deleteFramebuffer(t.fb);
  }

  // (Re)allocate buffers for a w x h scene; returns the target the scene should render into.
  function ensure(w, h) {
    if (T && T.w === w && T.h === h) return T.scene;
    if (T) [T.scene, T.a, T.b, T.blur, T.b1, T.b2, T.s1, T.s2].forEach(free);
    const bw = Math.max(1, Math.round(w / 2));
    const bh = Math.max(1, Math.round(h / 2));
    const sw = Math.max(1, Math.round(w / 4));
    const sh = Math.max(1, Math.round(h / 4));
    T = {
      w, h, bw, bh, sw, sh, fresh: true,
      s1: renderTarget(gl, sw, sh),
      s2: renderTarget(gl, sw, sh),
      scene: renderTarget(gl, w, h),
      a: renderTarget(gl, w, h),
      b: renderTarget(gl, w, h),
      blur: renderTarget(gl, w, h),
      b1: renderTarget(gl, bw, bh),
      b2: renderTarget(gl, bw, bh),
    };
    return T.scene;
  }

  // Run the chain on whatever was drawn into ensure()'s target, output to the canvas.
  // lens (optional): { rect: [x, y, w, h] in canvas px from bottom-left, radius, amount, soft, wobble }
  function run(s, time, cw, ch, lens = null) {
    const { w, h, bw, bh, sw, sh } = T;

    draw(P.after, T.b, w, h, { u_new: T.scene, u_old: T.a }, {
      u_res: [w, h], u_time: time, u_damp: T.fresh ? 0 : s.afterimage, u_melt: s.melt,
    });
    [T.a, T.b] = [T.b, T.a];

    draw(P.blur, T.blur, w, h, { u_img: T.a }, {
      u_res: [w, h], u_time: time, u_len: s.blur * 0.08, u_angle: (s.blurAngle * Math.PI) / 180,
    });

    draw(P.bright, T.b1, bw, bh, { u_img: T.blur }, { u_res: [bw, bh] });
    for (const spread of [1.5, 3.5]) {
      draw(P.gauss, T.b2, bw, bh, { u_img: T.b1 }, { u_res: [bw, bh], u_dir: [spread / bw, 0] });
      draw(P.gauss, T.b1, bw, bh, { u_img: T.b2 }, { u_res: [bw, bh], u_dir: [0, spread / bh] });
    }

    // quarter-res, very soft copy of the image for the lens interior
    if (lens) {
      draw(P.gauss, T.s1, sw, sh, { u_img: T.blur }, { u_res: [sw, sh], u_dir: [1.5 / sw, 0] });
      draw(P.gauss, T.s2, sw, sh, { u_img: T.s1 }, { u_res: [sw, sh], u_dir: [0, 1.5 / sh] });
      draw(P.gauss, T.s1, sw, sh, { u_img: T.s2 }, { u_res: [sw, sh], u_dir: [3 / sw, 0] });
      draw(P.gauss, T.s2, sw, sh, { u_img: T.s1 }, { u_res: [sw, sh], u_dir: [0, 3 / sh] });
    }

    draw(P.comp, null, cw, ch, { u_img: T.blur, u_bloom: T.b1, u_soft: lens ? T.s2 : T.b1 }, {
      u_lens: lens ? lens.rect : [0, 0, 0, 0],
      u_lensRadius: lens ? lens.radius : 0,
      u_lensAmt: lens ? lens.amount : 0,
      u_lensSoft: lens ? lens.soft : 1,
      u_lensWobble: lens ? lens.wobble : 0,
      u_res: [cw, ch],
      u_time: time,
      u_grain: s.grain,
      u_grainSize: s.grainSize,
      u_bloomAmt: s.bloom,
      u_bleed: s.bleed,
      u_vignette: s.vignette,
      u_pixel: s.pixel,
      u_levels: levelsFor(s),
      u_dither: s.dither,
      u_halftone: s.halftone,
      u_htSize: s.halftoneSize,
    });
    T.fresh = false;
  }

  return { draw, ensure, run };
}
