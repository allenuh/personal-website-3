// Temporary sliders for the magenta peaks of the background. Only loads when the URL has ?tune, so
// visitors never see it. Changes aren't saved: note the values and set them in background.js.
const SLIDERS = [
  // [label, min, max, get, set]
  ['magenta start', 0.2, 1, (b) => b.uniforms.u_peakLo, (b, v) => (b.uniforms.u_peakLo = v)],
  ['magenta end', 0.3, 1.1, (b) => b.uniforms.u_peakHi, (b, v) => (b.uniforms.u_peakHi = v)],
  ['magenta red', 0, 1, (b) => b.uniforms.u_peakColor[0], (b, v) => (b.uniforms.u_peakColor[0] = v)],
  ['magenta blue', 0, 1, (b) => b.uniforms.u_peakColor[2], (b, v) => (b.uniforms.u_peakColor[2] = v)],
  ['linear dither', 0, 1, (b) => b.settings.linearDither, (b, v) => (b.settings.linearDither = v)],
];

export function tunePanel(bg) {
  if (!bg) return; // no WebGL, nothing to tune

  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; right: 16px; bottom: 16px; z-index: 10;
    display: grid; grid-template-columns: auto 160px 4ch; align-items: center; gap: 6px 10px;
    padding: 10px 12px; border: 1px solid rgba(255, 214, 234, 0.2); border-radius: 8px;
    background: rgba(20, 0, 10, 0.78); font: 12px var(--sans); color: var(--muted);
  `;

  for (const [label, min, max, get, set] of SLIDERS) {
    const name = document.createElement('span');
    name.textContent = label;
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min, max, step: 0.01, value: get(bg) });
    input.style.cssText = 'width: 100%; accent-color: var(--accent)';
    const value = document.createElement('output');
    value.style.color = 'var(--ink)';
    const show = () => (value.textContent = Number(input.value).toFixed(2));
    show();
    input.addEventListener('input', () => {
      set(bg, Number(input.value));
      show();
      bg.refresh();
    });
    panel.append(name, input, value);
  }

  document.body.append(panel);
}
