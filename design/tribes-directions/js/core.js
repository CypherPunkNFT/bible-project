// Shared helpers: the data (data/tribes.json, read only), the map geometry (map/canaan.json), verse references,
// evidence labels, "data pending" placeholders, tribe colours and expand-in-place. Nothing here holds a fact.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.T = null; // the tribes data
  window.G = null; // the map geometry and the book table

  window.loadData = async () => {
    const [g, t] = await Promise.all([
      fetch("map/canaan.json").then((r) => { if (!r.ok) throw new Error(`map/canaan.json: expected 200, got ${r.status}`); return r.json(); }),
      fetch(`data/tribes.json?v=${Date.now()}`).then((r) => (r.ok ? r.json() : null)).catch((error) => { console.warn("tribes.json not readable yet", error); return null; }),
    ]);
    G = g;
    T = t ?? { tribes: [], lists: [], pending: true };
    T.tribes = (T.tribes ?? []).slice();
    T.byId = Object.fromEntries(T.tribes.map((x) => [x.id, x]));
    return T;
  };

  // The tribe ids the pages expect, in Genesis 49's order of the twelve sons plus Joseph's two sons. Used only
  // to place a placeholder when the data has not arrived; the data's own order is used wherever it exists.
  const SLOTS = ["reuben", "simeon", "levi", "judah", "zebulun", "issachar", "dan", "gad", "asher", "naphtali", "joseph", "benjamin", "ephraim", "manasseh"];
  window.tribeList = () => (T.tribes.length ? T.tribes : SLOTS.map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1), pendingOnly: true })));
  window.tribeOf = (id) => T.byId[id] ?? tribeList().find((x) => x.id === id) ?? null;
  window.tribeName = (id) => tribeOf(id)?.name ?? id;

  // Colours are a reading aid only (no tribe colour is given in Scripture).
  const KEY = (id) => String(id ?? "").toLowerCase().replace(/[^a-z]/g, "");
  window.tone = (id) => `var(--t-${SLOTS.includes(KEY(id)) ? KEY(id) : "other"})`;

  // ── Verse references (span = [first, last], id = book × 1,000,000 + chapter × 1,000 + verse) ──
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  const asSpan = (r) => (Array.isArray(r) ? r : typeof r === "number" ? [r, r] : null);
  window.refText = (r) => {
    const s = asSpan(r);
    if (!s) return "";
    const [a, b = a] = s, x = parts(a), y = parts(b), name = G.books[x.book]?.name ?? "?";
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${G.books[y.book]?.name} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.refShort = (r) => refText(r).replace(/^(\d )?(\w{3})\w*/, (m, n, w) => `${n ?? ""}${w}`);
  window.refHref = (r) => { const s = asSpan(r); if (!s) return "#"; const x = parts(s[0]); return `/read/kjv/${G.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r, cls = "") => (asSpan(r) ? `<a class="ref ${cls}" href="${refHref(r)}">${esc(refText(r))}</a>` : "");
  // Any of span / spans / refs on an item, as links.
  window.spansOf = (o) => (!o ? [] : [...(o.span ? [o.span] : []), ...(o.spans ?? []), ...(o.refs ?? [])]);
  // Citations from data.sources, by id: author (year), linked to the source.
  window.cites = (ids = []) => (ids ?? []).map((id) => { const c = (T.sources ?? []).find((x) => x.id === id); return c ? `<a class="cite" href="${esc(c.url ?? "#")}" target="_blank" rel="noreferrer" title="${esc(c.title ?? "")}">${esc(c.author)} (${esc(c.year)})</a>` : ""; }).filter(Boolean).join('<span class="ref-sep">·</span>');
  window.refList = (list = []) => list.map((r) => refLink(r)).filter(Boolean).join('<span class="ref-sep">·</span>');
  window.personHref = (id) => `/study/people/${encodeURIComponent(id)}`;
  window.placeHref = (id) => `/study/atlas/map?place=${encodeURIComponent(id)}`;

  const LAYER = { scripture: "Scripture", text: "From the text", tradition: "Later tradition", scholars: "Scholars' view", data: "Our data", ours: "Our arithmetic", "early-church": "Early church", "ancient-record": "Outside the Bible" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;

  // "data pending": shown wherever a field of the data contract has not arrived yet. Never filled by hand.
  window.pend = (what = "") => `<span class="pending" title="This field of data/tribes.json has not been written yet">${icon("hourglass", 13)}data pending${what ? ` · ${esc(what)}` : ""}</span>`;
  window.has = (v) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== "";

  // A quotation with its span.
  window.quote = (q, cls = "") => (q?.text ? `<blockquote class="q ${cls}"><p>${esc(q.text)}</p><footer>${refLink(q.span ?? q.ref)} · KJV</footer></blockquote>` : "");
  // A generic claim item (story, fate, nt, tradition): its words, its label, its verses or its holders.
  window.item = (it, cls = "") => {
    if (!it) return "";
    if (typeof it === "string") return `<div class="claim ${cls}"><p>${esc(it)}</p></div>`;
    const title = it.label ?? it.title ?? it.event ?? "";
    const holders = it.who || it.holders ? `<span class="claim-who">${esc(it.who ?? [].concat(it.holders).join(", "))}${it.when ? `, ${esc(it.when)}` : ""}</span>` : "";
    const q = it.quote ? quote(it.quote, "q-inline") : "";
    return `<div class="claim ${cls}" data-layer="${esc(it.layer ?? "")}">${title ? `<b class="claim-theme">${esc(title)}</b>` : ""}${it.text ? `<p>${esc(it.text)}</p>` : ""}${q}
      <footer>${it.layer ? chip(it.layer) : ""}${holders}<span class="refs">${[refList(spansOf(it)), cites(it.cites)].filter(Boolean).join('<span class="ref-sep">·</span>')}</span></footer></div>`;
  };

  // Our own arithmetic, always labelled.
  window.fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-GB") : "");
  window.change = (a, b) => (typeof a === "number" && typeof b === "number" ? b - a : null);
  window.signed = (d) => (d === null ? "" : `${d > 0 ? "+" : d < 0 ? "−" : "±"}${fmt(Math.abs(d))}`);

  // Expand in place: any [data-xp] button toggles its nearest .xp (grid-row transition, no fade).
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-xp]");
    if (!b) return;
    const box = b.closest(".xp");
    if (!box) return;
    const open = !box.classList.contains("is-open");
    box.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", String(open));
    const label = b.querySelector(".xp-label");
    if (label && b.dataset.open && b.dataset.closed) label.textContent = open ? b.dataset.open : b.dataset.closed;
  });
  window.expander = (body, { open = false, cls = "", closed = "Show the detail", opened = "Show less" } = {}) =>
    `<div class="xp ${cls} ${open ? "is-open" : ""}"><button type="button" class="xp-more" data-xp aria-expanded="${open}" data-open="${opened}" data-closed="${closed}"><span class="xp-label">${open ? opened : closed}</span>${icon("chevronDown", 15)}</button>
      <div class="xp-body"><div class="xp-inner">${body}</div></div></div>`;

  window.easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span01 = (p, a, b) => clamp01((p - a) / (b - a));
})();
