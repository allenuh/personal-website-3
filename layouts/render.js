// Section markup from content.js. Layouts drop these into their own structure and restyle them.
import { PROFILE, EXPERIENCE, PROJECTS, CONTACT } from './content.js';

export const about = ({ meta = true } = {}) => `
  <div class="about">
    ${PROFILE.intro.map((p) => `<p>${p}</p>`).join('')}
    ${meta ? `<p class="about-meta">${PROFILE.location} &middot; ${PROFILE.status}</p>` : ''}
  </div>`;

export const experience = () => `
  <ol class="xp">
    ${EXPERIENCE.map((x) => `
      <li>
        <div class="xp-head">
          <span class="xp-role">${x.role}</span>
          <span class="xp-org">${x.org}</span>
          <span class="xp-when">${x.when}</span>
        </div>
        <p class="xp-what">${x.what}</p>
      </li>`).join('')}
  </ol>`;

export const projects = ({ tags = true } = {}) => `
  <ul class="proj">
    ${PROJECTS.map((p) => `
      <li>
        <a class="proj-name" href="${p.href}">${p.name} <span aria-hidden="true">&#8599;</span></a>
        <p class="proj-what">${p.what}</p>
        ${tags ? `<ul class="tags">${p.tech.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      </li>`).join('')}
  </ul>`;

export const contact = () => `
  <ul class="contact">
    ${CONTACT.map((c) => `<li><span class="contact-label">${c.label}</span><a href="${c.href}">${c.value}</a></li>`).join('')}
  </ul>`;

export const sections = { about, experience, projects, contact };

// Fill every [data-panel] inside root with its section.
export function fillPanels(root = document) {
  root.querySelectorAll('[data-panel]').forEach((p) => (p.innerHTML = sections[p.dataset.panel]()));
}

// Keep an element showing local time where the person is.
export function clock(el, timeZone = 'America/Toronto') {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
}
