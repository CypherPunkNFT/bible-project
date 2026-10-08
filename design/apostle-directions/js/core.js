// Shared helpers: loading an apostle (data/<id>.json, built from the site's reviewed files), verse references, evidence
// labels, claims, and the one ordered list of events that the four directions each draw in their own way.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.WHO = { peter: "peter-mat-4-18", paul: "paul-act-7-58", thaddaeus: "judas-mat-10-3" };
  window.WHO_LABEL = { peter: "Peter", paul: "Paul", thaddaeus: "Thaddaeus" };
  window.P = null;
  let BOOKS = null; window.HARMONY = null;
  const cache = new Map();
  const getJson = async (path) => {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path}: expected 200, got ${res.status}`);
    return res.json();
  };
  window.loadShared = async () => {
    if (BOOKS) return;
    const [books, harmony] = await Promise.all([getJson("data/books.json"), getJson("data/harmony.json")]);
    BOOKS = Object.fromEntries(books.map((b) => [b.num, b]));
    HARMONY = harmony;
  };
  window.loadPerson = async (key) => {
    if (!cache.has(key)) cache.set(key, getJson(`data/${WHO[key]}.json`).then(prepare));
    return cache.get(key);
  };
  window.whoFromUrl = () => {
    const raw = new URLSearchParams(location.search).get("who") ?? "peter";
    return Object.keys(WHO).find((k) => k === raw || WHO[k] === raw) ?? "peter";
  };

  // ── References ── 40016018 -> { book: 40, ch: 16, v: 18 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.bookName = (num) => BOOKS[num]?.name ?? "?";
  window.refText = ([a, b = a]) => {
    const x = parts(a), y = parts(b), name = bookName(x.book);
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${bookName(y.book)} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.verseText = (id) => refText([id, id]);
  window.refHref = ([a]) => { const x = parts(a); return `/read/kjv/${BOOKS[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');
  window.bookOf = (id) => Math.floor(id / 1e6);
  window.overlaps = (a, b) => a[0] <= (b[1] ?? b[0]) && b[0] <= (a[1] ?? a[0]);
  window.CODE_NAME = { MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", "1CO": "1 Corinthians" };

  // ── Evidence labels ──
  window.LAYER = { scripture: "Scripture", text: "From the text", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view", story: "Written by this site from Scripture" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  const citation = (id) => P.citations.find((c) => c.id === id);
  window.citeShort = (id) => { const c = citation(id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  window.cites = (ids = []) => ids.map((id) => `<a class="cite" href="${esc(citation(id)?.url ?? "#")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`).join('<span class="ref-sep">·</span>');
  // A claim's footer: evidence label, who said it and when, verses and citations.
  window.claimFoot = (c) => `<div class="claim-foot">${chip(c.layer ?? "story")}${c.who ? `<span class="claim-who">${esc(c.who)}${c.when ? `, ${esc(c.when)}` : ""}</span>` : ""}${c.refs?.length ? `<span>${refList(c.refs)}</span>` : ""}${c.cites?.length ? `<span>${cites(c.cites)}</span>` : ""}</div>`;
  window.claimHTML = (c, cls = "") => c ? `<div class="claim ${cls}" data-layer="${esc(c.layer)}"><p>${esc(c.text)}</p>${claimFoot(c)}</div>` : "";

  // A year from a "when" note: "about AD 95–96" -> 95, "early 2nd century" -> 110, "first half of the 3rd century" -> 225.
  // The earliest dating phrase in the note wins ("Dionysius about AD 170; Eusebius about AD 325" -> 170).
  window.yearOf = (when = "") => {
    const found = [];
    const ad = when.match(/(?:AD|about)\s*(\d{2,4})/i);
    if (ad) found.push([ad.index, Number(ad[1])]);
    const c = when.match(/(early|late|first half of the|second half of the|latter half of the)?\s*(\d)(?:st|nd|rd|th) century/i);
    if (c) { const base = (Number(c[2]) - 1) * 100; const w = (c[1] ?? "").toLowerCase(); found.push([c.index, base + (w.startsWith("early") || w.startsWith("first") ? 20 : w.startsWith("late") || w.startsWith("second") || w.startsWith("latter") ? 75 : 50)]); }
    if (!found.length) { const bare = when.match(/\b(\d{3,4})\b/); if (bare && !/not established/.test(when)) found.push([bare.index, Number(bare[1])]); }
    found.sort((a, b) => a[0] - b[0]);
    return found.length ? found[0][1] : null;
  };
  // How a date is shown: an explicit year as given ("AD 170"), a century as a century ("2nd c."), never a made-up year.
  window.yearBadge = (when = "") => {
    const ad = when.match(/(?:AD|about)\s*(\d{2,4})/i), c = when.match(/(\d)(st|nd|rd|th) century/i);
    if (c && (!ad || c.index < ad.index)) return { big: `${c[1]}${c[2]} c.`, small: (when.slice(0, c.index + 1).match(/early|first half|latter half|second half|late/i)?.[0] ?? "").toLowerCase() };
    if (ad) return { big: ad[1], small: /not later than/i.test(when.slice(0, ad.index + 8)) ? "by AD" : Number(ad[1]) < 1000 ? "AD" : "" };
    return { big: "?", small: "undated" };
  };
  window.eraLabel = (y) => (y == null ? "date unknown" : y < 1000 ? `AD ${y}` : `${y}`);

  // ── The lanes (the staves of The score) and where a reference falls ──
  window.LANES = [
    { id: "MAT", name: "Matthew", short: "Mt", color: "var(--lane-mat)" },
    { id: "MRK", name: "Mark", short: "Mk", color: "var(--lane-mrk)" },
    { id: "LUK", name: "Luke", short: "Lk", color: "var(--lane-luk)" },
    { id: "JHN", name: "John", short: "Jn", color: "var(--lane-jhn)" },
    { id: "ACT", name: "Acts", short: "Ac", color: "var(--lane-act)" },
    { id: "EP", name: "The letters", short: "Ep", color: "var(--lane-ep)" },
    { id: "TR", name: "After Scripture", short: "Tr", color: "var(--lane-tr)" },
  ];
  window.laneOfRef = (r) => { const b = bookOf(r[0]); return b === 40 ? "MAT" : b === 41 ? "MRK" : b === 42 ? "LUK" : b === 43 ? "JHN" : b === 44 ? "ACT" : b >= 45 ? "EP" : null; };

  // ── One ordered list of events: moments (the Gospels' harmony order), Acts, the letters, how Scripture ends, then
  // tradition by date. Each event knows its lanes (books), its words (from the thread) and its evidence. ──
  function buildEvents(p) {
    const ev = [];
    const firstActs = (refs) => refs.filter((r) => bookOf(r[0]) === 44).map((r) => r[0]).sort((a, b) => a - b)[0];
    p.moments.forEach((m, i) => {
      const acts = firstActs(m.refs);
      const movement = m.h ? "gospels" : acts ? "acts" : "letters";
      ev.push({ key: `m${i}`, kind: "moment", movement, idx: i, label: m.label, refs: m.refs, layer: "scripture", sort: m.h ? m.h.ord : acts ?? m.refs[0][0], h: m.h, src: m });
    });
    p.acts.forEach((c, i) => {
      const acts = firstActs(c.refs ?? []);
      ev.push({ key: `a${i}`, kind: "acts", movement: acts ? "acts" : "letters", idx: i, label: c.text, refs: c.refs ?? [], layer: c.layer, sort: acts ?? (c.refs?.[0]?.[0] ?? 0), src: c });
    });
    p.ending.scripture.forEach((c, i) => ev.push({ key: `e${i}`, kind: "ending", movement: "fine", idx: i, label: c.text, refs: c.refs ?? [], layer: c.layer, sort: i, src: c }));
    p.ending.tradition.forEach((c, i) => ev.push({ key: `t${i}`, kind: "tradition", movement: "coda", idx: i, label: c.text, refs: [], layer: c.layer, sort: (yearOf(c.when) ?? 9999) + i / 100, year: yearOf(c.when), src: c }));
    const ORDER = ["gospels", "acts", "letters", "fine", "coda"];
    ev.sort((a, b) => ORDER.indexOf(a.movement) - ORDER.indexOf(b.movement) || a.sort - b.sort);
    ev.forEach((e, i) => {
      e.i = i;
      e.lanes = e.kind === "tradition" ? ["TR"] : [...new Set(e.refs.map(laneOfRef).filter(Boolean))];
      e.thread = p.threadByKey[e.key] ?? null;
      e.callings = e.kind === "moment" ? p.calling.filter((c) => e.refs.some((r) => overlaps(r, c.quote.span))) : [];
    });
    return ev;
  }
  window.MOVEMENTS = {
    gospels: { name: "The Gospels", roman: "I" }, acts: { name: "Acts", roman: "II" }, letters: { name: "The letters", roman: "III" },
    fine: { name: "Fine: how Scripture ends", roman: "Fine" }, coda: { name: "Coda: after Scripture", roman: "Coda" },
  };

  function prepare(p) {
    p.threadByKey = {};
    p.thread.forEach((g) => g.items.forEach((it) => { it.group = g.id; p.threadByKey[it.key] = it; }));
    p.events = buildEvents(p);
    p.first = p.name.split(" ")[0];
    p.initial = p.first[0];
    return p;
  }

  // Thread lines as a compact dialogue (used by The score and The globe): speaker, words, verse.
  window.speaker = (line) => line.who === "j" ? "Jesus" : line.who === "s" ? (line.name ?? P.first) : line.who === "n" ? "" : line.name;
  window.dialogue = (lines, cls = "") => `<ol class="dlg ${cls}">${lines.map((l) => `<li data-who="${l.who}">${l.who === "n" ? "" : `<b>${esc(speaker(l))}</b>`}<q class="${l.who === "n" ? "is-narration" : ""}">${esc(l.t)}</q><a class="dlg-ref" href="${refHref([l.v])}">${esc(verseText(l.v))}</a></li>`).join("")}</ol>`;
  window.tabLabel = (t) => t.label ?? CODE_NAME[t.book] ?? t.book;

  // Links out, as the live pages make them (src/components/people-pages/links.ts).
  const LETTER_SLUG = { "paul-letters": "paul", hebrews: "hebrews", "general-letters": "james-peter-and-jude", "john-letters": "the-letters-of-john" };
  window.writingHref = (w) => (w.letters ? `/study/letters/${LETTER_SLUG[w.letters]}` : w.book ? `/read/kjv/${w.book}/1` : "#");
  window.personHref = (id) => (id ? `/people/${id}` : "#");
  // Citations as a list (the sources every direction ends with).
  window.sourceList = (cls = "src-list") => `<ol class="${cls}">${P.citations.map((c) => `<li><b>${esc(c.author)}</b>, <a href="${esc(c.url ?? "#")}" target="_blank" rel="noreferrer"><i>${esc(c.title)}</i></a> (${esc(c.year)})${c.where ? `<span>. ${esc(c.where)}</span>` : ""}</li>`).join("")}</ol>`;
  // When Scripture tells little (Thaddaeus), every direction says so plainly.
  window.isScarce = () => P.moments.length < 5;

  window.easeInOut =(t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span01 = (p, a, b) => clamp01((p - a) / (b - a));
  window.isNarrow = () => matchMedia("(max-width: 720px)").matches;
})();
