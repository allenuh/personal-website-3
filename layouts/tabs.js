// Minimal tabs: buttons with [data-tab="x"] show the element with [data-panel="x"] inside `root`.
// Arrow keys move between tabs. onChange(name) fires after each switch.
export function tabs(root, { initial = 'about', onChange = () => {} } = {}) {
  const buttons = [...root.querySelectorAll('[data-tab]')];
  const panels = [...root.querySelectorAll('[data-panel]')];

  buttons.forEach((b) => {
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `panel-${b.dataset.tab}`);
  });
  panels.forEach((p) => {
    p.setAttribute('role', 'tabpanel');
    p.id = `panel-${p.dataset.panel}`;
  });

  function select(name) {
    buttons.forEach((b) => {
      const on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => (p.hidden = p.dataset.panel !== name));
    onChange(name);
  }

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.tab));
    b.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = buttons[(i + step + buttons.length) % buttons.length];
      next.focus();
      select(next.dataset.tab);
    });
  });

  select(initial);
  return select;
}
