// Shared helpers: the data (data/david.json), verse references, evidence labels, claims and expand-in-place.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.H = null; // the house data
  window.loadHouse = async () => {
    const res = await fetch("data/david.json");
    if (!res.ok) throw new Error(`david.json: expected 200, got ${res.status}`);
    H = await res.json();
    H.node = Object.fromEntries(H.tree.map((n) => [n.id, n]));
    H.stepById = Object.fromEntries(H.steps.map((s) => [s.id, s]));
    return H;
  };

  // 10003002 -> { book: 10, ch: 3, v: 2 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.refText = ([a, b = a]) => {
    const x = parts(a), y = parts(b), name = H.books[x.book]?.name ?? "?";
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${H.books[y.book]?.name} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.refHref = ([a]) => { const x = parts(a); return `/read/kjv/${H.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');

  const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view", kjv: "Scripture · KJV", note: "How the tree is drawn" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  const citation = (id) => H.citations.find((x) => x.id === id);
  window.citeShort = (id) => { const c = citation(id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  window.cites = (ids = []) => ids.map((id) => `<a class="cite" href="${esc(citation(id)?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`).join('<span class="ref-sep">·</span>');

  // A claim from the data: its words, then its evidence label and verses (or citations).
  window.claim = (c, cls = "") => {
    if (!c) return "";
    return `<div class="claim ${cls}" data-layer="${esc(c.layer ?? "story")}"><p>${esc(c.text)}</p>
      <footer>${c.layer ? chip(c.layer) : '<span class="layer" data-layer="story">Written by this site from Scripture</span>'}<span class="refs">${refList(c.refs)}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A step caption part: KJV words are quoted; claims and notes carry their own label.
  window.captionPart = (p, cls = "") => {
    if (p.kind === "kjv") return `<blockquote class="cap-kjv ${cls}"><p>“${esc(p.text)}”</p><footer>${chip("kjv")}<span class="refs">${refList(p.refs)}</span></footer></blockquote>`;
    if (p.kind === "note") return `<div class="cap-note ${cls}"><p>${esc(p.text)}</p><footer>${chip("note")}<span class="refs">${refList(p.refs)}</span></footer></div>`;
    return `<div class="cap-claim ${cls}"><p>${esc(p.text)}</p><footer>${chip(p.layer)}${p.from ? `<span class="cap-from">from ${esc(p.from)}'s reign</span>` : ""}<span class="refs">${refList(p.refs)}</span></footer></div>`;
  };

  // Expand in place: any [data-xp] button toggles its nearest .xp (a grid-row transition, no fade).
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
  window.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  window.reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
})();
