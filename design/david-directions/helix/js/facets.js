// The facets: every section of the ruler page, one cut face at a time, below the helix. Each facet slides in
// (no fade). Items tied to the helix carry "show on the helix", which lights their crystals or rungs above.
import { esc, claim, quote, kjv, refLink, refList, chip, cites, chapterHref, chapterText } from "./util.js";

const icon = (...a) => window.icon(...a);
const onHelix = (ids, label) => ids.length ? `<button type="button" class="on-helix" data-helix="${esc(ids.join(","))}" data-label="${esc(label)}">${icon("target", 15)}Show on the helix</button>` : "";

const FACETS = [
  { id: "story", label: "His story", icon: "book" },
  { id: "anointings", label: "Three anointings", icon: "oil" },
  { id: "verdict", label: "The verdict", icon: "scale" },
  { id: "two", label: "Two accounts", icon: "columns" },
  { id: "kingdom", label: "The kingdom", icon: "crown" },
  { id: "prophets", label: "Nathan and Gad", icon: "message" },
  { id: "world", label: "World stage", icon: "globe" },
  { id: "dating", label: "Dating", icon: "calendar" },
  { id: "questions", label: "Open questions", icon: "help" },
  { id: "notsaid", label: "Not said", icon: "eyeOff" },
  { id: "passages", label: "Every passage", icon: "open" },
  { id: "sources", label: "Sources", icon: "library" },
];
const head = (kicker, title, lead) => `<header class="f-head"><p class="kicker">${esc(kicker)}</p><h2>${title}</h2>${lead ? `<p>${lead}</p>` : ""}</header>`;
const cut = (inner, cls = "", style = "") => `<div class="cut ${cls}" ${style ? `style="${style}"` : ""}><div class="cut-in">${inner}</div></div>`;

function story(d) {
  const segs = ["Before the throne", "Before the throne", "Before the throne", "The reign", "The reign", "Old age and death"];
  return head("His story", "A life in six cuts", "Written by this site from Scripture, with every verse it rests on.") +
    `<div class="f-story">${d.story.map((p, i) => cut(`<span class="f-num">${String(i + 1).padStart(2, "0")}</span><p class="f-seg">${segs[i]}</p><p class="f-text">${esc(p.text)}</p><footer>${chip("story")}<span class="refs">${refList(p.refs)}</span></footer>`, "f-para")).join("")}</div>
    <div class="f-pair">${cut(`<p class="f-mini">${icon("crown", 15)}The united kingdom</p>${claim(d.intro[0])}`)}${cut(`<p class="f-mini">${icon("crown", 15)}How it ended</p>${claim(d.intro[2])}`)}</div>`;
}

function anointings(d) {
  const ids = ["anointed-samuel", "king-over-judah-at-hebron", "king-over-all-israel"];
  const where = ["Bethlehem", "Hebron", "Hebron"], who = ["by Samuel", "by the men of Judah", "by the elders of Israel"];
  return head("Three anointings", "Anointed three times", "1–2 Samuel record three anointings; Chronicles tells only the last.") +
    `<div class="f-three">${ids.map((id, i) => { const c = d.crystalById[id]; return cut(`<div class="f-oil"><span>${i + 1}</span>${icon("oil", 34, 1.4)}</div>
      <p class="f-seg">${where[i]} · ${who[i]}</p>${claim(d.accession[i])}${kjv(c.verse, "kjv-sm")}${onHelix([id], c.label)}`, "f-anoint"); }).join("")}</div>
    <div class="f-pair">${cut(`<p class="f-mini">${icon("columns", 15)}Chronicles</p>${claim(d.accession[3])}`)}${cut(`<p class="f-mini">${icon("check", 15)}From the text</p>${claim(d.accession[4])}`)}</div>`;
}

