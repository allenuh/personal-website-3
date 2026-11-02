// Layouts-lab switcher: prev/next between container designs (arrow keys with Alt, so the
// tab lists inside the layouts keep plain arrow keys). Entries may carry a query string.
const PAGES = [
  ['01-glass.html', '01 glass'],
  ['02-bare.html', '02 bare'],
  ['03-frame.html', '03 frame'],
  ['04-index.html', '04 index'],
  ['05-lens.html', '05 lens'],
  ['06-focus.html', '06 focus'],
  ['07-still.html?bg=lens', '07 still · lens'],
  ['07-still.html?bg=halo', '07 still · halo'],
  ['08-box.html?bg=halo', '08 box · halo'],
  ['08-box.html?bg=lens', '08 box · lens'],
  ['09-still.html?bg=lens', '09 still · lens'],
  ['09-still.html?bg=halo', '09 still · halo'],
];

const here = location.pathname.split('/').pop();
let i = PAGES.findIndex(([page]) => page === here + location.search);
if (i === -1) i = PAGES.findIndex(([page]) => page.split('?')[0] === here);

if (window.self === window.top && i !== -1) {
  const prev = PAGES[(i + PAGES.length - 1) % PAGES.length][0];
  const next = PAGES[(i + 1) % PAGES.length][0];
  const nav = document.createElement('nav');
  nav.className = 'layout-nav';
  nav.innerHTML = `<a href="${prev}">&larr;</a><span>${PAGES[i][1]}</span><a href="${next}">&rarr;</a><a href="./">all</a>`;
  document.body.append(nav);
  addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowLeft') location.href = prev;
    if (e.key === 'ArrowRight') location.href = next;
  });
}
