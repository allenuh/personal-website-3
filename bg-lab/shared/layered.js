// Runs a scene shader at low resolution, then through the post chain at full resolution.
// Scene uniforms: u_res, u_time, u_mouse. G toggles grain.
//
// Options:
//   settings - fixed post settings (merged over defaults); omit to use the lab's saved
//              settings and its slider panel (P toggles it)
//   lens     - { el, radius = 24, amount = 1 }: melt a soft, blurred window into the
//              background behind `el`, tracked every frame
import { getGL, program, fullscreenTriangle, trackPointer, fit, reducedMotion } from './gl.js';
import { createPost, DEFAULTS } from './post.js';
import { loadSettings, mountPanel } from './panel.js';

export function runLayered(canvas, frag, { scale = 0.5, maxWidth = 1280, seed = 40, settings: fixed = null, lens = null } = {}) {
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
    return {
      rect: [r.left, canvas.height - r.bottom, r.width, r.height],
      radius: lens.radius ?? 24,
      amount: lens.amount ?? 1,
    };
  }

  function frame(now) {
    fit(canvas, 1);
    const w = Math.max(1, Math.round(Math.min(canvas.width * scale, maxWidth)));
    const h = Math.max(1, Math.round((w * canvas.height) / canvas.width));
    const target = post.ensure(w, h);
    const t = seed + (now - start) / 1000;

    post.draw(scene, target, w, h, {}, { u_res: [w, h], u_time: t, u_mouse: [...pointer()] });
    post.run(grainOff ? { ...settings, grain: 0 } : settings, t, canvas.width, canvas.height, lensUniforms());

    if (!reducedMotion) requestAnimationFrame(frame);
  }
  redraw();
  if (reducedMotion) addEventListener('resize', redraw);
}
