// Runs a scene shader at low resolution, then through the post chain at full resolution.
// Scene uniforms: u_res, u_time.
//
// Options:
//   settings - post settings, merged over post.js DEFAULTS
//   lens     - { el, radius = 24, amount = 1, soft = 36, wobble = 1 }: melt a blurred, darker
//              window into the background behind `el`, tracked every frame. soft is the edge
//              fade in px; wobble scales the noise pushing the edge around (0 = exact box).
//              grow (default 0) widens the window past `el` by that fraction of its size per side.
import { getGL, program, fullscreenTriangle, fit, reducedMotion } from './gl.js';
import { createPost, DEFAULTS } from './post.js';

export function runLayered(canvas, frag, { scale = 0.5, maxWidth = 1280, seed = 40, settings: custom = {}, lens = null } = {}) {
  const gl = getGL(canvas);
  if (!gl) return;
  const scene = program(gl, frag);
  fullscreenTriangle(gl);
  const post = createPost(gl);
  const settings = { ...DEFAULTS, ...custom };
  const start = performance.now();

  const redraw = () => requestAnimationFrame(frame);

  function lensUniforms() {
    if (!lens) return null;
    const r = lens.el.getBoundingClientRect();
    const dx = r.width * (lens.grow ?? 0);
    const dy = r.height * (lens.grow ?? 0);
    return {
      rect: [r.left - dx, canvas.height - r.bottom - dy, r.width + 2 * dx, r.height + 2 * dy],
      radius: lens.radius ?? 24,
      amount: lens.amount ?? 1,
      soft: lens.soft ?? 36,
      wobble: lens.wobble ?? 1,
    };
  }

  function frame(now) {
    fit(canvas, 1);
    const w = Math.max(1, Math.round(Math.min(canvas.width * scale, maxWidth)));
    const h = Math.max(1, Math.round((w * canvas.height) / canvas.width));
    const target = post.ensure(w, h);
    const t = seed + (now - start) / 1000;

    post.draw(scene, target, w, h, {}, { u_res: [w, h], u_time: t });
    post.run(settings, t, canvas.width, canvas.height, lensUniforms());

    if (!reducedMotion) requestAnimationFrame(frame);
  }
  redraw();
  if (reducedMotion) addEventListener('resize', redraw);
}
