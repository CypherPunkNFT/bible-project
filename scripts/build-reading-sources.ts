/** Explicit reading destinations, joined only by exact source URL. */
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { HISTORY_COLLECTIONS } from "../src/pages/places/history-collections.ts";
import type { ReadingSource } from "../src/lib/reading-sources.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const rows: ReadingSource[] = [];
for (const file of (await readdir(path.join(root, "content/apologetics/sources"))).filter(f => f.endsWith(".json"))) {
  const doc = await read("content/apologetics/sources/" + file);
  if (doc.publication !== "published") continue;
  const s = doc.content;
  rows.push({ id: "ap-" + doc.id, title: s.title, author: s.author, role: s.role, note: s.note, url: s.url,
    ...(doc.id === "wcf" ? { basis: "westminster" as const } : /^q\d+$/.test(doc.id) ? { basis: "quran-pickthall" as const } : {}),
    catholic: /catholic/i.test(s.role) });
}
for (const collection of HISTORY_COLLECTIONS) {
  collection.sources.forEach((s, index) => rows.push({ id: `history-${collection.id}-${index}`, title: s.title,
    author: "", role: "Historical source · " + collection.title, note: "A source for this historical collection. Its claims reflect the perspective of its author or institution.",
    url: s.url, catholic: /vatican\.va|papalencyclicals\.net/.test(s.url) }));
}
for (const source of (await read("content/research/phase-2.json")).sources) {
  rows.push({ id: "research-" + source.id, title: source.title, author: source.edition, role: source.sourceRole,
    note: source.description, url: source.url });
}
const normalize = (url: string) => { try { const u = new URL(url); u.hash = ""; return u.href; } catch { return ""; } };
const wanted = new Map(rows.map(s => [normalize(s.url), true]));
const matches = new Map<string, { id: string; title: string; availability: string }>();
for (const file of (await readdir(path.join(root, ".local/teacher-library-unpacked/records"))).sort()) {
  const records = await read(".local/teacher-library-unpacked/records/" + file);
  for (const r of Object.values(records) as { id: string; title: string; availability: string; sourceUrl?: string }[]) {
    const url = normalize(r.sourceUrl ?? "");
    if (!wanted.has(url)) continue;
    const previous = matches.get(url);
    if (!previous || (previous.availability !== "on-site-text" && r.availability === "on-site-text")) {
      matches.set(url, { id: r.id, title: r.title, availability: r.availability });
    }
  }
}
for (const row of rows) row.held = matches.get(normalize(row.url));
await mkdir(path.join(root, "public/content"), { recursive: true });
await writeFile(path.join(root, "public/content/reading-sources.json"), JSON.stringify(rows, null, 2) + "\n");
console.log(JSON.stringify({ sourceRecords: rows.length, localBasis: rows.filter(r => r.basis).length,
  matchedHeld: rows.filter(r => r.held).length, matchedReadable: rows.filter(r => r.held?.availability === "on-site-text").length,
  publicTextPending: rows.filter(r => !r.basis && r.held?.availability !== "on-site-text").length }));
