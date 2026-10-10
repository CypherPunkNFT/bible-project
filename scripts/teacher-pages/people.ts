// Preachers & authors data (src/data/teachers/people.json): the library catalogue (works, genres, Bible passages,
// reading addresses, Spurgeon's delivery dates) joined to content/teachers/lives.json (life years, places, best-known
// works, documented links, one line each). Ported from design/authors-directions/shared/build-data.mjs.
import fs from "node:fs";
import path from "node:path";
import type { Book, KnownWork, NotableWork, PassageWork, PeopleData, Person, Place, Sermon } from "../../src/data/teachers/pages-types.ts";
import { box, mercator, naturalEarth, projectView, sphere } from "./maps.ts";
import { acquiredInput } from "./acquired.ts";

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

/** Only verified first-party reading addresses; source URLs remain provenance. */
function readingAddresses(site: string): Map<string, string> {
  return new Map(Object.entries(acquiredInput(site).addresses));
}

function registry(library: string): Map<string, RegistryAuthor> {
  const out = new Map<string, RegistryAuthor>();
  const files = ["authors.json", ...fs.readdirSync(path.join(library, "registry-extensions")).map((f) => `registry-extensions/${f}`)];
  for (const file of files) for (const author of readJson<{ authors?: RegistryAuthor[] }>(path.join(library, file)).authors ?? []) out.set(author.id, author);
  return out;
}

interface OverlayEntry { passages?: CatalogPassage[]; genre?: string; duplicateOf?: string }
/** content/library/passage-overlays/*.json (scripts/sermon-passages.py): main texts the sermons' own publishers state,
 *  genre corrections and second records of one sermon, kept beside the catalogue because most of those works are
 *  untracked reconciled records (Pages/Teachers/SERMONS-CAMPAIGN.md). */
function readOverlays(library: string): Map<string, OverlayEntry> {
  const dir = path.join(library, "passage-overlays"), out = new Map<string, OverlayEntry>();
  if (!fs.existsSync(dir)) return out;
  for (const file of listJson(dir)) for (const [id, entry] of Object.entries(readJson<{ works: Record<string, OverlayEntry> }>(file).works)) out.set(id, entry);
  return out;
}

function applyOverlay(work: CatalogWork, entry: OverlayEntry | undefined): CatalogWork | null {
  if (!entry) return work;
  if (entry.duplicateOf) return null;
  const hasMain = (work.passages ?? []).some((p) => p.role === "main-text" && p.start);
  const passages = entry.passages && !hasMain ? [...(work.passages ?? []).filter((p) => p.role !== "main-text"), ...entry.passages] : work.passages;
  return { ...work, genre: entry.genre ?? work.genre, passages };
}

function collectHoldings(library: string, ids: string[], workUrl: Map<string, string>) {
  const published = new Set(readJson<{ workIds: string[] }>(path.join(library, "publication.json")).workIds);
  const overlays = readOverlays(library), applied = new Set<string>();
  const held: Record<string, Holdings> = Object.fromEntries(ids.map((id) => [id, { works: 0, genres: {}, notable: [], books: Array(66).fill(0), sermons: [], passages: [], titleUrls: new Map(), titles: new Set() }]));
  const chapters: Record<string, Record<string, number>> = {};
  for (const file of listJson(path.join(library, "catalog/works"))) {
    const raw = readJson<CatalogWork>(file);
    if (overlays.has(raw.id)) applied.add(raw.id);
    const work = applyOverlay(raw, overlays.get(raw.id));
    if (!work) continue;
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
    // Its own on-site text, or the on-site parent volume; never an external fallback.
    const parent = work.related?.find((r) => r.relation === "is-part-of")?.targetId;
    const url = workUrl.get(work.id) ?? (parent ? workUrl.get(parent) : undefined) ?? null;
    const delivered = work.dates?.find((d) => d.event === "delivery" && d.value)?.value ?? null;
    if (main.length) {
      const first = main[0];
      if (work.genre === "sermon") person.sermons.push({ t: work.title, r: first.reference, v: first.start!, d: delivered, u: url });
      person.passages.push({ t: work.title, g: work.genre, r: first.reference, v: first.start!, d: delivered, u: url });
    }
    const rank = published.has(work.id) ? -10 : NOTABLE_GENRES.indexOf(work.genre); // published first; -1 = not a notable genre
    if (rank !== -1) person.notable.push({ t: work.title, g: work.genre, rank, s: work.reading?.summary ?? null });
  }
  const missing = overlays.size - applied.size;
  if (missing) console.warn(`teacher pages: ${missing} passage-overlay entries name works not in this catalogue (untracked reconciled records absent?)`);
  return { held, chapters };
}

