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
  vignette: 0,
  pixel: 1,
  posterize: 0.76,
  dither: 0.86,
  halftone: 0,
  halftoneSize: 3,
};

// Velvet held in place: the pattern morphs but doesn't pan or zoom.
const SCENE = { ...VELVET, drift: 0, breathe: 0 };

// lens: optional { el, radius, ... }; pointer: mouse-follow strength - see runLayered
export function startBackground(canvas, { lens, pointer } = {}) {
  runLayered(canvas, islandsFrag(SCENE), { settings: POST, lens, pointer });
}