function verdict(d) {
  const book = { samuel: "1–2 Samuel", kings: "1 Kings", chronicles: "1 Chronicles" };
  const row = (label, f) => `<tr><th>${label}</th>${d.records.map((r) => `<td>${f(r) ?? '<span class="f-none">Not given</span>'}</td>`).join("")}</tr>`;
  const q = (x) => x ? `“${esc(x.text)}” ${refLink(x.span)}` : null;
  return head("The verdict", "Right, save only in one matter", "The Bible's own verdict, word for word. The page adds none of its own.") +
    cut(`<div class="f-verdict"><span class="f-tone">${icon("check", 28, 2)}<b>Did right</b></span>${kjv(d.verdictVerse)}</div>`, "f-big", "--c:var(--k-anointing)") +
    `<div class="f-list">${d.verdictNotes.map((n) => cut(claim(n))).join("")}</div>
    <h3 class="f-sub">${icon("columns", 18)}Scripture's record, book by book</h3>
    <div class="f-table"><table><thead><tr><th></th>${d.records.map((r) => `<th>${book[r.book] ?? r.book}</th>`).join("")}</tr></thead><tbody>
      ${row("Age at accession", (r) => r.age ? `${r.age.years} ${refLink(r.age.span)}` : null)}
      ${row("Length", (r) => r.length ? `${r.length.years} years ${refLink(r.length.span)}` : null)}
      ${row("Capital", (r) => r.capital ? `${esc(r.capital.name)} ${refLink(r.capital.span)}` : null)}
      ${row("Verdict", (r) => q(r.verdict))}
      ${row("Death", (r) => r.death ? `${esc(r.death.text)} ${refList(r.death.refs)}` : null)}
      ${row("Burial", (r) => q(r.burial))}
      ${row("Sources it names", (r) => q(r.sourcesCited))}
    </tbody></table></div>`;
}

function two(d) {
  const rungOf = (t) => d.rungs.find((r) => r.topic === t.topic);
  return head("Two accounts", "Samuel and Kings beside Chronicles", esc(d.intro[1].text)) +
    `<div class="f-two">${d.twoAccounts.map((t) => { const r = rungOf(t); const ids = r ? [r.id] : t.topic === "What Chronicles leaves out" ? d.crystals.filter((c) => c.chronicles === "left-out").map((c) => c.id) : [];
      return cut(`<h3>${esc(t.topic)}</h3><div class="f-cols"><section class="is-sk"><p class="f-mini">Samuel · Kings</p>${claim(t.first)}</section><section class="is-chr"><p class="f-mini">Chronicles</p>${claim(t.second)}</section></div>${onHelix(ids, t.topic)}`, "f-acc"); }).join("")}</div>`;
}

function kingdom(d) {
  const lenses = [["worship", "Worship", "harp"], ["building", "Building", "hammer"], ["alliances", "Alliances & tribute", "landmark"], ["people", "The people", "users"]];
  const cap = d.places.find((p) => p.placeId === d.person.capital.placeId);
  return head("The kingdom", "From Hebron to Jerusalem", `${esc(d.person.capital.note)} ${refList(d.person.capital.refs)}`) +
    `<div class="f-lens" data-lens>${lenses.map(([id, l, ic], i) => `<button type="button" data-lens-btn="${id}" aria-pressed="${i === 0}">${icon(ic, 18)}${l}</button>`).join("")}</div>
    ${lenses.map(([id], i) => `<div class="f-lens-body" data-lens-body="${id}" ${i ? "hidden" : ""}>${cut(d.nation[id].map((c) => claim(c)).join(""))}</div>`).join("")}
    <h3 class="f-sub">${icon("pin", 18)}The places of his life <small>${d.places.length} places · distances are straight lines from Jerusalem, worked out from the Atlas's coordinates</small></h3>
    <div class="f-places">${d.places.map((p) => cut(`<b>${esc(p.name)}</b><span class="f-pl-note">${esc(p.note ?? "")}</span>
      <span class="f-pl-dist">${esc(p.where)}</span><span class="refs">${refList(p.refs)}</span>
      ${onHelix(p.crystals, p.name)}`, `f-place${p === cap ? " is-cap" : ""}`)).join("")}</div>`;
}

function prophets(d) {
  return head("Prophets of the reign", "Samuel, Gad and Nathan", "Each with the line where he counselled or confronted the king.") +
    `<div class="f-three">${d.prophets.map((p) => { const ids = d.crystals.filter((c) => (c.claim.refs ?? []).some((s) => p.claim.refs.some((x) => s[0] <= x[1] && s[1] >= x[0]))).map((c) => c.id);
      return cut(`<div class="f-medal">${esc(p.person.name.slice(0, 1))}</div><h3>${esc(p.person.name)}</h3>${quote(p.quote, "q-call")}${claim(p.claim)}${onHelix(ids, p.person.name)}`, "f-prophet"); }).join("")}</div>`;
}

