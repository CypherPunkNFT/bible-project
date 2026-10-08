// Shared helpers: the data (data/david.json), verse references, evidence labels, claims, quotations, expand-in-place.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.DV = null;
  window.loadDavid = async () => {
    const res = await fetch("data/david.json");
    if (!res.ok) throw new Error(`david.json: expected 200, got ${res.status}`);
    DV = await res.json();
    DV.questionById = Object.fromEntries(DV.questions.map((q) => [q.id, q]));
    return DV;
  };

  // 10005004 -> { book: 10, ch: 5, v: 4 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.refText = (r) => {
    const [a, b = a] = Array.isArray(r) ? r : [r, r];
    const x = parts(a), y = parts(b), name = DV.books[x.book]?.name ?? "?";
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${DV.books[y.book]?.name} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.refHref = (r) => { const x = parts(Array.isArray(r) ? r[0] : r); return `/read/kjv/${DV.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');

  const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  window.citation = (id) => DV.citations.find((x) => x.id === id);
  window.citeShort = (id) => { const c = citation(id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  window.cites = (ids = []) => ids.map((id) => `<a class="cite" href="${esc(citation(id)?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`).join('<span class="ref-sep">·</span>');

  // A claim: its words, then its evidence label and verses (or citations). Story paragraphs carry no label of their own.
  window.claim = (c, cls = "") => {
    if (!c) return "";
    const src = c.src ? `<b class="claim-src">${esc(c.src)}</b>` : "";
    const label = c.layer ? chip(c.layer) : '<span class="layer" data-layer="story">Written by this site from Scripture</span>';
    return `<div class="claim ${cls}" data-layer="${esc(c.layer ?? "story")}">${src}<p>${esc(c.text)}</p>
      <footer>${label}<span class="refs">${refList(c.refs)}${c.refs?.length && c.cites ? '<span class="ref-sep">·</span>' : ""}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A quotation stored with its span ({ text, span }).
  window.quoteSpan = (q, cls = "") => q ? `<blockquote class="q ${cls}"><p>${esc(q.text)}</p><footer>${refLink(q.span)} · KJV</footer></blockquote>` : "";
  // A KJV verse (or several) from the text files, with "read the passage".
  window.kjvText = (ids) => (Array.isArray(ids) ? ids : [ids]).map((id) => DV.verses[id]).join(" ");
  window.kjv = (id, cls = "") => `<blockquote class="kjv ${cls}"><p>${esc(kjvText(id))}</p><footer><span>${esc(refText(id))} · KJV</span><a class="read" href="${refHref(id)}">${icon("open", 14)}Read the passage</a></footer></blockquote>`;

  // Expand in place: any [data-xp] button toggles its nearest .xp (rows grow; nothing fades).
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-xp]");
    if (!b) return;
    const box = b.closest(".xp");
    if (!box) return;
    const open = !box.classList.contains("is-open");
    box.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", String(open));
  });
  window.expander = (label, body, { open = false, cls = "", ico = "chevronDown" } = {}) =>
    `<div class="xp ${cls} ${open ? "is-open" : ""}"><button type="button" class="xp-more" data-xp aria-expanded="${open}">${icon(ico, 16)}<span>${label}</span>${icon("chevronDown", 15)}</button>
      <div class="xp-body"><div class="xp-inner">${body}</div></div></div>`;

  window.easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span = (p, a, b) => clamp01((p - a) / (b - a)); // where p sits between a and b, 0..1
  window.reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
})();
