// Preachers & authors data (src/data/teachers/people.json): the library catalogue (works, genres, Bible passages,
// reading addresses, Spurgeon's delivery dates) joined to content/teachers/lives.json (life years, places, best-known
// works, documented links, one line each). Ported from design/authors-directions/shared/build-data.mjs.
import fs from "node:fs";
import path from "node:path";
import type { Book, KnownWork, NotableWork, PassageWork, PeopleData, Person, Place, Sermon } from "../../src/data/teachers/pages-types.ts";
import { box, mercator, naturalEarth, projectView, sphere } from "./maps.ts";

interface LifeEntry { short: string; born: number; died: number | null; circa?: boolean; birthplaceKnown?: boolean; line: string; places: Place[]; known: [string, number][] }
interface Lives { people: Record<string, LifeEntry>; links: [string, string, string][] }
interface RegistryAuthor { id: string; name: string; traditions: string[] }
interface CatalogPassage { role: string; start?: number; reference: string }
interface CatalogWork {
  id: string; title: string; genre: string; creators?: { authorId: string }[]; passages?: CatalogPassage[];
  related?: { relation: string; targetId: string }[]; evidence?: { url: string }[]; dates?: { event: string; value: string | null }[];
  reading?: { summary?: string };
}
interface Holdings { works: number; genres: Record<string, number>; notable: (NotableWork & { rank: number })[]; books: number[]; sermons: Sermon[]; passages: PassageWork[]; titleUrls: Map<string, string>; titles: Set<string> }

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
const listJson = (dir: string) => fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
const normal = (title: string) => title.toLowerCase().replace(/^(the|a|an) /, "").replace(/[^a-z0-9]+/g, " ").trim();
const NOTABLE_GENRES = ["systematic-theology", "treatise", "commentary", "collected-works", "autobiography", "catechism", "letter", "devotional", "biography", "lecture"];

/** Where each work can be read: work → edition → asset address (the original source page or file). */
function readingAddresses(library: string): Map<string, string> {
  const editionWork = new Map<string, string>();
  for (const file of listJson(path.join(library, "catalog/editions"))) {
    const edition = readJson<{ id: string; workId: string }>(file);
    editionWork.set(edition.id, edition.workId);
  }
  const workUrl = new Map<string, string>();
  for (const file of listJson(path.join(library, "catalog/assets"))) {
    const asset = readJson<{ editionId: string; finalUrl: string | null; canonicalUrl: string | null }>(file);
    const workId = editionWork.get(asset.editionId), url = asset.finalUrl ?? asset.canonicalUrl;
    if (workId && url && !workUrl.has(workId)) workUrl.set(workId, url);
  }
  return workUrl;
}

function registry(library: string): Map<string, RegistryAuthor> {
  const out = new Map<string, RegistryAuthor>();
  const files = ["authors.json", ...fs.readdirSync(path.join(library, "registry-extensions")).map((f) => `registry-extensions/${f}`)];
  for (const file of files) for (const author of readJson<{ authors?: RegistryAuthor[] }>(path.join(library, file)).authors ?? []) out.set(author.id, author);
  return out;
}

function collectHoldings(library: string, ids: string[], workUrl: Map<string, string>) {
  const published = new Set(readJson<{ workIds: string[] }>(path.join(library, "publication.json")).workIds);
  const held: Record<string, Holdings> = Object.fromEntries(ids.map((id) => [id, { works: 0, genres: {}, notable: [], books: Array(66).fill(0), sermons: [], passages: [], titleUrls: new Map(), titles: new Set() }]));
  const chapters: Record<string, Record<string, number>> = {};
  for (const file of listJson(path.join(library, "catalog/works"))) {
    const work = readJson<CatalogWork>(file);
    const creator = work.creators?.find((c) => held[c.authorId]);
    if (!creator) continue;
    const person = held[creator.authorId], key = normal(work.title);
    person.works++;
    person.titles.add(key);
    if (workUrl.has(work.id) && !person.titleUrls.has(key)) person.titleUrls.set(key, workUrl.get(work.id)!);
    person.genres[work.genre] = (person.genres[work.genre] ?? 0) + 1;
    const main = (work.passages ?? []).filter((p) => p.role === "main-text" && p.start);
    for (const passage of main) {
      const book = Math.floor(passage.start! / 1e6), chapter = Math.floor(passage.start! / 1e3) % 1000;
      if (book < 1 || book > 66) continue;
      person.books[book - 1]++;
      const cell = (chapters[`${book}:${chapter}`] ??= {});
      cell[creator.authorId] = (cell[creator.authorId] ?? 0) + 1;
    }
    // Where to read it: its own file, else the volume it is part of, else the source the catalogue cites for it.
    const parent = work.related?.find((r) => r.relation === "is-part-of")?.targetId;
    const url = workUrl.get(work.id) ?? (parent ? workUrl.get(parent) : undefined) ?? work.evidence?.find((e) => /^https?:/.test(e.url))?.url ?? null;
    const delivered = work.dates?.find((d) => d.event === "delivery" && d.value)?.value ?? null;
    if (main.length) {
      const first = main[0];
      if (work.genre === "sermon") person.sermons.push({ t: work.title, r: first.reference, v: first.start!, d: delivered, u: url });
      person.passages.push({ t: work.title, g: work.genre, r: first.reference, v: first.start!, d: delivered, u: url });
    }
    const rank = published.has(work.id) ? -10 : NOTABLE_GENRES.indexOf(work.genre); // published first; -1 = not a notable genre
    if (rank !== -1) person.notable.push({ t: work.title, g: work.genre, rank, s: work.reading?.summary ?? null });
  }
  return { held, chapters };
}

