// Teachers (/teachers): the preachers, authors and scholars, derived from the Christian library and the site's citations.
//   node --experimental-strip-types scripts/build-teachers.ts           rebuild src/data/teachers/teachers.json
//   node --experimental-strip-types scripts/build-teachers.ts --check   fail if the file is stale or a link does not resolve
// Sources: content/library/authors.json (who is eligible, traditions, evidence, any dates in the evidence locators),
// content/library/catalog/works (what the library holds), content/library/publication.json (what the site publishes),
// content/apologetics (sources by these people and the studies citing them) and content/feature-citations.json (the works
// the study pages cite). Nothing here is written by hand about a person: every field is copied or counted from those files.
// The catalogue loop follows design/authors-directions/shared/build-data.mjs (the Authors mock-ups), which reads the same works.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicationYear, readFeatureCitations, type CitedWork } from "./feature-citations.ts";
import type { ApologeticsEntry, CitedEntry, PublishedWork, Section, Teacher, TeachersData } from "../src/data/teachers/types.ts";
import { CITED_EXCLUDED, CITED_OVERRIDES, ERA_CENTURY, GENRE_LABELS, TRADITION_LABELS, WRITTEN_GENRES } from "./teachers-rules.ts";

export type { Section, Teacher, TeachersData };

export const RULES: Record<Section, string> = {
  preacher: "Listed as a preacher when the library catalogues at least one sermon by them.",
  author: "Listed as an author when the library catalogues their written works (books, treatises, letters, articles), or the Apologetics pages cite their writing, and they are not listed as a scholar.",
  scholar: "Listed as a scholar when the registry places them among the systematic and biblical theologians, the library holds their systematic theology or works on its Understanding Scripture shelf (commentary and biblical theology), or the site's study pages cite their work.",
};

/** The fields of a content/library/authors.json entry this build reads. */
interface RegistryAuthor { id: string; name: string; entityType: string; eligibility: string; cohort: string; traditions: string[]; evidence: { url: string; locator: string }[] }

const OUT = "src/data/teachers/teachers.json";
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));
const number = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, one: string, many: string) => `${number(n)} ${n === 1 ? one : many}`;
const slug = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** "surname|first initial": the key that joins "R. Dick Wilson" with "R. D. Wilson" and "John Gill" with the registry's Gill. */
export function nameKey(name: string): string {
  const tokens = name.replace(/[’']/g, "").split(/\s+/).filter((t) => t && !/^jr\.?$/i.test(t));
  const surname = (tokens[tokens.length - 1] ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z-]/g, "");
  return `${surname}|${(tokens[0] ?? "").charAt(0).toLowerCase()}`;
}

/** Life dates as the registry's evidence locator gives them: "Calvin, Jean (d. 1564)" → "d. 1564"; "(c.1620–1686)" → "c. 1620–1686". */
export function datesFromLocator(locator: string): string | undefined {
  const died = locator.match(/\(d\.\s*(\d{4})\)/);
  if (died) return `d. ${died[1]}`;
  const span = locator.match(/\((c\.\s*)?(\d{4})\s*[–-]\s*(\d{4})\)/);
  return span ? `${span[1] ? "c. " : ""}${span[2]}–${span[3]}` : undefined;
}

/** The people a citation's author field names. Translators, editors' series and "in X (ed.)" hosts are dropped. */
export function citedPeople(author: string): string[] {
  if (CITED_OVERRIDES[author]) return CITED_OVERRIDES[author];
  const text = author.replace(/\([^)]*\)/g, "").split(/,\s*(?:in|tr\.?|trans\.?|ed\.?|with)\s/i)[0].replace(/\s+and others$/i, "").trim();
  if (!text || /^(tr|trans)\.?\s/i.test(text)) return [];
  return text.split(/\s*,\s*|\s+and\s+|\s*&\s*/).map((part) => part.trim()).filter(Boolean);
}

