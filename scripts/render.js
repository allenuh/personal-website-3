// Page markup from content.js (styled by style.css).
import { PROFILE, EXPERIENCE, PROJECTS, CONTACT } from '../content.js';

const experience = () => `
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

const projects = () => `
  <ul class="proj">
    ${PROJECTS.map((p) => `
      <li>
        <a class="proj-name" href="${p.href}">${p.name} <span aria-hidden="true">&#8599;</span></a>
        <ul class="tags">${p.tech.map((t) => `<li>${t}</li>`).join('')}</ul>
        <p class="proj-what">${p.what}</p>
      </li>`).join('')}
  </ul>`;

export const page = () => `
  <header>
    <h1>${PROFILE.name}</h1>
    <p class="studies">${PROFILE.major} @ ${PROFILE.school}</p>
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
