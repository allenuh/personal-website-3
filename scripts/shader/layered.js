// Runs a scene shader at low resolution, then through the post chain at full resolution.
// Scene uniforms: u_res, u_time.
//
// Options:
//   settings - post settings, merged over post.js DEFAULTS
//   lens     - { el, radius = 24, amount = 1, soft = 36, wobble = 1 }: melt a blurred, darker
//              window into the background behind `el`, tracked every frame. soft is the edge
//              fade in px; wobble scales the noise pushing the edge around (0 = exact box).
//              grow (default 0) widens the window past `el` by that fraction of its size per side.
//
// The scene renders at a fraction of the CSS size, but the final pass renders at the screen's real
// pixel size. If the canvas were stretched to fit instead (any zoom other than 100%, or display
// scaling), the browser would blend the dither pattern in gamma space, which darkens and reddens it.
import { getGL, program, fullscreenTriangle, reducedMotion } from './gl.js';
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

  // exact device-pixel size where the browser reports it (Chrome, Firefox); CSS size x dpr otherwise
  let device = null;
  try {
    new ResizeObserver(([entry]) => {
      const box = entry.devicePixelContentBoxSize?.[0];
      device = box ? [box.inlineSize, box.blockSize] : null;
    }).observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    // unsupported box option: keep the fallback
  }

  // size the canvas to the screen's pixels; returns its CSS size and device px per CSS px
  function fitCanvas() {
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const [dw, dh] = device ?? [Math.round(cssW * devicePixelRatio), Math.round(cssH * devicePixelRatio)];
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    return { cssW, cssH, dpr: dw / cssW };
  }

  // lens geometry is in CSS px, from the bottom-left
  function lensUniforms(cssH) {
    if (!lens) return null;
    const r = lens.el.getBoundingClientRect();
    const dx = r.width * (lens.grow ?? 0);
    const dy = r.height * (lens.grow ?? 0);
    return {
      rect: [r.left - dx, cssH - r.bottom - dy, r.width + 2 * dx, r.height + 2 * dy],
      radius: lens.radius ?? 24,
      amount: lens.amount ?? 1,
      soft: lens.soft ?? 36,
      wobble: lens.wobble ?? 1,
    };
  }

  function frame(now) {
    const { cssW, cssH, dpr } = fitCanvas();
    const w = Math.max(1, Math.round(Math.min(cssW * scale, maxWidth)));
    const h = Math.max(1, Math.round((w * cssH) / cssW));
    const target = post.ensure(w, h);
    const t = seed + (now - start) / 1000;

    post.draw(scene, target, w, h, {}, { u_res: [w, h], u_time: t });
    post.run(settings, t, canvas.width, canvas.height, lensUniforms(cssH), dpr);

    if (!reducedMotion) requestAnimationFrame(frame);
  }
  redraw();
  if (reducedMotion) addEventListener('resize', redraw);
}