const NAME_SHAPE = /^(?:\p{Lu}[\p{L}’'-]*\.?(?:-\p{Lu}\.)?)(?:\s+(?:\p{Lu}[\p{L}’'-]*\.?|Jr\.|de|von|of|the))+$/u;

interface Holding { total: number; genres: Map<string, number>; collections: Map<string, number>; eras: Map<string, number>; books: Set<number> }
const count = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);
const sorted = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

function readHoldings(library: string, people: Set<string>): Map<string, Holding> {
  const holdings = new Map<string, Holding>();
  const dir = path.join(library, "catalog/works");
  for (const file of fs.readdirSync(dir).sort()) {
    const work = readJson(path.join(dir, file));
    for (const authorId of new Set<string>((work.creators ?? []).map((c: { authorId: string }) => c.authorId))) {
      if (!people.has(authorId)) continue;
      const h = holdings.get(authorId) ?? { total: 0, genres: new Map(), collections: new Map(), eras: new Map(), books: new Set<number>() };
      h.total++;
      count(h.genres, work.genre);
      for (const id of work.collections ?? []) count(h.collections, id);
      if (work.era && work.era !== "unknown" && work.era !== "multiple") count(h.eras, work.era);
      if (work.genre === "sermon") for (const p of work.passages ?? []) if (p.role === "main-text" && p.start) { const book = Math.floor(p.start / 1e6); if (book >= 1 && book <= 66) h.books.add(book); }
      holdings.set(authorId, h);
    }
  }
  return holdings;
}

function readPublished(library: string): Map<string, PublishedWork[]> {
  const publication = readJson(path.join(library, "publication.json"));
  const editions = (publication.editionIds as string[]).map((id) => readJson(path.join(library, "catalog/editions", `${id}.json`)));
  const assets = (publication.assetIds as string[]).map((id) => readJson(path.join(library, "catalog/assets", `${id}.json`)));
  const byAuthor = new Map<string, PublishedWork[]>();
  for (const workId of publication.workIds as string[]) {
    const work = readJson(path.join(library, "catalog/works", `${workId}.json`));
    const edition = editions.find((e) => e.workId === workId);
    const asset = edition && assets.find((a) => a.editionId === edition.id);
    const entry: PublishedWork = { title: work.title, read: `/apologetics/texts?q=${encodeURIComponent(work.title)}`, source: asset?.canonicalUrl ?? null, rights: edition?.textRights?.status ?? null };
    for (const c of work.creators) byAuthor.set(c.authorId, [...(byAuthor.get(c.authorId) ?? []), entry]);
  }
  return byAuthor;
}

/** Apologetics sources written by a registry person (matched on "Name · host"), with the published studies that cite each. */
function readApologetics(root: string, keyToId: Map<string, string>): Map<string, ApologeticsEntry[]> {
  const base = path.join(root, "content/apologetics");
  const studies = fs.readdirSync(path.join(base, "studies")).sort().map((f) => readJson(path.join(base, "studies", f))).filter((s) => s.publication === "published");
  const byAuthor = new Map<string, ApologeticsEntry[]>();
  for (const file of fs.readdirSync(path.join(base, "sources")).sort()) {
    const source = readJson(path.join(base, "sources", file));
    if (source.publication !== "published") continue;
    const id = keyToId.get(nameKey(String(source.content.author).split(" · ")[0].trim()));
    if (!id) continue;
    const citing = studies.filter((s) => JSON.stringify(s.content).includes(`"source":"${source.id}"`) || (s.content.sources ?? []).includes(source.id));
    const entry = { title: source.content.title, url: source.content.url, studies: citing.map((s) => ({ label: s.content.title, href: `/apologetics/study/${s.id}` })) };
    byAuthor.set(id, [...(byAuthor.get(id) ?? []), entry]);
  }
  return byAuthor;
}

const century = (year: number) => `${Math.floor((year - 1) / 100) * 100}s`;

