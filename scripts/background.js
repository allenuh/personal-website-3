// The background: "velvet" islands shader with its locked-in post-processing settings.
import { runLayered } from './shader/layered.js';
import { islandsFrag } from './shader/islands.js';

// Islands in crimson: oxblood/wine body, pink-red mid-tones, magenta-violet peaks.
// drift and breathe at 0 hold the pattern in place, so it morphs without panning or zooming.
const SCENE = {
  stops: [
    [0.06, 0.0, 0.03],
    [0.05, 0.22, [0.24, 0.01, 0.10]],
    [0.22, 0.38, [0.45, 0.02, 0.19]],
    [0.38, 0.55, [0.74, 0.03, 0.22]],
    [0.55, 0.72, [0.86, 0.06, 0.38]],
    [0.72, 0.95, [0.70, 0.06, 0.60]],
  ],
  scale: 0.75,
  breathe: 0,
  drift: 0,
  shadow: 0.5,
  shadowTint: [0.25, 0.02, 0.2],
  speed: 0.85,
};

export const POST = {
  grain: 0.09,
  grainSize: 1.9,
  afterimage: 0.8,
  melt: 0.35,
  blur: 0.35,
  blurAngle: 20,
  bloom: 0.5,
  bleed: 0.3,
  vignette: 0,
  pixel: 1,
  posterize: 0.76,
  dither: 0.86,
  halftone: 0,
  halftoneSize: 3,
};

// lens: optional { el, radius, ... } - see runLayered
export function startBackground(canvas, { lens } = {}) {
  runLayered(canvas, islandsFrag(SCENE), { settings: POST, lens });
}
