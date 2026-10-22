import { profile, projects } from "./projects.mjs";

export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const arrow = '<span class="link-arrow" aria-hidden="true">↗</span>';
const external = (url, label, className = "") =>
  `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;
const projectUrl = (project) => `/work/${project.slug}/`;

export function picture(project, { caseStudy = false, eager = false } = {}) {
  const ofcCase = caseStudy && project.slug === "ofc-mobile";
  const imageBreakpoint =
    caseStudy || project.slug === "broadcast-graphics" ? 767 : 1199;
  return `<picture class="project-picture">
    <source media="(max-width: ${imageBreakpoint}px)" srcset="/assets/${project.image}-mobile.webp" width="350" height="${project.mobileHeight}">
    <img src="/assets/${ofcCase ? "ofc-case" : `${project.image}-desktop`}.webp" width="${ofcCase ? 1312 : project.imageWidth}" height="${ofcCase ? 640 : project.imageHeight}" alt="${escape(project.alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" ${eager ? 'fetchpriority="high"' : ""}>
  </picture>`;
}

export function navigation() {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header container" id="top">
    <a class="wordmark" href="/" aria-label="Jacob Gil, home">jacob gil.</a>
    <nav aria-label="Main navigation">
      <a href="/#work">Work</a><a href="/#about">About</a>
      ${external(profile.github, 'GitHub <span aria-hidden="true">↗</span>', "nav-github")}
      <button class="theme-toggle" type="button" aria-label="Switch to dark theme" aria-pressed="false" title="Switch color theme"><span aria-hidden="true">◐</span></button>
    </nav>
  </header>`;
}

export function footer() {
  return `<footer class="site-footer container">
    <p>© 2026 Jacob Gil</p>
    <div class="footer-links">${external(profile.github, "GitHub ↗")}${external(profile.linkedin, "LinkedIn ↗")}<a href="#top">Back to top <span aria-hidden="true">↑</span></a></div>
  </footer>`;
}

