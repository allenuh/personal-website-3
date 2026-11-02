// Shared GLSL chunks, inlined into fragment shaders via template strings.

// JS number / [r, g, b] -> GLSL literal (GLSL ES needs the decimal point)
export const glslFloat = (n) => {
  const s = String(+n.toFixed(4));
  return s.includes('.') ? s : `${s}.0`;
};
export const glslVec3 = (c) => `vec3(${c.map(glslFloat).join(', ')})`;

export const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8);

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = OCT * p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
`;

// Perlin-style gradient noise (needs NOISE for hash). perlin01 remaps to roughly 0..1.
export const PERLIN = /* glsl */ `
vec2 grad(vec2 i) {
  float a = hash(i) * 6.2831853;
  return vec2(cos(a), sin(a));
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(grad(i), f);
  float b = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float perlin01(vec2 p) {
  return perlin(p) * 0.7071 + 0.5;
}
`;

// Generates a named fbm over any noise function, so each shader can pick its own octave count / falloff.
export const fbmFn = (name, { octaves = 5, lacunarity = 2.0, gain = 0.5, noise = 'perlin01' } = {}) => /* glsl */ `
float ${name}(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < ${octaves}; i++) {
    v += a * ${noise}(p);
    p = OCT * p * ${lacunarity.toFixed(3)} + vec2(1.7, 9.2);
    a *= ${gain.toFixed(3)};
  }
  return v;
}
`;

// Named swatches from the cover, for layering (purple included for the shadows).
export const SWATCHES = /* glsl */ `
const vec3 INK   = vec3(0.06, 0.0, 0.045);
const vec3 PLUM  = vec3(0.26, 0.03, 0.24);
const vec3 WINE  = vec3(0.44, 0.02, 0.16);
const vec3 RED   = vec3(0.80, 0.05, 0.24);
const vec3 MAG   = vec3(0.91, 0.10, 0.50);
const vec3 PINK  = vec3(1.0, 0.45, 0.75);
const vec3 BLUSH = vec3(1.0, 0.76, 0.89);
`;

// Gradient sampled from the Loveless cover: near-black wine -> crimson -> magenta -> pale pink.
export const PALETTE = /* glsl */ `
vec3 loveless(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.035, 0.0, 0.02);
  vec3 c1 = vec3(0.30, 0.01, 0.13);
  vec3 c2 = vec3(0.72, 0.03, 0.33);
  vec3 c3 = vec3(0.93, 0.12, 0.52);
  vec3 c4 = vec3(1.0, 0.55, 0.80);
  vec3 c = mix(c0, c1, smoothstep(0.0, 0.25, t));
  c = mix(c, c2, smoothstep(0.25, 0.5, t));
  c = mix(c, c3, smoothstep(0.5, 0.75, t));
  c = mix(c, c4, smoothstep(0.75, 1.0, t));
  return c;
}

vec3 screen(vec3 a, vec3 b) {
  return 1.0 - (1.0 - a) * (1.0 - b);
}
`;