function finishHoldings(id: string, person: Holdings): NotableWork[] {
  person.notable.sort((a, b) => a.rank - b.rank || a.t.length - b.t.length);
  const seen = new Set<string>();
  person.passages.sort((a, b) => a.v - b.v);
  person.sermons.sort((a, b) => (a.d ?? "9").localeCompare(b.d ?? "9") || a.v - b.v);
  if (id !== "author-charles-spurgeon") person.sermons = person.sermons.slice(0, 60); // Spurgeon keeps every dated sermon
  return person.notable.filter((w) => !seen.has(w.t) && Boolean(seen.add(w.t))).slice(0, 8).map(({ t, g, s }) => ({ t, g, s }));
}

export function buildPeople(site: string): PeopleData {
  const library = path.join(site, "content/library");
  const lives = readJson<Lives>(path.join(site, "content/teachers/lives.json"));
  const ids = Object.keys(lives.people);
  const names = registry(library);
  for (const id of ids) if (!names.has(id)) throw new Error(`content/teachers/lives.json names ${id}, which is not in the library's author registry`);
  for (const [from, to] of lives.links) for (const id of [from, to]) if (!lives.people[id]) throw new Error(`a link in content/teachers/lives.json names ${id}, who has no entry`);
  const books: Book[] = readJson<{ books: { code: string; name: string; section: string; chapters: number[][] }[] }>(path.join(site, "data/stats.json")).books
    .filter((b) => b.section !== "apocrypha").map((b) => ({ code: b.code, name: b.name, section: b.section, chapters: b.chapters.map((c) => c[0]) }));
  if (books.length !== 66) throw new Error(`expected 66 books in data/stats.json, found ${books.length}`);
  const { held, chapters } = collectHoldings(library, ids, readingAddresses(library));

  const points = Object.fromEntries(ids.flatMap((id) => lives.people[id].places.map(([, lat, lon], i) => [`${id}#${i}`, [lat, lon] as [number, number]])));
  const views = {
    world: projectView(site, { size: [1000, 520], projection: naturalEarth(), fit: sphere, detail: "110m" }, points, false),
    atlantic: projectView(site, { size: [1000, 560], projection: mercator(), fit: box(-112, 26, 32, 60), detail: "50m" }, points, false),
    europe: projectView(site, { size: [1000, 680], projection: mercator(), fit: box(-9, 45.2, 18, 58.6), detail: "50m" }, points, false),
    america: projectView(site, { size: [1000, 640], projection: mercator(), fit: box(-95, 32, -68, 46), detail: "50m" }, points, false),
  };

  const people: Person[] = ids.map((id) => {
    const life = lives.people[id], have = held[id], notable = finishHoldings(id, have);
    const known: KnownWork[] = life.known.map(([title, year]) => {
      const match = [...have.titles].find((x) => x.includes(normal(title)) || (normal(title).includes(x) && x.length > 8));
      return { t: title, y: year, inLibrary: Boolean(match), u: match ? have.titleUrls.get(match) ?? null : null };
    });
    const { known: _known, ...rest } = life;
    void _known;
    return { id, name: names.get(id)!.name, traditions: names.get(id)!.traditions, ...rest, works: have.works, genres: have.genres, notable, known,
      passages: have.passages, books: have.books, sermons: have.sermons };
  }).sort((a, b) => a.born - b.born);

  return {
    about: "Built by scripts/build-teacher-pages.ts from content/library (catalogue counts, titles, Bible passages, reading addresses, Spurgeon's delivery dates) and content/teachers/lives.json (life years, places, best-known works and links).",
    books, people, links: lives.links.map(([from, to, note]) => ({ from, to, note })), chapters,
    views: Object.fromEntries(Object.entries(views).map(([k, v]) => [k, { width: v.width, height: v.height, land: v.land, places: v.points }])) as PeopleData["views"],
  };
}