function world(d) {
  return head("On the world stage", "The nations around him", "Scripture's neighbours of the reign, then the records from outside the Bible, kept apart.") +
    `<div class="f-world">${d.worldStage.map((w) => cut(`<h3>${icon("globe", 16)}${esc(w.power)}</h3>${w.rulers.length ? `<p class="f-rulers">${w.rulers.map((r) => esc(r.name)).join(" · ")}</p>` : ""}${claim(w.claim)}`)).join("")}</div>
    <h3 class="f-sub">${icon("scroll", 18)}Outside the Bible</h3>
    <div class="f-out">${d.outside.map((o) => cut(`<p class="f-mini">${esc(o.date)}</p><h3>${esc(o.name)}</h3>${claim(o.claim)}`, "f-outside")).join("")}</div>`;
}

function dating(d) {
  const lo = 1060, hi = 955, x = (y) => ((lo - y) / (lo - hi)) * 100;
  const sys = d.dates.filter((s) => s.system !== "bible"), bible = d.dates.find((s) => s.system === "bible");
  return head("Dating", "When was the reign?", `${esc(d.intro[3].text)} ${cites(d.intro[3].cites)}`) +
    cut(`<div class="f-chart" role="img" aria-label="The reign's dates in three systems, in years BC">
      <div class="f-axis">${[1060, 1040, 1020, 1000, 980, 960].map((y) => `<span style="left:${x(y)}%">${y} BC</span>`).join("")}</div>
      ${sys.map((s) => `<div class="f-bar-row"><p>${esc(s.label)}</p><div class="f-bar-track">${s.from ? `<i class="f-bar" style="left:${x(s.from)}%;width:${x(s.to) - x(s.from)}%"><b>${s.from}–${s.to}</b></i>` : `<i class="f-bar is-open" style="left:${x(s.to) - 14}%;width:14%"><b>to ${s.to}</b></i>`}</div></div>`).join("")}
    </div>`, "f-big") +
    `<div class="f-list">${cut(`<p class="f-mini">${esc(bible.label)}</p><p class="f-text">${esc(bible.note)}</p>`)}${sys.map((s) => cut(`<p class="f-mini">${esc(s.label)}</p><p class="f-text">${esc(s.note)}</p><footer>${chip("scholars")}<span class="refs">${cites(s.cites)}</span></footer>`)).join("")}</div>`;
}

function questions(d) {
  return head("Open questions", "Where readers disagree", "Each view with who holds it. The page does not choose between them.") +
    `<div class="f-qs">${d.questions.map((q) => cut(`<h3>${icon("help", 18)}${esc(q.question)}</h3><div class="f-views">${q.views.map((v) => `<section><p class="f-view-l">${esc(v.label)}</p><p class="f-holders">${icon("users", 14)}${esc(v.holders)}</p>${claim(v.argument)}</section>`).join("")}</div>`)).join("")}</div>`;
}

function notsaid(d) {
  return head("What Scripture does not say", "The gaps, stated plainly", "") +
    `<div class="f-list">${d.notSaid.map((n) => cut(`<p class="f-text">${icon("eyeOff", 18)} ${esc(n)}</p>`, "f-gap")).join("")}</div>
    <h3 class="f-sub">${icon("users", 18)}A note on his family data</h3>${cut(claim(d.identifications[0]))}`;
}

function passages(d) {
  return head("Every passage", `${d.person.verseCount} verses name him`, "The reign's passages first, then every chapter where he is named, with its count.") +
    `<div class="f-pass">${d.passages.map((s) => `<a class="f-pass-big" href="/read/kjv/${d.books[Math.floor(s[0] / 1e6)].code}/${Math.floor((s[0] % 1e6) / 1e3)}">${icon("open", 18)}${refLink(s)}</a>`).join("")}</div>
    <div class="f-chapters">${d.chapters.map((c) => `<a href="${chapterHref(c.book, c.ch)}">${esc(chapterText(c.book, c.ch))}<b>${c.n}</b></a>`).join("")}</div>`;
}

