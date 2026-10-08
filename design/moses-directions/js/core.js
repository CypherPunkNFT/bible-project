// Shared helpers: the data (data/moses.json), verse references, evidence labels, claims, quotes and expand-in-place.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.M = null;
  window.loadMoses = async () => {
    const res = await fetch("data/moses.json");
    if (!res.ok) throw new Error(`moses.json: expected 200, got ${res.status}`);
    M = await res.json();
    M.sceneById = Object.fromEntries(M.scenes.map((s) => [s.id, s]));
    return M;
  };

  // 2003001 -> { book: 2, ch: 3, v: 1 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.refText = ([a, b = a]) => {
    const x = parts(a), y = parts(b), name = M.books[x.book]?.name ?? "?";
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${M.books[y.book]?.name} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.refHref = ([a]) => { const x = parts(a); return `/read/kjv/${M.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');

  const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  window.citeShort = (id) => { const c = M.citations.find((x) => x.id === id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  window.cites = (ids = []) => ids.map((id) => { const c = M.citations.find((x) => x.id === id); return `<a class="cite" href="${esc(c?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`; }).join('<span class="ref-sep">·</span>');

  // A claim: its words, then its evidence label and verses (or citations). Plain story paragraphs have no layer.
  window.claim = (c, cls = "") => {
    if (!c) return "";
    const theme = c.theme ? `<b class="claim-theme">${esc(c.theme)}</b>` : "";
    const qs = (c.quotes ?? []).map((q) => quoteSpan(q, "q-inline")).join("");
    const who = c.who ? `<span class="claim-who">${esc(c.who)}${c.when ? `, ${esc(c.when)}` : ""}</span>` : "";
    return `<div class="claim ${cls}" data-layer="${esc(c.layer ?? "story")}">${theme}<p>${esc(c.text)}</p>${qs}
      <footer>${c.layer ? chip(c.layer) : '<span class="layer" data-layer="story">Written by this site from Scripture</span>'}${who}<span class="refs">${refList(c.refs)}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A quotation stored with its span ({ text, span }).
  window.quoteSpan = (q, cls = "") => q ? `<blockquote class="q ${cls}"><p>${esc(q.text)}</p><footer>${refLink(q.span)} · KJV</footer></blockquote>` : "";
  // A KJV verse pulled from the text files ({ ref, text }), with "read the passage".
  window.kjv = (v, cls = "") => v ? `<blockquote class="kjv ${cls}"><p>${esc(v.text)}</p><footer><span>${esc(refText(v.ref))} · KJV</span><a class="read" href="${refHref(v.ref)}">${icon("open", 14)}Read the passage</a></footer></blockquote>` : "";

  // Expand in place: any [data-xp] button toggles its nearest .xp (a CSS grid-row transition, no fade of the page).
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
  window.expander = (head, body, { open = false, cls = "", closed = "Show the detail", opened = "Show less" } = {}) =>
    `<div class="xp ${cls} ${open ? "is-open" : ""}">${head ?? `<button type="button" class="xp-more" data-xp aria-expanded="${open}" data-open="${opened}" data-closed="${closed}"><span class="xp-label">${open ? opened : closed}</span>${icon("chevronDown", 15)}</button>`}
      <div class="xp-body"><div class="xp-inner">${body}</div></div></div>`;

  window.actOf = (n) => M.forties[n - 1];
  window.ACT_TONE = { 1: "var(--egypt)", 2: "var(--midian)", 3: "var(--wild)" };
  window.easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span = (p, a, b) => clamp01((p - a) / (b - a)); // where p sits between a and b, 0..1
})();
