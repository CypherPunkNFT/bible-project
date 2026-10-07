// The Letters study in the site's own frame: header, footer, theme, page addresses (#/...), and the pages both layouts share.
// Each layout (letters-layouts/, letters-layouts-2/) adds its own Paul's letters page and calls start().
Object.assign(ICON, {
  graduation: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  tags: '<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.59 5.59A2 2 0 0 0 8.17 5H3a1 1 0 0 0-1 1v5.17a2 2 0 0 0 .59 1.42l5.7 5.7a2.43 2.43 0 0 0 3.42 0l3.58-3.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>',
  branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  library: '<rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"/>',
});
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;
const art = (name, cls = "art") => `<svg class="${cls}" viewBox="0 0 480 185" fill="none" stroke-linecap="round" aria-hidden="true">${ART[name]}</svg>`;
const pad2 = (n) => String(n).padStart(2, "0");
const slug = (title) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const LIVE = "/study/letters"; // today's Letters page, where every chart already works

// ── Site chrome ─────────────────────────────────────────────────────────────────────────
function savedTheme() {
  try { const v = localStorage.getItem("bp-theme"); if (v === "dark" || v === "light") return v; } catch (error) { console.warn("theme: localStorage unavailable", error); }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function header() {
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/topics", "Topics", "tags"], ["/study/atlas", "Atlas", "map"]];
  const dark = document.documentElement.dataset.theme === "dark";
  return `<header class="site-header">
    <div class="strip" aria-hidden="true">${["history", "poetry", "prophets", "gospels", "epistles", "revelation"].map((s) => `<span style="background: var(--${s})"></span>`).join("")}</div>
    <div class="bar">
      <a href="/" class="logo"><img src="../letters-shared/favicon.svg" alt=""><span>Bible Project</span></a>
      <nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
        <span class="sep" aria-hidden="true"></span><a href="/testimonies" class="community">${icon("branch", 16)}<span>Testimonies</span></a></nav>
      <a href="/search" class="search-btn" aria-label="Search" title="Search">${icon("search", 16)}</a>
      <button type="button" class="theme-switch" id="theme-switch" role="switch" aria-checked="${dark}" aria-label="Dark mode"><span>${icon(dark ? "moon" : "sun", 14)}</span></button>
    </div>
  </header>`;
}
function footer() {
  const paths = [["Spend time in the Word", [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]]],
    ["Follow your questions", [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]]]];
  return `<footer class="site-footer"><div class="foot-inner">
    <div class="foot-grid">
      <div class="foot-brand"><a href="/"><img src="../letters-shared/favicon.svg" alt="">Bible Project</a>
        <h2>Rooted in Scripture.<br><em>Open for discovery.</em></h2>
        <p>A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p>
        <a href="/read" class="foot-cta">${icon("book", 16)}Return to the Word${icon("arrowRight", 16)}</a></div>
      <nav class="foot-nav" aria-label="Footer">${paths.map(([title, links]) => `<div><h3>${title}</h3><ul>${links.map(([l, to]) => `<li><a href="${to}">${l}</a></li>`).join("")}</ul></div>`).join("")}</nav>
    </div>
    <div class="foot-cards">
      <a href="/sources"><span style="color: var(--accent)">${icon("library", 28)}</span><div style="flex:1"><h3>A library with a paper trail.</h3><p>Meet the authors. Explore the collection. Trace each work to its source.</p></div><span class="go-text">Sources & references${icon("arrowUp", 16)}</span></a>
      <a href="https://github.com/CypherPunkNFT/bible-project"><div><h3>Download the code.</h3><p>Open source on GitHub.</p></div><span class="go-text">${icon("arrowUp", 16)}</span></a>
    </div>
  </div></footer>`;
}