function libraryTeacher(author: RegistryAuthor, h: Holding | undefined, published: PublishedWork[], apologetics: ApologeticsEntry[], cited: CitedEntry[]): Teacher | { name: string; reason: string } {
  const genres = h ? h.genres : new Map<string, number>();
  const sermons = genres.get("sermon") ?? 0;
  const written = WRITTEN_GENRES.reduce((n, g) => n + (genres.get(g) ?? 0), 0);
  const systematic = genres.get("systematic-theology") ?? 0, scripture = h?.collections.get("scripture") ?? 0;
  const basis: Teacher["basis"] = {};
  if (sermons) basis.preacher = `The library catalogues ${plural(sermons, "sermon", "sermons")} by them.`;
  const scholar: string[] = [];
  if (author.cohort === "systematic-biblical-theologians") scholar.push("The author registry places them among the systematic and biblical theologians.");
  if (systematic) scholar.push(`The library holds ${plural(systematic, "part", "parts")} of their systematic theology.`);
  if (scripture) scholar.push(`${plural(scripture, "work", "works")} of theirs ${scripture === 1 ? "sits" : "sit"} on the library's Understanding Scripture shelf.`);
  if (cited.length) scholar.push(`Our study pages cite ${plural(cited.length, "work", "works")} of theirs.`);
  if (scholar.length) basis.scholar = scholar.join(" ");
  else if (written || apologetics.length) basis.author = [written && `The library catalogues ${plural(written, "written work", "written works")} by them.`, apologetics.length && `The Apologetics pages cite ${plural(apologetics.length, "piece", "pieces")} of their writing.`].filter(Boolean).join(" ");
  const sections = (["preacher", "author", "scholar"] as Section[]).filter((s) => basis[s]);
  if (!sections.length) return { name: author.name, reason: "The library holds none of their works yet and no page cites them." };
  const evidence = author.evidence[0];
  const dates = author.evidence.map((e) => datesFromLocator(e.locator)).find(Boolean);
  const topEra = h && sorted(h.eras)[0];
  const deathYear = dates ? Number(dates.slice(-4)) : null;
  const era = topEra ? ERA_CENTURY[topEra[0]] : deathYear ? century(deathYear) : undefined;
  const eraBasis = topEra ? `The era recorded on ${plural(topEra[1], "of their catalogued works", "of their catalogued works")}.` : deathYear ? `The registry's evidence gives ${dates}.` : undefined;
  return {
    id: author.id, name: author.name, origin: "library", sections, basis, ...(dates && { dates }), traditions: author.traditions,
    ...(era && { era, eraBasis }), ...(author.eligibility === "provisional" && { status: "provisional" as const }),
    evidence: { url: evidence.url, locator: evidence.locator },
    ...(published.length && { shelf: `/apologetics/texts?author=${author.id}` }),
    ...(h && { holdings: { total: h.total, genres: sorted(h.genres), sermonBooks: h.books.size } }),
    published, apologetics, cited,
  };
}

function citedEntry(work: CitedWork): CitedEntry {
  const citedOn: CitedEntry["citedOn"] = [];
  for (const on of work.citedOn) if (!citedOn.some((c) => c.address === on.address && c.page === on.page)) citedOn.push({ page: `${on.feature} · ${on.page}`, address: on.address });
  return { title: work.title, year: work.year, urls: work.urls, citedOn };
}

