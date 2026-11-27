// The field page laid out for many articles (plan job 4.1): "Start here" (three chosen articles), a format filter with
// live counts, the articles grouped by format under their own headings, the existing search and the neighbouring-field
// links. ?field=jesus|doubt. ?view=card shows the card sheet instead: every type, every state, and measured contrast.
(() => {
const { icon, KINDS, kindOf, FIELDS, here, articleCard, mountFrame, SURFACE } = window.APF;
const fieldId = window.APF_FIELDS[new URLSearchParams(location.search).get("field")] ? new URLSearchParams(location.search).get("field") : "jesus";
const VIEW = new URLSearchParams(location.search).get("view") === "card" ? "card" : "page";
const field = window.APF_FIELDS[fieldId];
const ORDER = ["short-answer", "essay", "objections", "debate-guide", "figure", "reading", "timeline", "glossary", "faq", "case-study"];

const studies = field.studies.map(([id, format, title, summary, minutes, sources, extra = {}]) => ({
  id, format, title, summary, minutes, sources, ...extra, field: { title: field.title, short: field.short, color: field.color }, href: `../formats/?format=${format}`,
}));
const byId = new Map(studies.map((s) => [s.id, s]));

const switches = `<nav aria-label="Field">${["jesus", "doubt"].map((id) => `<a href="${here({ field: id, view: null })}" ${id === fieldId && VIEW === "page" ? 'aria-current="true"' : ""}>${window.APF_FIELDS[id].title}</a>`).join("")}<a href="${here({ view: "card" })}" ${VIEW === "card" ? 'aria-current="true"' : ""}>Card sheet</a><a href="../formats/">Format pages →</a></nav>`;
const page = mountFrame(VIEW === "card" ? "The new article card" : `Field page · ${field.title}`, { field: fieldId, switches });
document.querySelector(".ap-page").style.setProperty("--ap-tone", `var(--${field.color})`);

function hero() {
  const formats = new Set(studies.map((s) => s.format)).size;
  const hours = Math.round(studies.reduce((n, s) => n + s.minutes, 0) / 6) / 10;
  return `<a class="back" href="#">${icon("arrow-left", 14)}Back to Apologetics</a>
    <header class="fp-hero"><p class="ap-eyebrow">Explore a field</p><h1>${field.title}</h1><p class="fp-lede">${field.description}</p>
      <dl class="fp-stats"><div><dt>Articles</dt><dd>${studies.length}</dd></div><div><dt>Formats</dt><dd>${formats}</dd></div><div><dt>Hours of reading</dt><dd>${hours}</dd></div><div><dt>The question</dt><dd class="q">“${field.question}”</dd></div></dl></header>`;
}

function startHere() {
  return `<section class="fp-start" aria-labelledby="start-h"><div class="fp-head"><p class="ap-eyebrow">Start here</p><h2 id="start-h">Three to read <em>first.</em></h2></div>
    <ol class="ap-article-grid fp-start-row">${field.start.map((id, i) => `<li><span class="fp-num" aria-hidden="true">0${i + 1}</span>${articleCard(byId.get(id))}</li>`).join("")}</ol></section>`;
}

function controls() {
  return `<div class="fp-tools"><label class="fp-search">${icon("search", 16)}<span class="sr">Search this field</span><input id="q" type="search" placeholder="Search questions, ideas or objections…" autocomplete="off"></label><p class="fp-count" id="count" aria-live="polite"></p></div>
    <div class="fp-filter" role="group" aria-label="Show one format" id="filter"></div>`;
}

function groups() {
  return ORDER.filter((f) => studies.some((s) => s.format === f)).map((format) => {
    const kind = kindOf(format);
    const n = studies.filter((s) => s.format === format).length;
    return `<section class="fp-group" data-format="${format}" style="--s3:${Math.min(n, 3)};--s2:${Math.min(n, 2)}" aria-labelledby="g-${format}"><div class="fp-group-head">${icon(kind.icon, 20)}<div><h2 id="g-${format}">${kind.plural} <span class="n"></span></h2><p>${kind.line}</p></div></div>
      <div class="ap-article-grid">${studies.filter((s) => s.format === format).map((s) => `<div class="fp-cell" data-id="${s.id}">${articleCard(s)}</div>`).join("")}</div></section>`;
  }).join("");
}

function neighbours() {
  return `<section class="fp-neighbours"><p class="ap-eyebrow" style="--ap-tone:var(--accent)">Everything connects</p><h2>Follow a neighbouring question.</h2>
    <div>${FIELDS.filter(([id]) => id !== fieldId).map(([id, title]) => `<a href="${here({ field: id })}">${title}${icon("arrow-up-right", 13)}</a>`).join("")}</div></section>`;
}

let activeFormat = "all";
function update() {
  const query = document.getElementById("q").value.trim().toLowerCase();
  const matches = (s) => !query || `${s.title} ${s.summary} ${kindOf(s.format).label}`.toLowerCase().includes(query);
  const visible = studies.filter(matches);
  const counts = Object.fromEntries(ORDER.map((f) => [f, visible.filter((s) => s.format === f).length]));
  const present = ORDER.filter((f) => studies.some((s) => s.format === f));
  document.getElementById("filter").innerHTML = [["all", "All", "file-text", visible.length], ...present.map((f) => [f, kindOf(f).plural, kindOf(f).icon, counts[f]])]
    .map(([id, label, i, n]) => `<button type="button" data-format="${id}" aria-pressed="${activeFormat === id}" ${n === 0 ? "disabled" : ""}>${icon(i, 14)}<span>${label}</span><b>${n}</b></button>`).join("");
  for (const cell of document.querySelectorAll(".fp-cell")) cell.hidden = !matches(byId.get(cell.dataset.id));
  for (const group of document.querySelectorAll(".fp-group")) {
    const n = counts[group.dataset.format];
    group.hidden = n === 0 || (activeFormat !== "all" && activeFormat !== group.dataset.format);
    group.querySelector(".n").textContent = n;
  }
  document.querySelector(".fp-start").hidden = Boolean(query) || activeFormat !== "all";
  const shown = activeFormat === "all" ? visible.length : counts[activeFormat];
  document.getElementById("count").textContent = `${shown} of ${studies.length} articles`;
}

function drawPage() {
  page.innerHTML = `${hero()}${controls()}${startHere()}<div class="fp-groups">${groups()}</div>${neighbours()}`;
  document.getElementById("q").addEventListener("input", update);
  document.getElementById("filter").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-format]");
    if (!button) return;
    activeFormat = activeFormat === button.dataset.format ? "all" : button.dataset.format;
    update();
  });
  update();
}

window.APF_DRAW_CARD_SHEET = { studies, field, KINDS, ORDER, page, SURFACE };
if (VIEW === "page") drawPage();
})();
