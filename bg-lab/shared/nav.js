// Lab-only overlay: prev/next between variants, G toggles grain, H hides the nav (P: post panel).
const PAGES = [
  ['06-islands.html', 'islands'],
  ['06b-ember.html', 'ember'],
  ['06c-bruise.html', 'bruise'],
  ['06d-velvet.html', 'velvet'],
  ['07-drift.html', 'drift'],
  ['07b-haze.html', 'haze'],
  ['07c-undertow.html', 'undertow'],
  ['05-silk.html', 'silk'],
  ['08-strata.html', 'strata'],
  ['01-css-haze.html', 'css haze'],
  ['02-warp.html', 'fbm warp'],
  ['03-fretboard.html', 'fretboard ghost'],
  ['04-feedback.html', 'feedback smear'],
];

const embedded = window.self !== window.top;
const here = location.pathname.split('/').pop();
const i = PAGES.findIndex(([file]) => file === here);

if (!embedded && i !== -1) {
  const prev = PAGES[(i + PAGES.length - 1) % PAGES.length][0];
  const next = PAGES[(i + 1) % PAGES.length][0];

  const nav = document.createElement('nav');
  nav.className = 'lab-nav';
  nav.innerHTML = `
    <a href="${prev}" aria-label="previous">&larr;</a>
    <span>${here.split('-')[0]} &middot; ${PAGES[i][1]}</span>
    <a href="${next}" aria-label="next">&rarr;</a>
    <a href="./">all</a>`;
  document.body.append(nav);

  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') location.href = prev;
    if (e.key === 'ArrowRight') location.href = next;
    if (e.key === 'h') nav.hidden = !nav.hidden;
    if (e.key === 'g') document.querySelectorAll('.grain').forEach((g) => (g.hidden = !g.hidden));
  });
}
