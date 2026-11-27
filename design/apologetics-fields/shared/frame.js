// The frame every Apologetics-fields mock-up draws into: the mock-up bar, the site header (or the app's frame), the
// Apologetics navigation, the footer, and the new article card (part C of Plans/APOLOGETICS-FIELDS-CARD.md).
// ?surface=app draws the phone app's version: its status bar and header, no site footer, and the card's app values.

(() => {
const params = new URLSearchParams(location.search);
const SURFACE = params.get("surface") === "app" ? "app" : "site";

/** One lucide icon as inline SVG. `extra` adds attributes (class, stroke width). */
function icon(name, size = 16, extra = "") {
  const shape = window.APF_ICONS[name];
  if (!shape) throw new Error(`mock-up icon "${name}" is not in shared/icons.js; add it there`);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${shape}</svg>`;
}

/** The plan's one table of article types: eyebrow label and icon (part C §5). */
const KINDS = {
  "short-answer": { label: "Short answer", plural: "Short answers", icon: "lightbulb", line: "One question, answered plainly, with the strongest objections met." },
  essay: { label: "Long-form essay", plural: "Long-form essays", icon: "scroll-text", line: "A longer argument, read one part at a time." },
  objections: { label: "Objections & replies", plural: "Objections & replies", icon: "shield-question-mark", line: "The strongest objections in their holders' own words, each answered." },
  "debate-guide": { label: "Views compared", plural: "Views compared", icon: "scale", line: "Positions side by side, with what all of them affirm." },
  figure: { label: "Key figure", plural: "Key figures", icon: "user-round", line: "One thinker: life, argument and reply." },
  reading: { label: "Primary-source reading", plural: "Primary-source readings", icon: "book-open-text", line: "An old text read slowly, with a guided note beside it." },
  timeline: { label: "Timeline", plural: "Timelines", icon: "chart-gantt", line: "Dated events, each with how sure the date is." },
  glossary: { label: "Glossary", plural: "Glossaries", icon: "book-a", line: "The field's words, defined and cross-linked." },
  faq: { label: "Questions answered", plural: "Questions answered", icon: "circle-question-mark", line: "Quick, common questions with short answers." },
  "case-study": { label: "Case study", plural: "Case studies", icon: "search-check", line: "One worked instance: what survives, and what is inferred." },
};
const kindOf = (format) => KINDS[format] ?? { label: "Article", plural: "Articles", icon: "file-text", line: "" };

const FIELDS = [
  ["god", "God & reality", "accent"], ["jesus", "Jesus & resurrection", "gospels"], ["bible", "Bible & reliability", "history"],
  ["doubt", "Suffering & doubt", "poetry"], ["worldviews", "Religions & worldviews", "prophets"], ["faith", "Faith & witness", "epistles"],
  ["reformed", "Reformed theology", "history"],
];

/** A link to this mock-up with some parameters changed (keeps the rest, so theme and surface carry over). */
function here(changes) {
  const next = new URLSearchParams(location.search);
  for (const [key, value] of Object.entries(changes)) value === null ? next.delete(key) : next.set(key, value);
  const query = next.toString();
  return location.pathname + (query ? `?${query}` : "");
}

function mockBar(title, switches) {
  const surface = [["site", "Website"], ["app", "Phone app"]].map(([id, label]) => `<a href="${here({ surface: id === "site" ? null : id })}" ${SURFACE === id ? 'aria-current="true"' : ""}>${label}</a>`).join("");
  return `<div class="mock-bar" role="note"><strong>Design mock-up</strong><span>${title} · not live · for the owner's look</span>
    <nav aria-label="Surface">${surface}</nav>${switches ?? ""}</div>`;
}

function header() {
  const nav = [["Bible", "book-open-text"], ["Study", "scroll-text"], ["Apologetics", "shield-check"], ["Teachers", "user-round"], ["Resources", "lightbulb"]];
  const dark = document.documentElement.dataset.theme === "dark";
  return `<header class="site-header">
    <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background:var(--${s})"></span>`).join("")}</div>
    <div class="wrap bar">
      <a class="logo" href="#">${icon("book-open-text", 26, 'stroke-width="2"')}<span>Bible Guide</span></a>
      <nav class="main-nav" aria-label="Main">${nav.map(([label, i]) => `<a href="#" ${label === "Apologetics" ? 'aria-current="page"' : ""}>${icon(i, 15)}${label}</a>`).join("")}<span class="sep"></span><a href="#">Testimonies</a></nav>
      <div class="head-tools">
        <a class="round mail" href="#" aria-label="Contact">${icon("mail", 15)}</a>
        <button class="round lang" type="button" aria-label="Language">${icon("languages", 15)}</button>
        <a class="round" href="#" aria-label="Search">${icon("search", 15)}</a>
        <button class="theme-switch" type="button" role="switch" aria-checked="${dark}" aria-label="Dark mode" id="theme-switch"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
        <button class="round menu-btn" type="button" aria-label="Menu">${icon("menu", 16)}</button>
      </div>
    </div>
  </header>`;
}

function apNav(activeField) {
  const tabs = [["Apologetics", "shield-check"], ["Explore", "arrow-up-right"], ["Worldviews", "circle-question-mark"], ["Questions", "circle-question-mark"], ["Debates", "scale"], ["Sources", "book-a"]];
  return `<nav class="ap-nav" aria-label="Apologetics">
    <div class="tabs">${tabs.map(([label, i]) => `<a href="#" ${label === "Questions" ? 'aria-current="page"' : ""}>${icon(i, 15)}<span>${label}</span></a>`).join("")}<a class="find" href="#">${icon("search", 15)}<span>Search Apologetics</span></a></div>
    <div class="fields"><a href="#">All questions</a>${FIELDS.map(([id, title]) => `<a href="${here({ field: id })}" ${id === activeField ? 'aria-current="page"' : ""}>${title}</a>`).join("")}</div>
  </nav>`;
}

function footer() {
  const line = `<div class="ap-footer-line"><div><strong>Conviction with an open Bible.</strong>Scripture first. Baptist convictions. Sources you can examine.</div><a href="#">Our starting point · 1 Peter 3:15–16</a></div>`;
  return line;
}

/** The new article card. `study`: { id, format, title, summary, minutes, sources, read, saved, field: {title, color} }. */
function articleCard(study, state = "") {
  const kind = kindOf(study.format);
  const tone = `--ap-tone:var(--${study.field.color})`;
  const meta = [`${study.minutes} min`, `${study.sources} sources`, ...(study.parts ? [`${study.parts} parts`] : [])];
  const label = `${study.title}, ${kind.label}, ${study.minutes} min${study.read ? ", read" : ""}`;
  return `<article class="ap-article-card ${state}" style="${tone}" data-kind="${study.format}" ${study.read ? "data-read" : ""}>
    ${icon(kind.icon, 96, 'class="ap-article-icon" stroke-width="1"')}
    <div class="ap-article-top"><p class="ap-eyebrow">${icon(kind.icon, 13)}<span>${kind.label} · ${study.field.short ?? study.field.title}</span></p>
      <button class="ap-save" type="button" aria-pressed="${!!study.saved}" aria-label="${study.saved ? "Saved" : "Save"}: ${study.title}">${icon("bookmark", 16)}</button></div>
    <a class="ap-article-link" href="${study.href ?? "#"}" aria-label="${label}">
      <h3>${study.title}</h3><p>${study.summary}</p>
      <span class="ap-article-meta">${meta.map((m) => `<span>${m}</span>`).join("")}${study.read ? `<span class="read">✓ Read</span>` : ""}</span>
    </a>
  </article>`;
}

/** Draws the frame and returns the element the page draws into. */
function mountFrame(title, { field, switches } = {}) {
  if (SURFACE === "app") document.body.classList.add("is-app");
  const status = SURFACE === "app" ? `<div class="app-status" aria-hidden="true"><span>9:41</span><span>Bible Guide app</span></div>` : "";
  document.body.insertAdjacentHTML("afterbegin", `${mockBar(title, switches)}${status}${header()}<main class="ap-page"><div class="wrap" id="frame-top">${apNav(field)}</div><div class="wrap" id="page"></div><div class="wrap">${footer()}</div></main>${SURFACE === "app" ? "" : `<footer class="site-foot"><div class="wrap">Bible Guide is a program of Redeemer Forge, Inc. · The site footer is unchanged and left out of this mock-up.</div></footer>`}`);
  document.getElementById("theme-switch").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
    location.replace(here({ theme: null }));
  });
  document.addEventListener("click", (event) => {
    const save = event.target.closest(".ap-save");
    if (save) save.setAttribute("aria-pressed", String(save.getAttribute("aria-pressed") !== "true"));
  });
  return document.getElementById("page");
}

Object.assign(window, { APF: { SURFACE, icon, KINDS, kindOf, FIELDS, here, articleCard, mountFrame } });
})();