function sources(d) {
  return head("Sources", "Who this page relies on", "Scripture is quoted from the KJV. Scholars and ancient records are cited here.") +
    `<ol class="f-sources">${d.citations.map((c) => `<li id="source-${esc(c.id)}">${cut(`<b>${esc(c.author)}</b> (${esc(c.year)}). <i>${esc(c.title)}</i>${c.where ? `, ${esc(c.where)}` : ""}. ${c.url ? `<a class="ref" href="${esc(c.url)}" target="_blank" rel="noreferrer">Open the source</a>` : ""}`)}</li>`).join("")}</ol>`;
}

const BUILD = { story, anointings, verdict, two, kingdom, prophets, world, dating, questions, notsaid, passages, sources };

export function mountFacets(root, data, journey) {
  root.innerHTML = `<div class="wrap">
    <header class="facets-head"><p class="kicker">${icon("gem", 15)}Facets of the reign</p><h2>Turn the crystal</h2><p>Every part of the reign, one face at a time. Anything marked “show on the helix” lights up above.</p></header>
    <div class="facet-rail-wrap"><nav class="facet-rail" role="tablist" aria-label="Facets of the reign">${FACETS.map((f, i) => `<button type="button" role="tab" id="tab-${f.id}" data-facet="${f.id}" aria-selected="${i === 0}" aria-controls="facet-panel"><span class="hex">${icon(f.icon, 26, 1.5)}</span><span class="fl">${esc(f.label)}</span></button>`).join("")}</nav></div>
    <div class="facet-stage"><section class="facet-panel" id="facet-panel" role="tabpanel"></section></div></div>`;
  const panel = root.querySelector("#facet-panel");
  let current = -1;
  function open(id, scroll = false) {
    const i = FACETS.findIndex((f) => f.id === id);
    if (i < 0 || i === current) { if (scroll) root.scrollIntoView({ behavior: "auto" }); return; }
    const dir = i > current ? 1 : -1;
    current = i;
    root.querySelectorAll("[data-facet]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.facet === id)));
    panel.setAttribute("aria-labelledby", `tab-${id}`);
    panel.innerHTML = BUILD[id](data);
    panel.style.setProperty("--from", `${dir * 56}px`);
    panel.classList.remove("is-slide"); void panel.offsetWidth; panel.classList.add("is-slide");
    root.querySelector(`[data-facet="${id}"]`).scrollIntoView({ block: "nearest", inline: "nearest" });
    if (scroll) root.scrollIntoView({ behavior: "auto" });
  }
  root.addEventListener("click", (e) => {
    const f = e.target.closest("[data-facet]");
    if (f) return open(f.dataset.facet);
    const h = e.target.closest("[data-helix]");
    if (h) return journey.focus(h.dataset.helix.split(","), h.dataset.label);
    const l = e.target.closest("[data-lens-btn]");
    if (l) { const box = l.closest(".facet-panel"); box.querySelectorAll("[data-lens-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b === l))); box.querySelectorAll("[data-lens-body]").forEach((b) => { b.hidden = b.dataset.lensBody !== l.dataset.lensBtn; }); return; }
    const s = e.target.closest("[data-source]");
    if (s) { e.preventDefault(); open("sources", true); requestAnimationFrame(() => document.getElementById(`source-${s.dataset.source}`)?.scrollIntoView({ block: "center" })); }
  });
  root.addEventListener("keydown", (e) => {
    const t = e.target.closest("[data-facet]");
    if (!t || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const i = FACETS.findIndex((f) => f.id === t.dataset.facet) + (e.key === "ArrowRight" ? 1 : -1);
    const f = FACETS[(i + FACETS.length) % FACETS.length];
    open(f.id); root.querySelector(`[data-facet="${f.id}"]`).focus();
  });
  document.addEventListener("facet:open", (e) => open(e.detail, true));
  document.addEventListener("click", (e) => {
    const s = e.target.closest(".hud-panel [data-source]");
    if (s) { e.preventDefault(); open("sources", true); }
  });
  open("story");
  return { open };
}