// ── Page addresses: #/letters-path → a page; actions (data-act) redraw the page in place ───────
window.ROUTES = [];
window.ACTIONS = {};
let currentRender = () => "";
function navigate() {
  const path = location.hash.replace(/^#\/?/, "");
  const found = ROUTES.find(([re]) => re.test(path)) ?? ROUTES[0];
  const match = path.match(found[0]) ?? [];
  currentRender = () => found[1](match);
  // A link marked data-slide (a section switch) keeps the page where it is and wipes the new content in from the left,
  // the Topics and Atlas transition (src/pages/topics/useTopicsPageSlide.ts); every other link starts at the top.
  if (slideNext) {
    slideNext = false;
    const doc = document;
    if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.slide = "wipe";
      doc.startViewTransition(draw).finished.catch(() => undefined).then(() => { delete document.documentElement.dataset.slide; });
    } else draw();
    return;
  }
  draw();
  window.scrollTo({ top: 0 });
}
let slideNext = false;
function draw() { document.getElementById("main").innerHTML = `<div class="wrap">${currentRender()}</div>`; }
function start() {
  document.documentElement.dataset.theme = savedTheme();
  document.body.innerHTML = `${header()}<main id="main"></main>${footer()}`;
  // A home card's own page, after each layout's Paul routes.
  ROUTES.push([/^([a-z0-9-]+)$/, (m) => { const c = HUB.find((x) => x.slug === m[1]); return c ? hubCardPage(c) : hub(); }]);
  addEventListener("hashchange", navigate);
  document.addEventListener("click", (e) => {
    if (e.target.closest("a[data-slide]")) slideNext = true;
    const act = e.target.closest("[data-act]");
    if (act) { e.preventDefault(); ACTIONS[act.dataset.act](act.dataset.arg ?? ""); draw(); return; }
    if (e.target.closest("#theme-switch")) {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("bp-theme", next); } catch (error) { console.warn("theme: could not save", error); }
      document.documentElement.dataset.theme = next;
      const sw = document.getElementById("theme-switch");
      sw.setAttribute("aria-checked", String(next === "dark")); sw.firstElementChild.innerHTML = icon(next === "dark" ? "moon" : "sun", 14);
    }
  });
  navigate();
}

// ── Cards and rows (TopicsHome's FamilyCard) ────────────────────────────────────────────
const card = (c, n) => `
  <a href="${c.href}" class="card" style="--tone: var(--${c.tone})">
    <div class="card-top">${icon(c.icon)}<span>${c.eyebrow}</span><span class="go">${icon("arrowUp", 19)}</span></div>
    ${art(c.art)}
    <div><span class="card-num">${pad2(n)}</span><h3>${c.title}</h3><p>${c.text}</p></div>
    <div class="card-foot"><span>${c.foot}</span><strong>${c.cta}${icon("arrowRight", 15)}</strong></div>
  </a>`;
function rowsHtml(rows, compact = false, first = 1) {
  let n = first - 1;
  return rows.map((row, r) => `
    <section class="row" id="row-${row.id}">
      <div class="row-head"><h2><span>${pad2(r + 1)}</span>${row.title}</h2><p>${row.lead}</p></div>
      ${row.before ?? ""}
      <div class="cards${compact ? " compact" : ""}">${row.cards.map((c) => card(c, ++n)).join("")}</div>
    </section>`).join("");
}
const crumbs = (parts, right = "LETTERS") => `<div class="topline"><span class="crumbs"><a href="#/">${icon("arrowLeft", 15)}Letters</a>${parts.map((p) => `<span>/</span>${p}`).join("")}</span><span>${right}</span></div>`;
const rail = (title, items) => `<nav class="rail" aria-label="${title}"><p>${title}</p><div class="rail-list${items.length <= 6 ? " rail-4" : ""}">${items.map((x) =>
  `<a href="${x.href}" class="${x.section ? "rail-section" : ""}" style="--tone: var(--${x.tone})" ${x.current ? 'aria-current="page"' : ""}>${art(x.art, "")}${x.section ? `<span>${x.title}<small>${x.section}</small></span>` : x.title}</a>`).join("")}</div></nav>`;

/** The page a card opens: where it sits, its title and drawing, the chart, then the cards around it. */
const opened = ({ path, c, kicker, lead, body, after = "", right }) => `
  ${crumbs(path, right)}
  <header class="chapter-head" style="--tone: var(--${c.tone})"><div><p class="kicker">${kicker}</p><h1>${c.title}</h1><p>${lead}</p></div>${art(c.art)}</header>
  ${body}${after}`;
/** A chart that already works on today's Letters page: the card's drawing, what it shows, and the way to it. */
const chartLink = (c, live) => `<div class="panel" style="--tone: var(--${c.tone})"><div class="chart-link">${art(c.art)}
  <div><p>${c.text}</p><a class="open-chart" href="${live}">${c.cta}${icon("arrowRight", 15)}</a></div></div></div>`;

