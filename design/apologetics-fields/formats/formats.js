// The reading page of each new article format (plan job 4.2), in the study page's frame: back link, header, the
// format's own body, and the right-hand rail (In this article · Open the Scriptures · Go to the source), which drops
// below the body on phones. ?format=<id> picks the format; ?part=<n> moves through the essay's parts.
(() => {
const { icon, KINDS, kindOf, FIELDS, here, mountFrame } = window.APF;
const params = new URLSearchParams(location.search);
const ORDER = ["essay", "objections", "debate-guide", "timeline", "figure", "reading", "glossary", "faq", "case-study"];
const format = ORDER.includes(params.get("format")) ? params.get("format") : "essay";
const sample = window.APF_SAMPLES[format];
const [, fieldTitle, fieldColor] = FIELDS.find(([id]) => id === sample.field);
const kind = kindOf(format);

const switches = `<nav aria-label="Format">${ORDER.map((f) => `<a href="${here({ format: f, part: null })}" ${f === format ? 'aria-current="true"' : ""}>${kindOf(f).label}</a>`).join("")}<a href="../field/">← Field page</a></nav>`;
const page = mountFrame(`Format page · ${kind.label}`, { field: sample.field, switches });
document.querySelector(".ap-page").style.setProperty("--ap-tone", `var(--${fieldColor})`);

const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const verse = (v) => `<blockquote class="fx-verse"><p>${esc(v.text)}</p><cite>${v.ref} · Berean Standard Bible</cite></blockquote>`;
const basis = (items) => !items.length ? "" : `<p class="fx-basis"><span>Basis</span>${items.map((b) => `<a href="#">${typeof b === "string" ? b : b.ref}</a>`).join("")}</p>`;
const section = (id, eyebrow, title, body) => `<section class="fx-sec" id="${id}"><p class="ap-eyebrow">${eyebrow}</p>${title ? `<h2>${title}</h2>` : ""}${body}</section>`;

const RENDER = {
  essay(s) {
    const part = Math.min(Math.max(Number(params.get("part")) || s.part, 1), s.parts.length);
    const steps = s.parts.map((title, i) => `<a href="${here({ part: i + 1 })}" ${i + 1 === part ? 'aria-current="step"' : ""} title="${title}"><b>${i + 1}</b><span>${title}</span></a>`).join("");
    const body = s.body.map(([type, value]) => type === "p" ? `<p>${value}</p>` : type === "h" ? `<h3>${value}</h3>` : verse(value)).join("");
    const prev = part > 1 ? `<a class="fx-pager prev" href="${here({ part: part - 1 })}">${icon("arrow-left", 15)}<span><small>Part ${part - 1}</small>${s.parts[part - 2]}</span></a>` : "<span></span>";
    const next = part < s.parts.length ? `<a class="fx-pager next" href="${here({ part: part + 1 })}"><span><small>Next part · ${part + 1} of ${s.parts.length}</small>${s.parts[part]}</span>${icon("arrow-right", 15)}</a>` : "";
    return { toc: s.parts.map((t, i) => [`#`, `${i + 1}. ${t}`, i + 1 === part]),
      html: `<nav class="fx-parts" aria-label="Parts of this essay">${steps}</nav>
        <section class="fx-sec fx-essay"><p class="ap-eyebrow">Part ${part} of ${s.parts.length}</p><h2>${s.parts[part - 1]}</h2>${part === s.part ? body : `<p class="fx-muted">Each part is its own page with its own address (/apologetics/study/resurrection-case/part/${part}). The mock-up draws part ${s.part} in full.</p>`}${basis(s.body.length && part === s.part ? s.basis : [])}</section>
        <nav class="fx-pagers" aria-label="Previous and next part">${prev}${next}</nav>` };
  },
  objections(s) {
    return { toc: s.items.map((o, i) => [`#o${i + 1}`, `${i + 1}. ${o.claim.split(/[.,]/)[0]}`]),
      html: `<p class="fx-lede">${s.lede}</p><ol class="fx-objections">${s.items.map((o, i) => `<li id="o${i + 1}"><span class="fx-n">${String(i + 1).padStart(2, "0")}</span><div>
        <p class="ap-eyebrow">The objection</p><p class="fx-claim">${esc(o.claim)}</p><p class="fx-held">Made by ${o.heldBy}</p>
        <p class="ap-eyebrow fx-reply-label">A reply</p><p>${esc(o.reply)}</p>${o.basis.map(verse).join("")}</div></li>`).join("")}</ol>` };
  },
  "debate-guide"(s) {
    return { toc: [["#common", "What all affirm"], ...s.views.map((v, i) => [`#v${i + 1}`, v.tag])],
      html: `${section("common", "What all affirm", "Common ground first.", `<ul class="fx-common">${s.common.map((c) => `<li>${c}</li>`).join("")}</ul>${verse(s.commonVerse)}`)}
        <div class="fx-views">${s.views.map((v, i) => `<section class="fx-view" id="v${i + 1}"><p class="ap-eyebrow">View ${i + 1} · ${v.tag}</p><h2>${v.label}</h2>
          <dl><dt>Held by</dt><dd>${v.heldBy}</dd><dt>Texts it leans on</dt><dd>${v.texts.map((t) => `<a href="#">${t}</a>`).join(" · ")}</dd><dt>The case</dt><dd>${v.case}</dd><dt>Pressed by the other side</dt><dd>${v.reply}</dd></dl></section>`).join("")}</div>
        <p class="fx-note">${icon("scale", 16)}${s.note}</p>` };
  },
  timeline(s) {
    return { toc: s.eras.map(([era], i) => [`#e${i}`, era]),
      html: s.eras.map(([era, events], i) => `<section class="fx-era" id="e${i}"><h2>${era}</h2><ol class="fx-events">${events.map(([date, sure, title, text]) => `<li><p class="fx-date">${date}${sure ? `<span>${sure}</span>` : ""}</p><div><h3>${title}</h3><p>${text}</p><a class="fx-cite" href="#">Source</a></div></li>`).join("")}</ol></section>`).join("") };
  },
  figure(s) {
    const f = s.figure;
    return { toc: s.sections.map(([t], i) => [`#f${i}`, t]).concat([["#works", "Works to read"]]),
      html: `<div class="fx-figure"><div class="fx-portrait" aria-hidden="true">${icon("user-round", 64, 'stroke-width="1"')}</div><div><h2>${f.name}</h2>
        <dl class="fp-stats"><div><dt>Dates</dt><dd>${f.dates}</dd></div><div><dt>Tradition</dt><dd class="small">${f.tradition}</dd></div><div><dt>Roles</dt><dd class="small">${f.roles.join(", ")}</dd></div></dl></div></div>
        <figure class="fx-quote"><blockquote>${esc(s.quote.text)}</blockquote><figcaption>${s.quote.where} · public domain</figcaption></figure>
        ${s.sections.map(([t, body], i) => section(`f${i}`, String(i + 1).padStart(2, "0"), t, `<p>${body}</p>`)).join("")}
        ${section("works", "Works to read", "In their own words.", `<ul class="fx-works">${s.works.map(([t, y, where]) => `<li><a href="#">${t}</a><span>${y} · free at ${where}</span></li>`).join("")}</ul>`)}` };
  },
  reading(s) {
    const e = s.extract;
    return { toc: s.extracts.map((name, i) => [`#`, name, i === s.current]),
      html: `<nav class="fx-parts small" aria-label="Readings">${s.extracts.map((n, i) => `<a href="#" ${i === s.current ? 'aria-current="step"' : ""}><b>${i + 1}</b><span>${n}</span></a>`).join("")}</nav>
        <div class="fx-reading"><figure class="fx-extract"><p class="ap-eyebrow">${e.author} · ${e.work}</p><blockquote>${esc(e.text)}</blockquote><figcaption>${e.date} · tr. ${e.translator}</figcaption></figure>
        <aside class="fx-guide" aria-label="Guided note"><p class="ap-eyebrow">Reading it slowly</p>${s.notes.map(([t, body]) => `<h3>${t}</h3><p>${body}</p>`).join("")}</aside></div>` };
  },
  glossary(s) {
    const letters = [...new Set(s.terms.map(([t]) => t[0]))];
    return { toc: letters.map((l) => [`#l-${l}`, l]),
      html: `<div class="fx-gloss-tools"><label class="fp-search">${icon("search", 15)}<span class="sr">Find a term</span><input type="search" placeholder="Find a term…" id="gq"></label><nav aria-label="Letters">${letters.map((l) => `<a href="#l-${l}">${l}</a>`).join("")}</nav></div>
        <dl class="fx-terms">${s.terms.map(([term, def, v, see], i) => `<div ${i === 0 || term[0] !== s.terms[i - 1][0][0] ? `id="l-${term[0]}"` : ""} data-term="${term.toLowerCase()}"><dt>${term}</dt><dd><p>${def}</p><p class="fx-root">${esc(v.text)} <a href="#">${v.ref}</a></p><p class="fx-see">See also ${see.map((x) => `<a href="#">${x}</a>`).join(", ")}</p></dd></div>`).join("")}</dl>` };
  },
  faq(s) {
    return { toc: s.questions.map(([q], i) => [`#q${i}`, q]),
      html: `<div class="fx-faq">${s.questions.map(([q, a, ref], i) => `<details id="q${i}" ${i < 2 ? "open" : ""}><summary><span class="fx-n">${String(i + 1).padStart(2, "0")}</span>${q}</summary><div><p>${a}</p>${ref ? `<a href="#">${ref}</a>` : `<a href="#">Read the full article ${icon("arrow-right", 13)}</a>`}</div></details>`).join("")}</div>` };
  },
  "case-study"(s) {
    return { toc: s.steps.map(([t], i) => [`#c${i}`, t]),
      html: `<nav class="fx-parts small" aria-label="Cases">${s.cases.map((n, i) => `<a href="#" ${i === s.current ? 'aria-current="step"' : ""}><b>${i + 1}</b><span>${n}</span></a>`).join("")}</nav>
        <ol class="fx-steps">${s.steps.map(([t, body, v], i) => `<li id="c${i}"><p class="ap-eyebrow">Step ${i + 1} of 4</p><h2>${t}</h2><p>${body}</p>${v ? verse(v) : ""}</li>`).join("")}</ol>
        <p class="fx-note">${icon("search-check", 16)}${s.infer}</p>` };
  },
};

const { html, toc } = RENDER[format](sample);
const passages = (html.match(/[1-3]?\s?[A-Z][a-z]+ \d+:\d+(?:[–-]\d+)?/g) ?? []).map((ref) => ref.trim().replace("-", "–")).filter((v, i, all) => all.indexOf(v) === i).slice(0, 4);
page.innerHTML = `<a class="back" href="../field/?field=${sample.field}">${icon("arrow-left", 14)}${fieldTitle}</a>
  <header class="fx-head"><div class="fx-meta"><p class="ap-eyebrow">${icon(kind.icon, 13)}<span>${kind.label} · ${sample.minutes} min · ${sample.sources} sources</span></p><button class="ap-save" type="button" aria-pressed="false" aria-label="Save: ${sample.title}">${icon("bookmark", 16)}</button></div>
    <h1>${sample.title}</h1><p class="fx-summary">${sample.summary}</p><p class="fx-spine">${sample.spine === "Academic" ? "Weighing the evidence: what it says · what we infer · where it stops" : "Scripture & theology: read the passage, then ask what it asks of you"}</p></header>
  <div class="fx-layout"><article class="fx-main">${html}</article>
    <aside class="fx-rail" aria-label="About this article">
      <section><p class="ap-eyebrow">In this ${format === "essay" ? "essay" : "article"}</p><ol class="fx-toc">${toc.map(([href, label, on]) => `<li><a href="${href}" ${on ? 'aria-current="true"' : ""}>${label}</a></li>`).join("")}</ol></section>
      ${passages.length ? `<section><p class="ap-eyebrow">${icon("book-open-text", 13)}Open the Scriptures</p><ul class="fx-passages">${passages.map((p) => `<li><a href="#">${p}</a></li>`).join("")}</ul></section>` : ""}
      <section><p class="ap-eyebrow">Go to the source</p><p class="fx-rail-note">Public-domain works are quoted from a checked edition. Modern books are described, never quoted.</p></section>
    </aside></div>`;

const finder = document.getElementById("gq");
if (finder) finder.addEventListener("input", () => {
  const q = finder.value.trim().toLowerCase();
  for (const row of document.querySelectorAll(".fx-terms > div")) row.hidden = Boolean(q) && !row.dataset.term.includes(q);
});
})();