/** Group the cited works by person; registry people are returned by id, everyone else under a stable "cited-" id. */
function groupCited(root: string, keyToId: Map<string, string>) {
  const byRegistry = new Map<string, CitedEntry[]>();
  const scholars = new Map<string, { names: Set<string>; works: CitedWork[] }>();
  const notListed = new Map<string, string>();
  for (const work of readFeatureCitations(root)) {
    const names = citedPeople(work.author);
    if (!names.length) notListed.set(work.author, "A translation or article that names no author.");
    for (const name of names) {
      if (CITED_EXCLUDED[name]) { notListed.set(name, CITED_EXCLUDED[name]); continue; }
      if (!NAME_SHAPE.test(name)) throw new Error(`teachers: cannot read a person's name from citation author "${work.author}" (got "${name}"); add it to CITED_OVERRIDES or CITED_EXCLUDED in scripts/teachers-rules.ts`);
      const key = nameKey(name), registryId = keyToId.get(key);
      if (registryId) { byRegistry.set(registryId, [...(byRegistry.get(registryId) ?? []), citedEntry(work)]); continue; }
      const group = scholars.get(key) ?? { names: new Set<string>(), works: [] };
      group.names.add(name);
      if (!group.works.includes(work)) group.works.push(work);
      scholars.set(key, group);
    }
  }
  const cited: Teacher[] = [...scholars.values()].map(({ names, works }) => {
    const name = [...names].sort((a, b) => b.length - a.length || a.localeCompare(b))[0];
    const years = works.map((w) => publicationYear(w.year)).filter((y): y is number => y !== null);
    const first = years.length ? Math.min(...years) : null;
    const entries = works.map(citedEntry).sort((a, b) => a.title.localeCompare(b.title, "en"));
    return {
      id: `cited-${slug(name)}`, name, origin: "cited", sections: ["scholar"],
      basis: { scholar: `Our study pages cite ${plural(entries.length, "work", "works")} of theirs.` }, traditions: [],
      ...(first && { era: century(first), eraBasis: `The earliest cited edition was published in ${first}.` }),
      published: [], apologetics: [], cited: entries,
    };
  });
  return { byRegistry, cited, notListed };
}

const surnameOf = (name: string) => nameKey(name).split("|")[0];

export function buildTeachers(root: string): TeachersData {
  const library = path.join(root, "content/library");
  const registry = (readJson(path.join(library, "authors.json")).authors as RegistryAuthor[]).filter((a) => a.entityType === "person" && ["eligible", "provisional"].includes(a.eligibility));
  const keyToId = new Map<string, string>();
  for (const a of registry) keyToId.set(nameKey(a.name), a.id);
  const holdings = readHoldings(library, new Set(registry.map((a) => a.id)));
  const published = readPublished(library);
  const apologetics = readApologetics(root, keyToId);
  const { byRegistry, cited, notListed } = groupCited(root, keyToId);
  const teachers: Teacher[] = [];
  const skipped: TeachersData["notListed"] = [];
  for (const author of registry) {
    const made = libraryTeacher(author, holdings.get(author.id), published.get(author.id) ?? [], apologetics.get(author.id) ?? [], byRegistry.get(author.id) ?? []);
    if ("id" in made) teachers.push(made); else skipped.push(made);
  }
  teachers.push(...cited);
  teachers.sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name), "en") || a.name.localeCompare(b.name, "en"));
  const counts = { preacher: 0, author: 0, scholar: 0 };
  for (const t of teachers) for (const s of t.sections) counts[s]++;
  return {
    about: "Generated by scripts/build-teachers.ts from content/library (author registry, catalogue, publication), content/apologetics and content/feature-citations.json. Do not edit by hand: rerun the script.",
    rules: RULES,
    labels: { traditions: TRADITION_LABELS, genres: GENRE_LABELS, eras: Object.fromEntries([...new Set(teachers.map((t) => t.era).filter(Boolean) as string[])].sort().map((e) => [e, `The ${e}`])) },
    counts, teachers,
    notListed: [...skipped, ...[...notListed].map(([name, reason]) => ({ name, reason }))].sort((a, b) => a.name.localeCompare(b.name, "en")),
  };
}

/** Route patterns from src/App.tsx, as regular expressions over a pathname. */
export function appRoutes(root: string): RegExp[] {
  const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
  return [...app.matchAll(/<Route path="([^"]+)"/g)].map(([, route]) => route).filter((r) => r !== "*")
    .map((r) => new RegExp(`^${r.replace(/\/\*$/, "(?:/.*)?").replace(/\/:[a-z]+\?/gi, "(?:/[^/]+)?").replace(/:[a-z]+/gi, "[^/]+")}/?$`));
}

