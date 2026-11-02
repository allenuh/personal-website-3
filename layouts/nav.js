// Layouts-lab switcher: prev/next between container designs (arrow keys with Alt, so the
// tab lists inside the layouts keep plain arrow keys).
const PAGES = [
  ['01-glass.html', 'glass'],
  ['02-bare.html', 'bare'],
  ['03-frame.html', 'frame'],
  ['04-index.html', 'index'],
  ['05-lens.html', 'lens'],
  ['06-focus.html', 'focus'],
];

const here = location.pathname.split('/').pop();
const i = PAGES.findIndex(([file]) => file === here);

if (window.self === window.top && i !== -1) {
  const prev = PAGES[(i + PAGES.length - 1) % PAGES.length][0];
  const next = PAGES[(i + 1) % PAGES.length][0];
  const nav = document.createElement('nav');
  nav.className = 'layout-nav';
  nav.innerHTML = `<a href="${prev}">&larr;</a><span>${here.split('-')[0]} ${PAGES[i][1]}</span><a href="${next}">&rarr;</a><a href="./">all</a>`;
  document.body.append(nav);
  addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowLeft') location.href = prev;
    if (e.key === 'ArrowRight') location.href = next;
  });
}
