// The chosen background: 06d velvet with its locked-in post settings.
import { runLayered } from '../bg-lab/shared/layered.js';
import { islandsFrag } from '../bg-lab/shared/islands.js';
import { VELVET } from '../bg-lab/shared/presets.js';

export const POST = {
  grain: 0.09,
  grainSize: 1.9,
  afterimage: 0.8,
  melt: 0.35,
  blur: 0.35,
  blurAngle: 20,
  bloom: 0.5,
  bleed: 0.3,
  vignette: 0.3,
  pixel: 1,
  posterize: 0.76,
  dither: 0.86,
  halftone: 0,
  halftoneSize: 3,
};

// lens: optional { el, radius, amount } - see runLayered
export function startBackground(canvas, { lens } = {}) {
  runLayered(canvas, islandsFrag(VELVET), { settings: POST, lens });
}