/** Every problem with the data: unknown ids, on-site links that match no route, sources that are not web addresses. */
export function checkTeachers(root: string, data: TeachersData): string[] {
  const problems: string[] = [];
  const routes = appRoutes(root);
  const onSite = (href: string, where: string) => { const pathname = href.split(/[?#]/)[0]; if (!routes.some((r) => r.test(pathname))) problems.push(`${where}: ${href} matches no route in src/App.tsx`); };
  const web = (url: string | null, where: string) => { if (url !== null && !/^https?:\/\/[^\s]+$/.test(url)) problems.push(`${where}: "${url}" is not a web address`); };
  const library = path.join(root, "content/library");
  const registryIds = new Set((readJson(path.join(library, "authors.json")).authors as { id: string }[]).map((a) => a.id));
  const publishedAuthors = new Set<string>();
  for (const id of readJson(path.join(library, "publication.json")).workIds as string[]) for (const c of readJson(path.join(library, "catalog/works", `${id}.json`)).creators) publishedAuthors.add(c.authorId);
  const studyIds = new Set(fs.readdirSync(path.join(root, "content/apologetics/studies")).map((f) => f.replace(/\.json$/, "")));
  const ids = new Set<string>();
  for (const t of data.teachers) {
    const where = `${t.name} (${t.id})`;
    if (ids.has(t.id)) problems.push(`${where}: duplicate id`);
    ids.add(t.id);
    if (!t.sections.length) problems.push(`${where}: in no section`);
    for (const s of t.sections) if (!t.basis[s]) problems.push(`${where}: listed as ${s} without a basis`);
    for (const tr of t.traditions) if (!data.labels.traditions[tr]) problems.push(`${where}: unknown tradition ${tr}`);
    if (t.era && !data.labels.eras[t.era]) problems.push(`${where}: unknown era ${t.era}`);
    if (t.origin === "library" && !registryIds.has(t.id)) problems.push(`${where}: not in content/library/authors.json`);
    if (t.shelf) { onSite(t.shelf, where); if (!publishedAuthors.has(t.id)) problems.push(`${where}: has a reading shelf but no published work`); }
    if (t.evidence) web(t.evidence.url, where);
    for (const w of t.published) { onSite(w.read, `${where} · ${w.title}`); web(w.source, `${where} · ${w.title}`); }
    for (const a of t.apologetics) { web(a.url, `${where} · ${a.title}`); for (const s of a.studies) { onSite(s.href, where); if (!studyIds.has(s.href.split("/").pop()!)) problems.push(`${where}: no study ${s.href}`); } }
    for (const c of t.cited) { c.urls.forEach((u) => web(u, `${where} · ${c.title}`)); c.citedOn.forEach((on) => onSite(on.address, `${where} · ${c.title}`)); }
  }
  for (const s of ["preacher", "author", "scholar"] as Section[]) if (data.counts[s] !== data.teachers.filter((t) => t.sections.includes(s)).length) problems.push(`count for ${s} is wrong`);
  return problems;
}

export const serialise = (data: TeachersData) => `${JSON.stringify(data, null, 2)}\n`;

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const data = buildTeachers(root);
  const problems = checkTeachers(root, data);
  const file = path.join(root, OUT);
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== serialise(data)) problems.push(`${OUT} is stale: run node --experimental-strip-types scripts/build-teachers.ts`);
  }
  if (problems.length) { console.error(`teachers: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`); process.exit(1); }
  if (!process.argv.includes("--check")) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, serialise(data)); }
  console.log(`teachers: ${data.counts.preacher} preachers, ${data.counts.author} authors, ${data.counts.scholar} scholars (${data.teachers.length} people); ${data.notListed.length} names not listed${process.argv.includes("--check") ? "; up to date" : ` → ${OUT}`}`);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("scripts", "build-teachers.ts"))) main();