// ── Letters home ────────────────────────────────────────────────────────────────────────
const HUB_ROWS = [
  { id: "collections", title: "The four collections", lead: "Choose a group to read its letters one at a time.", cards: [
    { art: "paul", tone: "epistles", icon: "route", eyebrow: "Thirteen letters", title: "Paul's letters", text: "Letters to young churches and friends, written on the road and from prison.", foot: "Early · Major · Prison · Pastoral", cta: "Open 13 letters", href: "#/paul" },
    { art: "hebrews", tone: "gospels", icon: "tent", eyebrow: "One long sermon", title: "Hebrews", text: "A sermon-letter by an unnamed writer, on Christ and the old covenant.", foot: "Better than… · The hall of faith · Melchizedek", cta: "Open the letter", live: `${LIVE}#hebrews` },
    { art: "general", tone: "acts", icon: "globe", eyebrow: "Scattered abroad", title: "James, Peter & Jude", text: "Four short letters to believers far from home: faith at work, suffering and false teaching.", foot: "James · 1 Peter · 2 Peter · Jude", cta: "Open 4 letters", live: `${LIVE}#general-letters` },
    { art: "john", tone: "revelation", icon: "lamp", eyebrow: "Light and love", title: "The letters of John", text: "Three letters on love, truth and fellowship, from a single voice.", foot: "1 John · 2 John · 3 John", cta: "Open 3 letters", live: `${LIVE}#john-letters` },
  ] },
  { id: "came-to-be", title: "How the letters came to be", lead: "When and where they were written, how a letter was put together, and whose hands carried it.", cards: [
    { art: "when", tone: "prophets", icon: "clock", eyebrow: "In time", title: "When they were written", text: "All twenty-one on one line of years, each spanning the dates its sources propose.", foot: "AD 40–180 · widest range proposed", cta: "See the timeline" },
    { art: "where", tone: "poetry", icon: "map", eyebrow: "On the map", title: "Where the letters went", text: "The cities and provinces each group's letters were sent to.", foot: "Four groups · toggle each on the map", cta: "Open the map" },
    { art: "form", tone: "epistles", icon: "mail", eyebrow: "An ancient letter", title: "How a letter was built", text: "The seven parts every letter of the day followed, from the greeting to the farewell, with examples.", foot: "Opening · Thanksgiving · Body · More", cta: "See the parts" },
    { art: "hands", tone: "history", icon: "pen", eyebrow: "Pen and road", title: "Who wrote and carried them", text: "Secretaries, couriers, co-senders, and the places the writer took the pen himself.", foot: "Tertius · Phebe · Tychicus · More", cta: "Meet them" },
  ] },
  { id: "runs-through", title: "What runs through them", lead: "The Scriptures, words, themes and people the groups share.", cards: [
    { art: "ot", tone: "epistles", icon: "book", eyebrow: "Old Testament", title: "The Old Testament behind them", text: "207 quotations, traced from the book they come from to the letters that quote them.", foot: "Psalms · Isaiah · Genesis · More", cta: "Follow the quotations" },
    { art: "words", tone: "gospels", icon: "star", eyebrow: "Greek words", title: "The words they lean on", text: "Each group's key Greek words as stars; a bigger star means more uses.", foot: "Choose a star for every verse", cta: "See the words" },
    { art: "themes", tone: "acts", icon: "link", eyebrow: "Shared threads", title: "What the groups share", text: "Ten threads that run through more than one group of letters.", foot: "Faith that works · Holiness · More", cta: "Follow a thread" },
    { art: "people", tone: "poetry", icon: "users", eyebrow: "Names", title: "People who cross the groups", text: "Twenty-one people named in more than one group, from Silas and Mark to Abraham and Rahab.", foot: "Timothy · Barnabas · Apollos · More", cta: "Meet them" },
  ] },
  { id: "look-closer", title: "Look closer", lead: "Set letters side by side, see where readers have differed, and how the church received them.", cards: [
    { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Side by side", title: "Compare any two letters", text: "Pick two. Each ribbon joins a verse in one to a verse in the other.", foot: "Reader-linked verses · OpenBible.info", cta: "Choose two" },
    { art: "shape", tone: "epistles", icon: "bars", eyebrow: "Length", title: "All twenty-one, side by side", text: "Each letter as long as it is, cut into its sections.", foot: "2,767 verses · section headings", cta: "See the shapes" },
    { art: "questions", tone: "history", icon: "split", eyebrow: "Open questions", title: "Where readers have differed", text: "Five questions, each answer shown with the people who held it.", foot: "Which letter came first? · More", cta: "Read the views" },
    { art: "canon", tone: "revelation", icon: "check", eyebrow: "The canon", title: "How they were gathered and received", text: "Witness by witness, from the first quotations to the church councils.", foot: "Gathering · Doubts · Acceptance", cta: "See the witnesses" },
  ] },
];
// Every card gets its address on the card itself, so the home rows and the card pages agree.
HUB_ROWS.forEach((row) => row.cards.forEach((c) => { c.slug = slug(c.title); c.href ??= `#/${c.slug}`; c.live ??= LIVE; c.row = row; }));
const HUB = HUB_ROWS.flatMap((row) => row.cards);

function hub() {
  return `
    <div class="topline"><a href="/study">${icon("arrowLeft", 15)}Back to Study</a><span>LETTERS</span></div>
    <header class="intro">
      <div class="intro-copy">
        <p class="kicker">Study · New Testament letters</p>
        <h1>Twenty-one letters.<br><em>Read as they were sent.</em></h1>
        <p>Written to real churches and friends, dictated and signed, carried by hand and read aloud. Choose a collection to read
          its letters, or a question to follow across all twenty-one.</p>
      </div>
      <div class="emblem" aria-hidden="true">${icon("mail", 120)}<span>WRITTEN · CARRIED · READ ALOUD</span></div>
    </header>
    <dl class="figures">
      <div><dt>Letters</dt><dd>21</dd></div><div><dt>Verses</dt><dd>2,767</dd></div>
      <div><dt>Collections</dt><dd>4</dd></div><div><dt>Written</dt><dd>AD 40–180</dd></div>
    </dl>
    <nav class="jump" aria-label="Sections">${HUB_ROWS.map((r, i) => `<a href="#row-${r.id}" onclick="document.getElementById('row-${r.id}').scrollIntoView({behavior:'smooth'});return false"><span>${pad2(i + 1)}</span>${r.title}</a>`).join("")}</nav>
    ${rowsHtml(HUB_ROWS)}
    <p class="sources-line">Public-domain works and the biblical text itself. <a href="${LIVE}">Where this page comes from →</a></p>`;
}

// ── A home card's own page (the Old Testament one carries its chart) ─────────────────────
const OT_LINKS = [["Isaiah", "Paul's letters", 24], ["Psalms", "Paul's letters", 20], ["Deuteronomy", "Paul's letters", 12], ["Genesis", "Paul's letters", 13], ["17 more books", "Paul's letters", 22], ["Exodus", "Paul's letters", 7], ["Psalms", "Hebrews", 19], ["17 more books", "Hebrews", 7], ["Deuteronomy", "Hebrews", 4], ["Isaiah", "Hebrews", 2], ["Genesis", "Hebrews", 4], ["Exodus", "Hebrews", 3], ["Isaiah", "James, Peter & Jude", 14], ["Psalms", "James, Peter & Jude", 5], ["17 more books", "James, Peter & Jude", 28], ["Genesis", "James, Peter & Jude", 14], ["Exodus", "James, Peter & Jude", 3], ["Deuteronomy", "James, Peter & Jude", 5], ["Genesis", "The letters of John", 1]];
const otState = { book: "Psalms" };
ACTIONS.otBook = (b) => { otState.book = b || null; };
function otChart() {
  const W = 1000, L = 170, R = 830, unit = 2.1, gap = 10;
  const sum = (k) => { const m = new Map(); OT_LINKS.forEach((l) => m.set(l[k], (m.get(l[k]) ?? 0) + l[2])); return m; };
  const order = ["Psalms", "Isaiah", "Genesis", "Deuteronomy", "Exodus", "17 more books"];
  const stack = (names, totals) => { let y = 16; const m = new Map(); names.forEach((n) => { const h = Math.max(4, totals.get(n) * unit); m.set(n, { y, h, total: totals.get(n) }); y += h + gap; }); return m; };
  const left = stack(order, sum(0)), right = stack([...sum(1).keys()], sum(1)), kept = otState.book;
  const usedL = new Map(), usedR = new Map();
  const bands = OT_LINKS.map(([s, t, v]) => {
    const a = left.get(s), b = right.get(t), h = v * unit;
    const sy = a.y + (usedL.get(s) ?? 0), ty = b.y + (usedR.get(t) ?? 0);
    usedL.set(s, (usedL.get(s) ?? 0) + h); usedR.set(t, (usedR.get(t) ?? 0) + h);
    const on = !kept || s === kept || t === kept;
    return `<path d="M${L + 12},${sy}C500,${sy} 500,${ty} ${R},${ty}L${R},${ty + h}C500,${ty + h} 500,${sy + h} ${L + 12},${sy + h}Z" fill="var(--epistles)" opacity="${on ? (kept ? .55 : .28) : .07}"/>`;
  }).join("");
  const nodes = (m, x, side) => [...m].map(([n, { y, h, total }]) => `<g style="cursor:pointer" data-act="otBook" data-arg="${n}">
    <rect x="${x}" y="${y}" width="12" height="${h}" rx="3" fill="var(--epistles)" opacity="${side === "r" ? .8 : 1}"/>
    <text x="${side === "l" ? x - 8 : x + 20}" y="${y + h / 2 + 4}" text-anchor="${side === "l" ? "end" : "start"}" fill="${n === kept ? "var(--ink)" : "var(--muted)"}"
      style="font: ${n === kept ? "600 13px" : "12px"} var(--sans)">${n} · ${total}</text></g>`).join("");
  const height = Math.max(...[...left.values(), ...right.values()].map((n) => n.y + n.h)) + 16;
  const focus = kept ? OT_LINKS.filter(([s, t]) => s === kept || t === kept) : [];
  return `<svg class="chart" viewBox="0 0 ${W} ${height}" role="img" aria-label="Old Testament books flowing into the letters">${bands}${nodes(left, L, "l")}${nodes(right, R, "r")}</svg>
    <p class="tip">${kept ? `<b style="color:var(--ink)">${kept}</b><button type="button" class="keep-x" data-act="otBook" data-arg="" aria-label="Let go">✕</button> · ${focus.map(([s, t, v]) => `${s === kept ? t : s} · ${v}`).join(" &nbsp;·&nbsp; ")}`
      : "207 quotations. Point at a book or a letter group to see the passages; click one to keep them open."}</p>`;
}
function hubCardPage(c) {
  const i = HUB.indexOf(c), prev = HUB[(i + HUB.length - 1) % HUB.length], next = HUB[(i + 1) % HUB.length];
  const body = c.art === "ot" ? `<div class="panel">${otChart()}<p class="caption">Every Old Testament passage the letters quote, traced from the book it comes from to the letters that quote it.
    The Psalms, Isaiah and the books of Moses carry most of the weight. John's letters quote no Old Testament passage; their one band is 1 John's allusion to Cain (Genesis 4:8).</p></div>` : chartLink(c, c.live);
  const pager = (x, dir) => `<a href="${x.href}" style="--tone: var(--${x.tone})">${art(x.art, "mini")}<span><small>${dir}</small><b>${x.title}</b></span></a>`;
  return opened({ path: [c.row.title], c, kicker: `${c.eyebrow} · across all 21 letters`, lead: c.text, right: `${pad2(i + 1)} OF ${HUB.length}`, body,
    after: `<nav class="pager" aria-label="Next and previous">${pager(prev, "Previous")}${pager(next, "Next")}</nav>${rail("Every card", HUB.map((x) => ({ ...x, current: x === c })))}` });
}

// ── Paul's pages that both layouts open ─────────────────────────────────────────────────
const P = window.PAUL;
const paulState = { letter: "Romans", journey: "journey-2", destinations: true, fact: "author", verse: 0, pair: undefined, kind: "all" }; // pair: undefined until first shown, null once let go
Object.assign(ACTIONS, {
  letter: (name) => { paulState.letter = name; paulState.verse = 0; },
  journey: (id) => { paulState.journey = id; },
  destinations: () => { paulState.destinations = !paulState.destinations; },
  fact: (id) => { paulState.fact = id; },
  verse: (i) => { paulState.verse = Number(i); },
  pair: (i) => { paulState.pair = i === "" ? null : Number(i); },
  kind: (k) => { paulState.kind = k; paulState.pair = null; },
});
const PAUL_GROUPS = [["Early letters", ["1 Thessalonians", "2 Thessalonians"]], ["Major letters", ["Romans", "1 Corinthians", "2 Corinthians", "Galatians"]],
  ["Prison letters", ["Ephesians", "Philippians", "Colossians", "Philemon"]], ["Pastoral letters", ["1 Timothy", "2 Timothy", "Titus"]]];
const letterPicker = () => `<div class="picker" style="--tone: var(--epistles)">${PAUL_GROUPS.map(([g, list]) => `<div><small>${g}</small><div class="chips">${list.map((l) =>
  `<button type="button" class="chip" data-act="letter" data-arg="${l}" aria-pressed="${l === paulState.letter}">${l}</button>`).join("")}</div></div>`).join("")}</div>`;

/** Paul's twelve cards, grouped three ways; each layout arranges the groups its own way. */
const PAUL_GROUPS_OF_CARDS = () => [
  { id: "story", art: "paul", tone: "epistles", title: "Paul's story", lead: "The journeys, the years, and the friends who travelled with him.", cards: [
    { art: "paul", tone: "epistles", icon: "route", eyebrow: "On the map", title: "Journeys and destinations", text: "Each journey drawn leg by leg, with the places his letters were sent.", foot: "Three journeys · the voyage to Rome", cta: "Open the map", page: "journeys" },
    { art: "life", tone: "prophets", icon: "clock", eyebrow: "In time", title: "Paul's life and letters", text: "His life on one line of years, each letter placed where it was written.", foot: "From his calling to Rome", cta: "See the timeline" },
    { art: "people", tone: "poetry", icon: "users", eyebrow: "Companions", title: "His companions over time", text: "Who travelled and wrote with him, and when.", foot: "Timothy · Silas · Luke · More", cta: "Meet them" },
    { art: "onesimus", tone: "acts", icon: "mail", eyebrow: "A story in letters", title: "The story of Onesimus", text: "A runaway slave sent home with a letter from Rome to Colossae.", foot: "Philemon · Colossians", cta: "Follow the story" },
  ] },
  { id: "inside", art: "glance", tone: "prophets", title: `Inside ${paulState.letter}`, lead: "Choose any of the thirteen; these four cards follow it.", cards: [
    { art: "glance", tone: "epistles", icon: "book", eyebrow: "At a glance", title: `${paulState.letter} at a glance`, text: "Who wrote it, to whom, from where and when, with its key verses and themes.", foot: "Key verses · Themes", cta: "Read the overview", page: "romans" },
    { art: "shape", tone: "history", icon: "bars", eyebrow: "Its shape", title: "How it is built", text: "The letter cut into its sections, and its outline in our own words.", foot: "Teaching · Practice · Personal", cta: "See the outline" },
    { art: "words", tone: "gospels", icon: "star", eyebrow: "Greek words", title: "The words it leans on", text: "Its key Greek words as stars; choose one for every verse.", foot: "Every verse behind each star", cta: "See the words" },
    { art: "ot", tone: "epistles", icon: "book", eyebrow: "Old Testament", title: `The Old Testament behind ${paulState.letter}`, text: "Each quotation linked to the passage it comes from.", foot: "Psalms · Isaiah · More", cta: "Follow the quotations" },
  ] },
  { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "Pairs of letters, the people Paul greets, and how the church received them.", cards: [
    { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Twin letters", title: "Ephesians and Colossians", text: "Two letters written close together, passage against passage.", foot: "31 paired passages", cta: "Compare them", page: "ephesians-colossians" },
    { art: "people", tone: "poetry", icon: "users", eyebrow: "Romans 16", title: "The people of Paul's greetings", text: "Every name in Romans 16, and where else Scripture names them.", foot: "Phebe · Priscilla and Aquila · More", cta: "Meet them" },
    { art: "questions", tone: "history", icon: "split", eyebrow: "Open questions", title: "Where readers have differed", text: "Each answer shown with the people who held it.", foot: "Dates · Authorship · More", cta: "Read the views" },
    { art: "canon", tone: "revelation", icon: "check", eyebrow: "The canon", title: "How they were received", text: "Witness by witness, when each letter was used, doubted and accepted.", foot: "From Clement to the councils", cta: "See the witnesses" },
  ] },
].map((g) => ({ ...g, cards: g.cards.map((c, i) => ({ ...c, page: c.page ?? `${g.id}-${i + 1}`, href: `#/paul/${c.page ?? `${g.id}-${i + 1}`}` })) }));

/** Which group and card a Paul page address names. */
function paulCard(page) {
  for (const g of PAUL_GROUPS_OF_CARDS()) { const i = g.cards.findIndex((c) => c.page === page); if (i >= 0) return { g, i, c: g.cards[i] }; }
  return null;
}

// Journeys and destinations
const JOURNEY_TONES = { "journey-1": "epistles", "journey-2": "prophets", "journey-3": "poetry", "voyage-rome": "revelation" };
/** Stop names that fit: near the right edge a name sits left of its dot; a name that would overlap one already placed is
 * left off (its dot stays, and the line under the map lists every stop). */
function placeLabels(points, k, rightEdge) {
  const placed = [];
  for (const [raw, x, y] of points) {
    const name = raw.replace(/ \(.*\)/, ""), width = name.length * 5.6 * k, end = x > rightEdge;
    const box = end ? [x - width - 6 * k, x] : [x, x + width + 6 * k];
    if (placed.some((p) => box[0] < p.box[1] && p.box[0] < box[1] && Math.abs(p.y - y) < 12 * k)) continue;
    placed.push({ name, x, y, end, box });
  }
  return placed;
}
function journeysBody() {
  const routes = Object.entries(P.maps).filter(([, m]) => m.route), dest = P.maps["letter-destinations"];
  const all = [...routes.flatMap(([, m]) => m.pts), ...dest.pts];
  const xs = all.map((p) => p[1]), ys = all.map((p) => p[2]), pad = 14;
  let [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  const w = x1 - x0, h = Math.max(y1 - y0, w / 2.1); y0 -= (h - (y1 - y0)) / 2; y1 = y0 + h;
  const k = w / 1000;
  const chosen = P.maps[paulState.journey], tone = JOURNEY_TONES[paulState.journey];
  const seen = new Set(), labels = chosen.pts.filter(([n]) => !seen.has(n) && seen.add(n));
  const stops = chosen.pts.map((p) => p[0]).filter((n, i, a) => n !== a[i - 1]);
  return `<div class="panel">
    <div class="chips-row">${routes.map(([id, m]) => `<button type="button" class="chip" style="--tone: var(--${JOURNEY_TONES[id]})" data-act="journey" data-arg="${id}" aria-pressed="${id === paulState.journey}">${m.title} <span class="chip-sub">AD ${m.years[0]}–${m.years[1]}</span></button>`).join("")}
      <button type="button" class="chip" style="--tone: var(--acts)" data-act="destinations" aria-pressed="${paulState.destinations}">○ Where the letters went</button></div>
    <svg class="chart map" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="Paul's journeys">
      <path d="${P.land}" fill="color-mix(in srgb, var(--epistles) 9%, var(--surface))" stroke="var(--line)" stroke-width="${1.8 * k}"/>
      ${routes.map(([id, m]) => `<polyline points="${m.pts.map((p) => `${p[1]},${p[2]}`).join(" ")}" fill="none" stroke="var(--${JOURNEY_TONES[id]})" stroke-width="${(id === paulState.journey ? 2.6 : 1.4) * k}"
        stroke-dasharray="${id === paulState.journey ? "none" : `${5 * k} ${4 * k}`}" stroke-linejoin="round" opacity="${id === paulState.journey ? 1 : .3}"/>`).join("")}
      ${paulState.destinations ? dest.pts.map((p) => `<circle cx="${p[1]}" cy="${p[2]}" r="${7 * k}" fill="none" stroke="var(--acts)" stroke-width="${1.4 * k}"/>`).join("") : ""}
      ${labels.map(([, x, y]) => `<circle cx="${x}" cy="${y}" r="${3.4 * k}" fill="var(--${tone})" stroke="var(--surface)" stroke-width="${1.2 * k}"/>`).join("")}
      ${placeLabels(labels, k, x1 - w * 0.2).map(({ name, x, y, end }) => `<text x="${end ? x - 6 * k : x + 6 * k}" y="${y + 3 * k}" text-anchor="${end ? "end" : "start"}"
        style="font: ${10.5 * k}px var(--sans); fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: ${3 * k}px">${name}</text>`).join("")}
    </svg>
    <p class="tip"><b style="color:var(--ink)">${chosen.title}</b> · AD ${chosen.years[0]}–${chosen.years[1]} · ${labels.length} places<br><span class="route-line">${stops.join(" → ")}</span></p>
    <p class="caption">Each journey follows Acts, stop by stop; the rings are the places Paul's letters were sent. Places from OpenBible.info (CC BY); land outline from Natural Earth.</p>
  </div>`;
}

// Romans at a glance
const FACTS = [["author", "Who wrote it"], ["recipients", "To whom"], ["writtenFrom", "From where"], ["date", "When"], ["occasion", "Why"]];
/** The chosen letter's data (all thirteen are in paul-data.js). */
const chosenLetter = () => P.letters.find((l) => l.name === paulState.letter) ?? P.letters[0];
function glanceBody() {
  const r = chosenLetter(), v = r.keyVerses[Math.min(paulState.verse, r.keyVerses.length - 1)];
  return `<dl class="figures">
      <div><dt>Verses</dt><dd>${r.verses}</dd></div><div><dt>Greek words</dt><dd>${r.greekWords.toLocaleString("en-US")}</dd></div>
      <div><dt>Key verses</dt><dd>${r.keyVerses.length}</dd></div><div><dt>Themes</dt><dd>${r.themes.length}</dd></div>
    </dl>
    <div class="glance-grid">
      <div class="panel"><p class="panel-label">The letter</p>
        <div class="tabs">${FACTS.map(([id, label]) => `<button type="button" class="tab" data-act="fact" data-arg="${id}" aria-pressed="${id === paulState.fact}">${label}</button>`).join("")}</div>
        <p class="fact">${r.facts[paulState.fact]}</p></div>
      <div class="panel"><p class="panel-label">Key verses</p>
        <div class="verse-list">${r.keyVerses.map((k, i) => `<button type="button" class="tab" data-act="verse" data-arg="${i}" aria-pressed="${k === v}">${k.ref.replace(`${r.name} `, "")}</button>`).join("")}</div>
        <blockquote class="quote">“${v.text}”<cite>${v.ref} · KJV</cite></blockquote>
        <p class="fact" style="margin-top:.6rem">${v.why}</p></div>
    </div>
    <div class="panel" style="margin-top:1rem"><p class="panel-label">Themes</p><ol class="themes">${r.themes.map((t) => `<li>${t}</li>`).join("")}</ol></div>`;
}

// Ephesians and Colossians
const KINDS = { greeting: ["Greetings", "epistles"], "christ-church": ["Christ and the church", "gospels"], "new-life": ["The new life", "poetry"], household: ["The household", "acts"], tychicus: ["Tychicus sent", "history"] };
function ephcolBody() {
  const E = P.ephcol, W = 1000, PAD = 30, TOP = 58, BOTTOM = 232, H = 290;
  const axis = (chapters) => { const starts = []; let t = 0; chapters.forEach((n) => { starts.push(t); t += n; }); return { at: ([c, v]) => PAD + ((starts[c - 1] + v - 1) / t) * (W - 2 * PAD), starts, total: t }; };
  const top = axis(E.eph), bottom = axis(E.col);
  if (paulState.pair === undefined) paulState.pair = E.pairs.findIndex((p) => p.kind === "household"); // open on the household code
  const seg = (ax, [a, b]) => { const x0 = ax.at(a), x1 = ax.at(b) + 3, w = Math.max(8, x1 - x0), l = (x0 + x1) / 2 - w / 2; return [l, l + w]; };
  const ticks = (ax, y, below) => ax.starts.map((s, i) => { const x = PAD + (s / ax.total) * (W - 2 * PAD); return `<path d="M${x} ${y - 9}V${y + 15}" stroke="var(--line)"/><text x="${x + 4}" y="${below ? y + 26 : y - 12}" style="font: 11px var(--sans); fill: var(--muted)">ch. ${i + 1}</text>`; }).join("");
  const shown = E.pairs.map((p, i) => ({ p, i })).filter(({ p }) => paulState.kind === "all" || p.kind === paulState.kind);
  const ribbons = shown.map(({ p, i }) => {
    const [a0, a1] = seg(top, p.l), [b0, b1] = seg(bottom, p.r), mid = (TOP + BOTTOM) / 2, on = i === paulState.pair, tone = KINDS[p.kind][1];
    return `<path d="M${a0},${TOP} L${a1},${TOP} C${a1},${mid} ${b1},${mid} ${b1},${BOTTOM} L${b0},${BOTTOM} C${b0},${mid} ${a0},${mid} ${a0},${TOP} Z" fill="var(--${tone})"
      opacity="${on ? .85 : .26}" style="cursor:pointer" data-act="pair" data-arg="${i}"/>
      <rect x="${a0}" y="${TOP - 6}" width="${a1 - a0}" height="6" rx="2" fill="var(--${tone})"/><rect x="${b0}" y="${BOTTOM}" width="${b1 - b0}" height="6" rx="2" fill="var(--${tone})"/>`;
  }).join("");
  const pair = paulState.pair != null ? E.pairs[paulState.pair] : null;
  const counts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, E.pairs.filter((p) => p.kind === k).length]));
  return `<div class="panel">
    <div class="chips-row"><button type="button" class="chip" style="--tone: var(--ink)" data-act="kind" data-arg="all" aria-pressed="${paulState.kind === "all"}">All · ${E.pairs.length}</button>
      ${Object.entries(KINDS).map(([k, [name, tone]]) => `<button type="button" class="chip" style="--tone: var(--${tone})" data-act="kind" data-arg="${k}" aria-pressed="${paulState.kind === k}">${name} · ${counts[k]}</button>`).join("")}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ephesians and Colossians, passage against passage">
      <text x="${PAD}" y="20" style="font: 600 13px var(--sans); fill: var(--ink)">Ephesians · 155 verses</text>
      <text x="${PAD}" y="${H - 6}" style="font: 600 13px var(--sans); fill: var(--ink)">Colossians · 95 verses</text>
      <rect x="${PAD}" y="${TOP - 6}" width="${W - 2 * PAD}" height="6" rx="3" fill="var(--line)"/><rect x="${PAD}" y="${BOTTOM}" width="${W - 2 * PAD}" height="6" rx="3" fill="var(--line)"/>
      ${ticks(top, TOP - 3, false)}${ticks(bottom, BOTTOM + 3, true)}${ribbons}
    </svg>
    ${pair ? `<p class="tip"><b style="color:var(--ink)">${pair.left}</b> with <b style="color:var(--ink)">${pair.right}</b><button type="button" class="keep-x" data-act="pair" data-arg="" aria-label="Let go">✕</button>
      · ${KINDS[pair.kind][0]}${KINDS[pair.kind][0].startsWith(pair.note) ? "" : ` · ${pair.note}`} · ${pair.weight} shared words</p>
      <div class="pair-text"><blockquote class="quote">${pair.lt}<cite>${pair.left} · KJV</cite></blockquote><blockquote class="quote">${pair.rt}<cite>${pair.right} · KJV</cite></blockquote></div>`
    : `<p class="tip">Point at a ribbon to read both passages; click to keep it.</p>`}
    <p class="caption">${E.claim}</p>
  </div>`;
}

/** The body of any Paul card page: the three built charts, or the way to the chart on today's page. */
function paulCardBody(c) {
  if (c.page === "journeys") return journeysBody();
  if (c.page === "romans") { paulState.letter = "Romans"; return glanceBody(); }
  if (c.page === "ephesians-colossians") return ephcolBody();
  return chartLink(c, `${LIVE}#paul-letters`);
}
const PAUL_KICKERS = { journeys: "On the map · Acts 13–28", romans: "Inside Romans · at a glance", "ephesians-colossians": "Twin letters · Ephesians and Colossians" };
const PAUL_LEADS = { journeys: "Choose a journey to follow it; the rings mark where his letters went.", romans: "The letter in one view: choose a question about it, or a key verse to read it.",
  "ephesians-colossians": "Thirty-one passages that run in parallel. Choose a ribbon to read both side by side." };

ROUTES.push([/^$/, hub]);
