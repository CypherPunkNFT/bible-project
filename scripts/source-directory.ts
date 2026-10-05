import fs from "node:fs";
import path from "node:path";

// Input registries have different schemas; only the explicitly selected public fields leave this adapter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordData = Record<string, any>;
const read = (file: string): RecordData => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const records = (directory: string) => fs.readdirSync(directory).filter(f => f.endsWith(".json")).sort().map(f => read(path.join(directory, f)));
const publicUrl = (url: unknown): url is string => typeof url === "string" && /^https?:\/\//.test(url);
type Entry = { id: string; title: string; author: string; categories: string[]; kind: string; status: string; role: string; links: { url: string; sourceId: string }[] };

/** Bibliographic metadata only: never export bodies, local paths, permission correspondence or private notes. */
export function buildSourceDirectory(root: string) {
  const base = path.join(root, "content/library");
  const vocabulary = read(path.join(base, "vocabulary.json"));
  const authors = new Map(read(path.join(base, "authors.json")).authors.map((a: RecordData) => [a.id, a.name]));
  const editions = records(path.join(base, "catalog/editions"));
  const assets = records(path.join(base, "catalog/assets"));
  const editionWorks = new Map(editions.map(e => [e.id, e.workId]));
  const links = new Map<string, { url: string; sourceId: string }[]>();
  for (const a of assets) {
    const work = editionWorks.get(a.editionId);
    if (!work || !publicUrl(a.canonicalUrl)) continue;
    const list = links.get(work) ?? [];
    if (!list.some(l => l.url === a.canonicalUrl)) list.push({ url: a.canonicalUrl, sourceId: a.sourceId });
    links.set(work, list);
  }
  const entries: Entry[] = records(path.join(base, "catalog/works")).map(w => ({
    id: w.id, title: w.title,
    author: w.creators.map((c: RecordData) => authors.get(c.authorId)).filter(Boolean).join(" · "),
    categories: w.collections, kind: w.genre.replaceAll("-", " "),
    status: "Catalog record", role: w.role.replaceAll("-", " "),
    links: links.get(w.id) ?? (w.evidence ?? []).filter((e: RecordData) => publicUrl(e.url)).slice(0, 1).map((e: RecordData) => ({ url: e.url, sourceId: "" })),
  }));
  for (const source of records(path.join(root, "content/apologetics/sources"))) {
    if (source.publication !== "published") continue;
    const s = source.content;
    entries.push({ id: `apologetics-${source.id}`, title: s.title, author: s.author, categories: ["apologetics"], kind: s.kind, status: "Study bibliography", role: s.role ?? "Source", links: publicUrl(s.url) ? [{ url: s.url, sourceId: "" }] : [] });
  }
  const seen = new Map(entries.flatMap(e => e.links.map(l => [l.url, e] as const)));
  const workEntries = new Map(entries.map(e => [e.id, e]));
  let supplemental = 0;
  // Acquisition registers extend beyond the formal catalog. List their source destinations separately.
  function visit(value: unknown, categories: string[]) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, categories)); return; }
    const item = value as RecordData;
    const url = item.sourcePage ?? item.canonicalUrl ?? item.url;
    if ((item.assetId || item.asset) && publicUrl(url)) {
      const existing = seen.get(url);
      if (existing) {
        existing.categories = [...new Set([...existing.categories, ...categories.filter(c => c !== "research")])];
      } else {
        const work = workEntries.get(editionWorks.get(item.editionId) ?? "");
        const entry = { id: `acquisition-${supplemental++}`, title: item.title || work?.title || url, author: item.author || work?.author || "", categories, kind: "Source destination", status: "Acquisition register", role: "Bibliographic link; text availability and review vary", links: [{ url, sourceId: "" }] };
        seen.set(url, entry);
        entries.push(entry);
      }
    }
    Object.values(item).forEach(child => visit(child, categories));
  }
  const reports = path.join(base, "reports");
  const reportCategories: Record<string, string[]> = {
    "spurgeon": ["sermons"], "puritan-sermons": ["sermons"], "historic-preaching": ["sermons"],
    "scripture-studies": ["scripture"], "doctrinal-studies": ["theology"], "confessional-standards": ["standards"],
    "islam-studies": ["apologetics"], "pastoral-care": ["christian-life"], "ministry-resources": ["ministry"], "historical-lives": ["history"],
  };
  for (const dir of fs.readdirSync(reports)) {
    for (const filename of ["acquisition-manifest.json", "acquisition-results.json"]) {
      const manifest = path.join(reports, dir, filename);
      if (fs.existsSync(manifest)) visit(read(manifest), reportCategories[dir] ?? ["research"]);
    }
  }
  const sources = read(path.join(base, "sources.json")).sources.map((s: RecordData) => ({ id: s.id, name: s.name, url: s.url, role: s.role }));
  const result = {
    collections: [...vocabulary.collections, { id: "research", label: "Further research & acquisitions", definition: "Additional source destinations recorded by acquisition batches, awaiting reconciliation with the main bibliography." }],
    sources, entries,
  };
  fs.mkdirSync(path.join(root, "public/content/sources"), { recursive: true });
  fs.writeFileSync(path.join(root, "public/content/sources/directory.json"), JSON.stringify(result));
}