export function shell({
  title,
  description,
  path,
  content,
  css,
  js,
  page = "project",
  noindex = false,
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark"><meta name="theme-color" content="#FAFAFC">
  <title>${escape(title)}</title><meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${profile.site}${path}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${noindex ? '<meta name="robots" content="noindex">' : ""}
  <meta property="og:type" content="website"><meta property="og:site_name" content="Jacob Gil">
  <meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${profile.site}${path}"><meta property="og:image" content="${profile.site}/assets/social-preview.webp">
  <meta property="og:image:alt" content="Jacob Gil’s portfolio: Good ideas. Real products.">
  <meta name="twitter:card" content="summary_large_image">
  <script>try{const t=localStorage.getItem('portfolio-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;document.documentElement.dataset.arrive=sessionStorage.getItem('portfolio-arrived')?'false':'true';sessionStorage.setItem('portfolio-arrived','1')}catch{}</script>
  <link rel="stylesheet" href="/assets/${css}"><script src="/assets/${js}" defer></script>
</head>
<body data-page="${page}">
  ${navigation()}<main id="main">${content}</main>${footer()}
</body>
</html>`;
}

function workCard(project, { tool = false, broadcast = false } = {}) {
  return `<article class="work-card ${tool ? "tool-card" : ""} ${broadcast ? "broadcast-card" : ""}" data-reveal>
    ${tool && project.eyebrow ? `<p class="card-eyebrow">${project.eyebrow}</p>` : ""}
    <a class="project-link" href="${projectUrl(project)}">
      <div class="project-visual">${picture(project)}</div>
      <div class="project-caption"><div class="project-title"><h3>${escape(project.title)}</h3>${arrow}</div>
        <p class="project-description">${escape(project.description)}</p>
        <p class="project-tags">${escape(project.tags)}</p>
      </div>
    </a>
  </article>`;
}

export function home() {
  const [ofc, taiwanese, broadcast, recorder, tracker, audio, slopmeter] =
    projects;
  return `<section class="hero container" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="hero-role hero-arrival">PRODUCT LEAD &amp; ENGINEER</p>
      <h1 id="hero-title" class="hero-arrival"><span>Good ideas.</span><span>Real products.</span></h1>
      <p class="hero-intro hero-arrival"><span class="desktop-intro">I’m Jacob. I build thoughtful software, from mobile products for live events to the graphics that bring the action on air.</span><span class="mobile-intro">I’m Jacob. I build thoughtful software, from live event apps to broadcast graphics.</span></p>
      <div class="hero-actions hero-arrival"><a class="button button-primary" href="#work">Explore my work <span aria-hidden="true">↓</span></a><p>Product Lead at RF Labs</p></div>
    </div>
    <picture class="hero-art hero-arrival"><source media="(max-width:767px)" srcset="/assets/hero-mobile.webp" width="350" height="334"><img src="/assets/hero-desktop.webp" width="424" height="400" alt="OFC Mobile’s play library and multiplayer poker table." fetchpriority="high" decoding="async"></picture>
  </section>
  <section class="selected-work container" id="work" aria-labelledby="work-title">
    <div class="section-header"><h2 id="work-title">Selected work</h2><a class="subtle-link" href="/work/">Explore the project library <span aria-hidden="true">↗</span></a></div>
    <div class="work-row row-lead">${workCard(ofc)}${workCard(taiwanese)}</div>
    ${workCard(broadcast, { broadcast: true })}
    <div class="work-row row-secondary">${workCard(recorder)}${workCard(tracker)}</div>
    <div class="work-row row-tools">${workCard(audio, { tool: true })}${workCard(slopmeter, { tool: true })}</div>
  </section>
  <section class="archive container" aria-labelledby="archive-title" data-reveal>
    <h2 id="archive-title">An early collaboration</h2><p class="section-description">One from the archive. Built with a team, kept for the story.</p>
    <a class="archive-project" href="/work/vanilla-chat/"><div><h3>Vanilla Chat</h3><p>Team-built real-time chat</p></div><span class="archive-year">2021</span>${arrow}</a>
    <a class="text-link" href="/work/">View the full project library <span aria-hidden="true">↗</span></a>
  </section>
  <section class="about container" id="about" aria-labelledby="about-title" data-reveal>
    <div class="about-intro"><h2 id="about-title">I like the whole problem.</h2><p>The product decisions. The interface details. The architecture underneath. I care about how they fit together.</p></div>
    <div class="about-body"><p>I lead product and frontend work at RF Labs, pairing interface design with hands-on engineering. I care about the details people feel, and the systems that make them work.</p>
      <dl class="experience"><div><dt>RF Labs / Product Lead</dt><dd>2025 - Present</dd></div><div><dt>RF Labs / Lead Engineer, RF Cloud</dt><dd>2023 - 2025</dd></div></dl>
      <div class="about-links">${external(profile.linkedin, "LinkedIn ↗")}<a href="/resume/">Resume <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>
  <section class="contact container" aria-labelledby="contact-title" data-reveal>
    <a class="contact-heading" href="mailto:${profile.email}"><h2 id="contact-title">Have something in mind?</h2><span class="contact-arrow" aria-hidden="true">↗</span></a>
    <a class="text-link email-link" href="mailto:${profile.email}">${profile.email}</a>
  </section>`;
}

function libraryCard(project, index) {
  return `<article class="library-card" data-category="${project.category}" data-year="${project.year}" data-order="${index}" data-search="${escape(`${project.title} ${project.summary} ${project.description} ${project.tags}`.toLowerCase())}">
    <a href="${projectUrl(project)}"><div class="library-title"><h2>${escape(project.title)}</h2><span>${project.year}</span></div>
      <p>${escape(project.description)}</p><div class="library-meta"><span>${escape(project.tags)}</span><span class="text-link">View project ${arrow}</span></div>
    </a>
  </article>`;
}

export function library() {
  return `<section class="library container" aria-labelledby="library-title">
    <div class="page-heading"><h1 id="library-title">The project library.</h1><p>Apps, tools, and experiments. Built over time, kept out of curiosity.</p></div>
    <div class="library-controls" data-library-controls hidden>
      <div class="filter-group" role="group" aria-label="Filter projects">${[
        ["all", "All work"],
        ["games", "Games & analysis"],
        ["apps", "Apps & tools"],
        ["early", "Early explorations"],
      ]
        .map(
          ([value, label]) =>
            `<button type="button" class="filter-button" data-filter="${value}" aria-pressed="${value === "all"}">${escape(label)}</button>`,
        )
        .join("")}</div>
      <label class="search-label"><span class="sr-only">Search projects</span><input type="search" placeholder="Search projects…" name="q" autocomplete="off" aria-controls="project-results"></label>
    </div>
    <div class="library-status"><p id="result-count" role="status" aria-live="polite">${projects.length} projects</p><label class="sort-label" data-library-controls hidden><span class="sr-only">Sort projects</span><select id="project-sort" aria-controls="project-results"><option value="featured">Featured order ↓</option><option value="newest">Newest first ↓</option><option value="name">Name A–Z</option></select></label></div>
    <div class="library-grid" id="project-results">${projects.map(libraryCard).join("")}</div>
    <div class="empty-state" hidden><h2>No projects found.</h2><p>Try another term or clear the search.</p><button class="button button-primary" type="button" data-clear-search>Clear search</button></div>
  </section>`;
}

export function caseStudy(project) {
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  return `<article class="case-study container">
    <div class="case-heading"><a class="back-link subtle-link" href="/work/">← All work</a><h1>${escape(project.title)}.</h1><p>${escape(project.summary)}</p></div>
    <dl class="case-facts"><div><dt>My role</dt><dd>${escape(project.role)}</dd></div><div><dt>Platform</dt><dd>${escape(project.platform)}</dd></div><div><dt>Project</dt><dd>${escape(project.context)}</dd></div></dl>
    ${project.image ? `<div class="case-visual">${picture(project, { caseStudy: true, eager: true })}</div>` : ""}
    <div class="case-sections">${project.sections.map(([title, body]) => `<section data-reveal><h2>${escape(title)}</h2><p>${escape(body)}</p></section>`).join("")}</div>
    <section class="case-details" data-reveal><div><h2>${escape(project.detailsTitle)}</h2><p>${escape(project.detailsIntro)}</p></div><div class="detail-list">${project.details.map(([title, body]) => `<div><h3>${escape(title)}</h3><p>${escape(body)}</p></div>`).join("")}</div></section>
    ${project.source || project.note ? `<aside class="case-source" aria-label="Project credits and links">${project.note ? `<p>${escape(project.note)}</p>` : ""}<div class="source-links">${project.source ? external(project.source, `View source ${arrow}`, "text-link") : ""}${project.upstream ? external(project.upstream, `Original slopmeter ${arrow}`, "text-link") : ""}</div></aside>` : ""}
    <a class="next-project" href="${projectUrl(next)}"><div><p>Next project</p><h2>${escape(next.title)}</h2></div>${arrow}</a>
  </article>`;
}

export function resume() {
  return `<article class="resume container"><div class="page-heading"><a class="back-link subtle-link" href="/#about">← About Jacob</a><h1>Jacob Gil.</h1><p>Product Lead &amp; Engineer</p></div>
    <div class="resume-actions"><a class="text-link" href="mailto:${profile.email}">${profile.email}</a>${external(profile.linkedin, "LinkedIn ↗", "text-link")}<button class="button button-outline" type="button" data-print hidden>Print / save PDF</button></div>
    <section><h2>Profile</h2><p>I lead product and frontend work at RF Labs, pairing interface design with hands-on engineering. My work spans mobile products, live broadcast graphics, and tools built around practical workflows.</p></section>
    <section><h2>Experience</h2><div class="resume-job"><div><h3>RF Labs / Product Lead</h3><p>2025 - Present</p></div><p>Product design, system architecture, and hands-on development for tournament management software, backend services, data models, and operator interfaces.</p></div><div class="resume-job"><div><h3>RF Labs / Lead Engineer, RF Cloud</h3><p>2023 - 2025</p></div><p>Built live broadcast graphics for Hustler Casino Live and Lodge Card Club, combining dynamic game data with animated on-screen visuals.</p></div></section>
    <section><h2>Selected projects</h2><div class="resume-projects">${projects
      .slice(0, 5)
      .filter((p) => p.slug !== "broadcast-graphics")
      .map(
        (p) =>
          `<a href="${projectUrl(p)}"><h3>${escape(p.title)} ${arrow}</h3><p>${escape(p.description)}</p><p class="project-tags">${escape(p.tags)}</p></a>`,
      )
      .join("")}</div></section>
    <section><h2>Focus</h2><p>Product development, interface design, interaction design, React and React Native, TypeScript, backend services, data modeling, and motion graphics.</p></section>
  </article>`;
}

export function notFound() {
  return `<section class="not-found container"><p class="hero-role">404</p><h1>This page moved on.</h1><p>The projects are still here.</p><a class="button button-primary" href="/">Back to the portfolio <span aria-hidden="true">↗</span></a></section>`;
}
