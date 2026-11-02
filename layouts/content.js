// Filler portfolio content, shared by every layout so they're compared like for like.

export const PROFILE = {
  name: 'allen',
  role: 'software engineering student',
  school: 'University of Waterloo',
  location: 'Toronto, ON',
  status: 'looking for summer 2027 internships',
  intro: [
    'I\'m a third-year software engineering student who likes building things that sit somewhere between tools and toys.',
    'Lately that\'s meant backend services by day and shaders by night. I care about fast, quiet interfaces and code that\'s easy to delete.',
  ],
};

export const EXPERIENCE = [
  {
    role: 'Software Engineering Intern',
    org: 'Northwind Labs',
    when: 'May – Aug 2026',
    what: 'Built internal analytics dashboards in React and TypeScript; cut weekly report generation from 20 minutes to 3.',
  },
  {
    role: 'Backend Developer Intern',
    org: 'Lumen Health',
    when: 'Jan – Apr 2026',
    what: 'Wrote a Go service for appointment scheduling on Postgres; added tracing that halved on-call debugging time.',
  },
  {
    role: 'Teaching Assistant, CS 136',
    org: 'University of Waterloo',
    when: 'Sep – Dec 2025',
    what: 'Ran weekly tutorials for 120 students on C, memory, and data structures.',
  },
];

export const PROJECTS = [
  {
    name: 'shoegaze',
    what: 'WebGL audio visualizer that melts songs into warped noise fields.',
    tech: ['GLSL', 'Web Audio'],
    href: '#',
  },
  {
    name: 'tidepool',
    what: 'Real-time collaborative whiteboard with presence and offline sync.',
    tech: ['TypeScript', 'WebSockets', 'Redis'],
    href: '#',
  },
  {
    name: 'lecture-lens',
    what: 'Browser extension that turns lecture slides into searchable notes.',
    tech: ['Python', 'FastAPI'],
    href: '#',
  },
  {
    name: 'pathfinder',
    what: 'Terminal visualizer for A*, Dijkstra and BFS on generated mazes.',
    tech: ['C++'],
    href: '#',
  },
];

export const CONTACT = [
  { label: 'email', value: 'hello@example.com', href: 'mailto:hello@example.com' },
  { label: 'github', value: 'github.com/allenuh', href: 'https://github.com/allenuh' },
  { label: 'linkedin', value: 'linkedin.com/in/allen', href: '#' },
  { label: 'resume', value: 'resume.pdf', href: '#' },
];

export const SECTIONS = ['about', 'experience', 'projects', 'contact'];
