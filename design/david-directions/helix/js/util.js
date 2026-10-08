// Shared helpers: data access, verse references, evidence labels, claims and quotations.
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
window.esc = esc; // the ticker (clock.js) uses it

export const D = { data: null };
export async function loadData() {
  const res = await fetch("data/david.json");
  if (!res.ok) throw new Error(`data/david.json: expected 200, got ${res.status}`);
  D.data = await res.json();
  D.data.crystalById = Object.fromEntries(D.data.crystals.map((c) => [c.id, c]));
  D.data.rungById = Object.fromEntries(D.data.rungs.map((r) => [r.id, r]));
  return D.data;
}

// The crystal kinds: this mock-up's grouping of the events, each with its own colour, shape and icon.
export const KINDS = [
  { id: "anointing", label: "Anointing", icon: "oil", shape: "Long bipyramid" },
  { id: "battle", label: "Battle", icon: "swords", shape: "Spike" },
  { id: "building", label: "Building", icon: "hammer", shape: "Cube" },
  { id: "worship", label: "Worship", icon: "harp", shape: "Twenty faces" },
  { id: "family", label: "Family", icon: "home", shape: "Twelve faces" },
  { id: "sin", label: "Sin and judgment", icon: "bolt", shape: "Dark shard" },
  { id: "word", label: "The LORD's word", icon: "scrollWord", shape: "Star" },
  { id: "court", label: "Court and allies", icon: "landmark", shape: "Hex prism" },
];
export const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k]));
export const kindVar = (id) => `var(--k-${id})`;

const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
const bookName = (n) => D.data.books[n]?.name ?? "?";
export function refText([a, b = a]) {
  const x = parts(a), y = parts(b);
  if (a === b) return `${bookName(x.book)} ${x.ch}:${x.v}`;
  if (x.book !== y.book) return `${bookName(x.book)} ${x.ch}:${x.v} – ${bookName(y.book)} ${y.ch}:${y.v}`;
  return x.ch === y.ch ? `${bookName(x.book)} ${x.ch}:${x.v}–${y.v}` : `${bookName(x.book)} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
}
export const refHref = ([a]) => { const x = parts(a); return `/read/kjv/${D.data.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
export const chapterHref = (book, ch) => `/read/kjv/${D.data.books[book]?.code}/${ch}`;
export const chapterText = (book, ch) => `${bookName(book)} ${ch}`;
export const refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
export const refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');

const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view", story: "Written by this site from Scripture" };
export const chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
export const citation = (id) => D.data.citations.find((c) => c.id === id);
export const citeShort = (id) => { const c = citation(id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
export const cites = (ids = []) => ids.map((id) => `<a class="cite" href="#source-${esc(id)}" data-source="${esc(id)}">${esc(citeShort(id))}</a>`).join('<span class="ref-sep">·</span>');

// A claim: its words, then its evidence label and its verses or citations.
export function claim(c, cls = "") {
  if (!c) return "";
  return `<div class="claim ${cls}"><p>${esc(c.text)}</p>
    <footer>${chip(c.layer ?? "story")}<span class="refs">${refList(c.refs)}${c.refs?.length && c.cites?.length ? '<span class="ref-sep">·</span>' : ""}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
}
export const quote = (q, cls = "") => q ? `<blockquote class="q ${cls}"><p>${esc(q.text)}</p><footer>${refLink(q.span)} · KJV</footer></blockquote>` : "";
export const kjv = (v, cls = "") => v ? `<blockquote class="kjv ${cls}"><p>${esc(v.text)}</p><footer><span>${esc(refText(v.ref))} · KJV</span><a class="read" href="${refHref(v.ref)}">${window.icon("open", 14)}Read the passage</a></footer></blockquote>` : "";

export const clamp01 = (t) => Math.max(0, Math.min(1, t));
export const span = (p, a, b) => clamp01((p - a) / (b - a));
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t) => { const c = 1.9; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const smooth = (t) => t * t * (3 - 2 * t);

// "37.5" -> "37½"
export const yearText = (y) => (Math.abs(y - Math.round(y)) < 0.01 ? String(Math.round(y)) : Math.abs(y % 1 - 0.5) < 0.01 ? `${Math.floor(y)}½` : y.toFixed(1));
export const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
