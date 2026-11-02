// Runs a scene shader at low resolution, then through the post chain at full resolution.
// Scene uniforms: u_res, u_time, u_mouse. G toggles grain.
//
// Options:
//   settings - fixed post settings (merged over defaults); omit to use the lab's saved
//              settings and its slider panel (P toggles it)
//   lens     - { el, radius = 24, amount = 1, soft = 36, wobble = 1 }: melt a blurred, darker
//              window into the background behind `el`, tracked every frame. soft is the edge
//              fade in px; wobble scales the noise pushing the edge around (0 = exact box).
//              grow (default 0) widens the window past `el` by that fraction of its size per side.
//   pointer  - how strongly the scene follows the mouse (1 = as authored, 0 = not at all)
import { getGL, program, fullscreenTriangle, trackPointer, fit, reducedMotion } from './gl.js';
import { createPost, DEFAULTS } from './post.js';
import { loadSettings, mountPanel } from './panel.js';

export function runLayered(canvas, frag, { scale = 0.5, maxWidth = 1280, seed = 40, settings: fixed = null, lens = null, pointer: pointerAmt = 1 } = {}) {
  const gl = getGL(canvas);
  if (!gl) return;
  const scene = program(gl, frag);
  fullscreenTriangle(gl);
  const post = createPost(gl);
  const settings = fixed ? { ...DEFAULTS, ...fixed } : loadSettings();
  const pointer = trackPointer();
  const start = performance.now();
  let grainOff = false;

  const redraw = () => requestAnimationFrame(frame);
  addEventListener('keydown', (e) => {
    if (e.key === 'g') grainOff = !grainOff;
  });
  if (!fixed && window.self === window.top) mountPanel(settings, reducedMotion ? redraw : undefined);

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

    const m = pointer().map((v) => 0.5 + (v - 0.5) * pointerAmt);
    post.draw(scene, target, w, h, {}, { u_res: [w, h], u_time: t, u_mouse: m });
    post.run(grainOff ? { ...settings, grain: 0 } : settings, t, canvas.width, canvas.height, lensUniforms());

    if (!reducedMotion) requestAnimationFrame(frame);
  }
  redraw();
  if (reducedMotion) addEventListener('resize', redraw);
}
