// Minimal WebGL1 helpers for full-screen fragment shaders.

export const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function getGL(canvas) {
  return canvas.getContext('webgl', { antialias: false, depth: false, alpha: false, premultipliedAlpha: false });
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) + '\n' + src);
  }
  return sh;
}

export function program(gl, frag, vert = VERT) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));

  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const { name } = gl.getActiveUniform(p, i);
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { prog: p, u: uniforms };
}

// one oversized triangle covering the viewport
export function fullscreenTriangle(gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

// eased pointer position in 0..1 (y up), for subtle parallax
export function trackPointer() {
  const target = [0.5, 0.5];
  const value = [0.5, 0.5];
  addEventListener('pointermove', (e) => {
    target[0] = e.clientX / innerWidth;
    target[1] = 1 - e.clientY / innerHeight;
  });
  return () => {
    value[0] += (target[0] - value[0]) * 0.03;
    value[1] += (target[1] - value[1]) * 0.03;
    return value;
  };
}

// Size the canvas backing store to a fraction of the viewport. Returns true if it changed.
export function fit(canvas, scale) {
  const w = Math.max(1, Math.round(innerWidth * scale));
  const h = Math.max(1, Math.round(innerHeight * scale));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

// RGBA8 texture + framebuffer, linear filtered, clamped (fine for NPOT sizes)
export function renderTarget(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fb, w, h };
}

// Run a single-pass fragment shader with u_res / u_time / u_mouse.
export function runShader(canvas, frag, { scale = 0.5, seed = 40 } = {}) {
  const gl = getGL(canvas);
  if (!gl) return;
  const { prog, u } = program(gl, frag);
  gl.useProgram(prog);
  fullscreenTriangle(gl);
  const pointer = trackPointer();
  const start = performance.now();

  function frame(now) {
    fit(canvas, scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const m = pointer();
    gl.uniform2f(u.u_res, canvas.width, canvas.height);
    gl.uniform1f(u.u_time, seed + (now - start) / 1000);
    gl.uniform2f(u.u_mouse, m[0], m[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reducedMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reducedMotion) addEventListener('resize', () => requestAnimationFrame(frame));
}
