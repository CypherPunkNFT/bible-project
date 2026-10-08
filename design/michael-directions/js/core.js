// Shared helpers: the data (data/michael.json), verse references, evidence labels, claims, quotations, views and
// expand-in-place. Every direction draws from these; each lays them out its own way.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.M = null;
  window.loadData = async () => {
    const res = await fetch("data/michael.json");
    if (!res.ok) throw new Error(`michael.json: expected 200, got ${res.status}`);
    M = await res.json();
    // Each book's first chapter as a running total, for the whole-Bible spine.
    let run = 0;
    M.books.forEach((b, i) => { b.i = i; b.start = run; run += b.ch; });
    M.totalCh = run;
    M.bookBy = Object.fromEntries(M.books.map((b) => [b.code, b]));
    M.citeBy = Object.fromEntries(M.citations.map((c) => [c.id, c]));
    return M;
  };

  // A reference is [book code, chapter, first verse, last verse].
  // One-chapter books (Jude) are cited by verse alone: "Jude 9".
  window.refText = ([b, c, v, e = v]) => `${M.bookBy[b]?.name ?? b} ${M.bookBy[b]?.ch === 1 ? "" : `${c}:`}${v}${e !== v ? `–${e}` : ""}`;
  window.refHref = ([b, c, v]) => `/read/kjv/${b}/${c}?v=${v}`;
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');
  // Where a reference sits in the whole Bible, 0..1, by chapter.
  window.biblePos = ([b, c]) => (M.bookBy[b].start + c - 0.5) / M.totalCh;

  const LAYER = { scripture: "Scripture", text: "From the text", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view" };
  window.LAYER = LAYER;
  window.chip = (layer, label) => `<span class="layer" data-layer="${esc(layer)}">${esc(label ?? LAYER[layer] ?? layer)}</span>`;
  // A translation is cited with its translation year: "Origen, tr. 1885" (Origen did not write in 1885).
  window.citeShort = (id) => { const c = M.citeBy[id]; if (!c) return id; const who = c.short ?? c.author.split(",")[0].split(" and ")[0]; return c.author.includes(", tr.") ? `${who}, tr. ${c.year}` : `${who} (${c.year})`; };
  window.citeLink = (id, label) => { const c = M.citeBy[id]; return `<a class="cite" href="${esc(c?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(label ?? citeShort(id))}</a>`; };
  window.cites = (ids = []) => ids.map((id) => citeLink(id)).join('<span class="ref-sep">·</span>');

  // A claim: its words, then its evidence label and verses (or citations).
  window.claim = (c, cls = "") => {
    if (!c) return "";
    const who = c.who ? `<span class="claim-who">${esc(c.who)}${c.when ? `, ${esc(c.when)}` : ""}</span>` : "";
    return `<div class="claim ${cls}" data-layer="${esc(c.layer)}"><p>${esc(c.text)}</p>
      <footer>${chip(c.layer)}${who}<span class="refs">${refList(c.refs)}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A KJV verse ({ ref, text }) with "read the passage".
  window.kjv = (v, cls = "", mark = "") => {
    if (!v) return "";
    const body = mark ? esc(v.text).replace(new RegExp(`(${mark})`, "g"), "<mark>$1</mark>") : esc(v.text);
    return `<blockquote class="kjv ${cls}"><p>${body}</p><footer><span>${esc(refText(v.ref))} · KJV</span><a class="read" href="${refHref(v.ref)}">${icon("open", 14)}Read the passage</a></footer></blockquote>`;
  };
  // Several verses run together as one passage, verse numbers in small type.
  window.passageText = (vs, mark = "Michael") => `<p class="run">${vs.map((v) => `<sup>${v.ref[2]}</sup>${mark ? esc(v.text).replace(new RegExp(`(${mark})`, "g"), "<mark>$1</mark>") : esc(v.text)}`).join(" ")}</p>`;

  // Expand in place: any [data-xp] button toggles its nearest .xp (rows grow; nothing fades).
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

  window.easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span = (p, a, b) => clamp01((p - a) / (b - a)); // where p sits between a and b, 0..1
  window.lerp = (a, b, t) => a + (b - a) * t;
  // A small seeded random, so the drawings are the same on every load.
  window.seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
})();
