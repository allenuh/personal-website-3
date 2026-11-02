// Lab-only slider panel for the post chain. Settings persist per browser and are shared by
// every variant (and live-update other open tabs / gallery iframes). P toggles the panel.
import { CONTROLS, DEFAULTS } from './post.js';

const KEY = 'bg-lab:post:v1';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode etc.): settings just won't persist
  }
}

// Mutable settings object; keeps itself in sync with changes made in other tabs.
export function loadSettings() {
  const s = { ...DEFAULTS };
  const apply = (saved) => {
    for (const k of Object.keys(DEFAULTS)) if (typeof saved[k] === 'number') s[k] = saved[k];
  };
  apply(read());
  addEventListener('storage', (e) => {
    if (e.key === KEY) apply(read());
  });
  return s;
}

export function mountPanel(settings, onChange = () => {}) {
  const panel = document.createElement('aside');
  panel.className = 'post-panel';
  const rows = [];
  let html = '<details open><summary>post-processing <kbd>P</kbd></summary>';
  let group = null;

  CONTROLS.forEach((c, i) => {
    if (c.group !== group) {
      html += `${group ? '</fieldset>' : ''}<fieldset><legend>${c.group}</legend>`;
      group = c.group;
    }
    html += `
      <label>
        <span>${c.label}</span>
        <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" data-i="${i}">
        <output></output>
      </label>`;
  });
  html += `</fieldset>
    <div class="post-actions">
      <button type="button" data-act="reset">reset</button>
      <button type="button" data-act="copy">copy settings</button>
    </div></details>`;
  panel.innerHTML = html;

  panel.querySelectorAll('input').forEach((input) => {
    const c = CONTROLS[input.dataset.i];
    const out = input.nextElementSibling;
    rows.push({ c, input, out });
    input.addEventListener('input', () => {
      settings[c.key] = parseFloat(input.value);
      write(settings);
      sync();
      onChange();
    });
  });

  // readouts can depend on other settings (posterize shows the level count, which dither affects)
  function sync() {
    for (const { c, input, out } of rows) {
      const v = settings[c.key];
      if (document.activeElement !== input) input.value = v;
      out.textContent = c.fmt ? c.fmt(v, settings) : v.toFixed(2);
    }
  }

  panel.addEventListener('click', async (e) => {
    const act = e.target.dataset.act;
    if (act === 'reset') {
      Object.assign(settings, DEFAULTS);
      write(settings);
      sync();
      onChange();
    }
    if (act === 'copy') {
      const text = JSON.stringify(settings, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        e.target.textContent = 'copied';
      } catch {
        e.target.textContent = 'copy failed';
        console.log(text);
      }
      setTimeout(() => (e.target.textContent = 'copy settings'), 1200);
    }
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'p' && !e.target.closest?.('input')) panel.hidden = !panel.hidden;
  });
  addEventListener('storage', sync);

  sync();
  document.body.append(panel);
}