function finishHoldings(person: Holdings): NotableWork[] {
  person.notable.sort((a, b) => a.rank - b.rank || a.t.length - b.t.length);
  const seen = new Set<string>();
  person.passages.sort((a, b) => a.v - b.v);
  person.sermons.sort((a, b) => (a.d ?? "9").localeCompare(b.d ?? "9") || a.v - b.v);
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
  const acquisition = acquiredInput(site);
  const { held, chapters } = collectHoldings(library, ids, readingAddresses(site));
  const acquired = new Map(acquisition.contributors.filter(c => c.side === "preachers").map(c => [c.profileId, c]));
  for (const [id, contributor] of acquired) {
    const have = held[id];
    if (!have) continue;
    for (const title of contributor.titles) have.titles.add(normal(title));
    for (const [title, url] of Object.entries(contributor.titleRoutes)) have.titleUrls.set(normal(title), url);
  }

  const points = Object.fromEntries(ids.flatMap((id) => lives.people[id].places.map(([, lat, lon], i) => [`${id}#${i}`, [lat, lon] as [number, number]])));
  const views = {
    world: projectView(site, { size: [1000, 520], projection: naturalEarth(), fit: sphere, detail: "110m" }, points, false),
    atlantic: projectView(site, { size: [1000, 560], projection: mercator(), fit: box(-112, 26, 32, 60), detail: "50m" }, points, false),
    europe: projectView(site, { size: [1000, 680], projection: mercator(), fit: box(-9, 45.2, 18, 58.6), detail: "50m" }, points, false),
    america: projectView(site, { size: [1000, 640], projection: mercator(), fit: box(-95, 32, -68, 46), detail: "50m" }, points, false),
  };

  const people: Person[] = ids.map((id) => {
    const life = lives.people[id], have = held[id], notable = finishHoldings(have), latest = acquired.get(id);
    const known: KnownWork[] = life.known.map(([title, year]) => {
      const matches = [...have.titles].filter((x) => x.includes(normal(title)) || (normal(title).includes(x) && x.length > 8));
      const match = matches.find(x => have.titleUrls.has(x)) ?? matches[0];
      return { t: title, y: year, inLibrary: Boolean(match), u: match ? have.titleUrls.get(match) ?? null : null };
    });
    const { known: _known, ...rest } = life;
    void _known;
    return { id, name: names.get(id)!.name, traditions: names.get(id)!.traditions, ...rest, works: have.works, genres: have.genres, notable, known,
      passages: have.passages, books: have.books, sermons: have.sermons,
      heldTexts: latest?.records ?? 0, readableTexts: latest?.readable ?? 0, acquiredId: latest?.id ?? null };
  }).sort((a, b) => a.born - b.born);

  return {
    about: "Built by scripts/build-teacher-pages.ts from content/library (catalogue counts, titles, Bible passages, reading addresses, Spurgeon's delivery dates) and content/teachers/lives.json (life years, places, best-known works and links).",
    books, people, links: lives.links.map(([from, to, note]) => ({ from, to, note })), chapters,
    views: Object.fromEntries(Object.entries(views).map(([k, v]) => [k, { width: v.width, height: v.height, land: v.land, places: v.points }])) as PeopleData["views"],
  };
}
