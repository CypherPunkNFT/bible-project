// The study pages' data sets cut by scripts/split-data.ts (job 3fd7988a, 2026-11-19), listed in datasets.ts with the
// others. Each one's page reads it through src/lib/data.ts and falls back to the whole file where the split is missing.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Dataset } from "./engine.ts";

type Row = Record<string, unknown>;

/** The topic index (scripts/build-topics.py, data/topics/index.json, 502 KB): 5,603 topics' names and counts, the
 *  families they are grouped in and Nave's "See ..." aliases. It holds no verses (each topic's verses are already a file
 *  of their own, data/topics/t/<f>.json, read when the topic opens); the families, aliases and readings are the head and
 *  the topics' names and counts come in list files under the per-file budget, read at once and put back together into
 *  the same TopicIndex (loadTopicIndex). English only: another language reads its translated index whole, as before. */
const topics: Dataset = {
  name: "topics",
  source: "data/topics/index.json",
  rows: (source) => Object.entries(source.topics as Record<string, Row>).map(([id, summary]) => ({ id, ...summary })),
  id: (row) => row.id as string,
  head: (source) => ({ source: source.source, categories: source.categories, aliases: source.aliases, readings: source.readings }),
  extra: null,
  opening: () => true,
  layers: { list: { id: 1, title: 1, points: 1, refs: 1, f: 1, s: 1 } },
  detailShards: 1,
};

/** The manuscripts (scripts/build-manuscripts.py, data/manuscripts/collection.json, 1.2 MB) for the three manuscript
 *  studies (Manuscripts, Surviving witnesses, A passage through the manuscripts). The head holds the books, counts,
 *  holders, pictures and map; the list holds every field a list, chart, map, filter or search reads; what only the open
 *  record sheet shows (src/pages/study/manuscripts/Sheet.tsx: shelfmark, date basis and the source's own date words,
 *  how the books were read, script, language, Wikipedia revision, Syriaca address) comes when a record is opened. A
 *  field not named here also waits for the sheet, so a new one is never lost. */
const LIST_FIELDS = ["i", "n", "k", "L", "src", "g", "e", "l", "d", "why", "c", "b", "ch", "lect", "hr", "h", "m", "wp", "f", "x", "im"];
const manuscripts: Dataset = {
  name: "manuscripts",
  source: "data/manuscripts/collection.json",
  rows: (source) => source.records as Row[],
  id: (row) => row.i as string,
  head: (source) => Object.fromEntries(Object.entries(source).filter(([key]) => key !== "records")),
  extra: null,
  opening: () => true,
  layers: { list: Object.fromEntries(LIST_FIELDS.map((key) => [key, 1])) },
  detailShards: 16,
};

/** The cross-reference arcs (scripts/build-data.py, data/xref-arcs.json, 1.7 MB: about 141,700 chapter-to-chapter pairs)
 *  for the arc chart (src/components/charts/ArcDiagram.tsx) on Connections in Scripture and the References chart. One
 *  row per book, in Bible order: its chapters, its references, and its references with each later book, which draw the
 *  whole Bible as book-to-book arcs where no pre-drawn picture fits; a book's own chapter arcs (both ends, every pair
 *  that touches it) come when it is lit. The head carries the totals the pre-drawn picture is matched by. */
type Arc = [number, number, number];
function arcBooks(source: Row): Row[] {
  const chapters = source.chapters as string[], bookOf = chapters.map((label) => label.split(" ")[0]);
  const books = new Map<string, { code: string; chapters: string[]; count: number; links: Record<string, number>; arcs: Arc[] }>();
  chapters.forEach((label, i) => {
    if (!books.has(bookOf[i])) books.set(bookOf[i], { code: bookOf[i], chapters: [], count: 0, links: {}, arcs: [] });
    books.get(bookOf[i])!.chapters.push(label);
  });
  for (const arc of source.arcs as Arc[]) {
    const [a, b] = [bookOf[arc[0]], bookOf[arc[1]]];
    for (const code of new Set([a, b])) { books.get(code)!.arcs.push(arc); books.get(code)!.count += arc[2]; }
    if (a !== b) books.get(a)!.links[b] = (books.get(a)!.links[b] ?? 0) + arc[2];
  }
  return [...books.values()];
}
const arcs: Dataset = {
  name: "arcs",
  source: "data/xref-arcs.json",
  rows: arcBooks,
  id: (row) => row.code as string,
  head: (source) => ({ arcs: (source.arcs as Arc[]).length, references: (source.arcs as Arc[]).reduce((sum, arc) => sum + arc[2], 0) }),
  extra: null,
  opening: () => true,
  layers: { list: { code: 1, chapters: 1, count: 1, links: 1 } },
  detailShards: 64,
};

/** Circles of study (public/circles/catalogue.json, 2.4 MB, with public/circles/readers.json, 1.2 MB) for the explorer
 *  at /study/circles (src/pages/study/circles/runtime.mjs). One row per work: the catalogue's 787 works first, then each
 *  leader's own works (today Spurgeon's 3,556 sermons, read only by his page). The head holds the categories, the
 *  studies, the leaders and the featured works; the list holds what the rings, the shelf, the search and the panel
 *  show; a work's records (where it appears on the site) and its reading copy's place in the document files come when
 *  the work is opened. The page's opening is the head and the files holding the catalogue's works. */
const circlesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CIRCLE_LIST = ["id", "title", "author", "leader", "year", "url", "origin", "originalDate", "fullDate", "dateEvent", "dateNote", "genre", "number", "passages", "catalogueEntry"];
const circleReaders = () => JSON.parse(readFileSync(path.join(circlesRoot, "public/circles/readers.json"), "utf8")) as { readers: Record<string, Row>; featured: string[] };
const circleWorks = new WeakSet<Row>();
function circleRows(source: Row): Row[] {
  const { readers } = circleReaders();
  const works = source.works as Row[], leaderWorks = Object.values(source.leaderWorks as Record<string, Row[]>).flat();
  const rows = [...works, ...leaderWorks].map((work): Row => (readers[work.id as string] ? { ...work, reader: readers[work.id as string] } : { ...work }));
  rows.slice(0, works.length).forEach((row) => circleWorks.add(row));
  const ids = new Set(rows.map((row) => row.id));
  const orphans = Object.keys(readers).filter((id) => !ids.has(id));
  if (orphans.length) throw new Error(`Split data circles: readers.json has reading copies for works the catalogue lacks: ${orphans.slice(0, 5).join(", ")}`);
  return rows;
}
const circles: Dataset = {
  name: "circles",
  source: "public/circles/catalogue.json",
  rows: circleRows,
  id: (row) => row.id as string,
  head: (source) => ({ categories: source.categories, studies: source.studies, leaders: source.leaders, featured: circleReaders().featured,
    works: (source.works as Row[]).length, leaderWorks: Object.fromEntries(Object.entries(source.leaderWorks as Record<string, Row[]>).map(([id, list]) => [id, list.length])) }),
  extra: null,
  opening: (row) => circleWorks.has(row),
  layers: { list: Object.fromEntries(CIRCLE_LIST.map((key) => [key, 1])) },
  detailShards: 64,
};

export const STUDY_DATASETS: Dataset[] = [topics, manuscripts, arcs, circles];
