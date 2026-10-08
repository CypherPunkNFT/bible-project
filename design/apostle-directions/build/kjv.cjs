// KJV verse access for the build: plain text (same rule as src/lib/data.ts plainWords) and red-letter marks.
const fs = require("fs");
const W = require("path").resolve(__dirname, "../../.."); // the Website folder
const catalog = JSON.parse(fs.readFileSync(W + "/data/catalog.json", "utf8"));
const kjvCat = catalog.translations.find((t) => t.slug === "kjv" || t.id === "kjv");
const books = Object.fromEntries(catalog.books.map((b) => [b.num, b]));
const cache = new Map();
function chapterLabels(code) {
  const tb = kjvCat && (kjvCat.books?.[code] || kjvCat.chapters?.[code]);
  if (Array.isArray(tb)) return tb.map(String);
  if (tb && Array.isArray(tb.chapters)) return tb.chapters.map(String);
  return null;
}
function chapter(code, ch) {
  const labels = chapterLabels(code);
  const idx = labels ? labels.indexOf(String(ch)) : ch - 1;
  const file = `${W}/data/text/kjv/${code}/${Math.floor(idx / 5)}.json`;
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  const c = cache.get(file)[String(ch)];
  if (!c) throw new Error(`KJV ${code} ${ch}: not in ${file}`);
  return c;
}
function verse(id) {
  const b = Math.floor(id / 1e6), ch = Math.floor((id % 1e6) / 1e3), v = id % 1e3;
  const code = books[b].code;
  const c = chapter(code, ch);
  const found = c.v.find((x) => Number(x.n) === v);
  if (!found) throw new Error(`KJV ${code} ${ch}:${v} missing`);
  const segs = [];
  for (const run of found.r) {
    const t = typeof run === "string" ? run : Array.isArray(run) ? run[0] : "";
    if (!t) continue;
    const j = Array.isArray(run) && String(run[1] || "").includes("j");
    const last = segs[segs.length - 1];
    if (last && last.j === j) last.t += t; else segs.push({ t, j });
  }
  const text = segs.map((s) => s.t).join("").replace(/\s+/g, " ").trim();
  return { id, text, segs: segs.map((s) => ({ t: s.t.replace(/\s+/g, " "), j: s.j })) };
}
function span([a, b = a]) {
  const out = [];
  const b1 = Math.floor(a / 1e6), c1 = Math.floor((a % 1e6) / 1e3), c2 = Math.floor((b % 1e6) / 1e3);
  for (let ch = c1; ch <= c2; ch++) {
    const c = chapter(books[b1].code, ch);
    for (const x of c.v) { const id = b1 * 1e6 + ch * 1e3 + Number(x.n); if (id >= a && id <= b) out.push(verse(id)); }
  }
  return out;
}
module.exports = { verse, span, books, W };
