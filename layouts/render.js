// Section markup from content.js. Layouts drop these into their own structure and restyle them.
import { PROFILE, EXPERIENCE, PROJECTS, CONTACT } from './content.js';

const studies = `${PROFILE.major} @ ${PROFILE.school}`;

export const about = ({ meta = true } = {}) => `
  <div class="about">
    <p>${studies}</p>
    <p>${PROFILE.intro}</p>
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

export const projects = () => `
  <ul class="proj">
    ${PROJECTS.map((p) => `
      <li>
        <a class="proj-name" href="${p.href}">${p.name} <span aria-hidden="true">&#8599;</span></a>
        <ul class="tags">${p.tech.map((t) => `<li>${t}</li>`).join('')}</ul>
        <p class="proj-what">${p.what}</p>
      </li>`).join('')}
  </ul>`;

export const contact = () => `
  <ul class="contact">
    ${CONTACT.map((c) => `<li><span class="contact-label">${c.label}</span><a href="${c.href}">${c.value}</a></li>`).join('')}
  </ul>`;

export const sections = { about, experience, projects, contact };

// 02's everything-at-once composition (style with bare.css)
export const bare = () => `
  <header>
    <h1>${PROFILE.name}</h1>
    <p class="studies">${studies}</p>
    <p class="lede">${PROFILE.intro}</p>
  </header>
  <div class="cols">
    <section>
      <h2>Experience</h2>
      ${experience()}
    </section>
    <section>
      <h2>Projects</h2>
      ${projects()}
    </section>
  </div>
  <footer class="links">${CONTACT.map((c) => `<a href="${c.href}">${c.label}</a>`).join('')}</footer>`;

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
