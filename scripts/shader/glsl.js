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
