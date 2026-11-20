// The data sets scripts/split-data.ts cuts into small files (src/lib/split-data.ts). To add one: describe its rows and
// layers here, read it on the page through the manifest, and give its page an entry in data-budgets.json.
import type { Dataset } from "./engine.ts";
import { sources } from "./sources.ts";
import { STUDY_DATASETS } from "./study-datasets.ts";
import { inTheme, THEMES } from "../../src/pages/questions/test/themes.ts";
import type { TestQuestion } from "../../src/pages/questions/test/engine.ts";

type Row = Record<string, unknown>;
const dates = (row: Row) => ((row.facts as Row | undefined)?.dates ?? {}) as Row;

/** The Scholars population (scripts/reconcile-scholar-population.py, 9,111 contributors, 23 MB): the page's opening
 *  draws only the timeline of supported birth years (eligibleBirth in src/pages/teachers/scholars/population.ts), so
 *  those rows go first. The list layer keeps everything the cards, filters, sort, directory, numbers, timelines and
 *  table rows read; the work titles (shown on cards, 0.7 MB compressed) come with the whole list; the search text of
 *  every work title (6 MB) only once someone searches; the rest (sources, evidence, join basis, example ids) only when
 *  a record is opened. The Analysis page (src/pages/AnalysisPage.tsx) reads only its own layer: names, aliases, dates and
 *  work counts, without the ids (112 KB compressed of random hex the page never shows), about 170 KB compressed. */
const scholars: Dataset = {
  name: "scholars",
  source: "public/content/scholar-population/index.json",
  rows: (source) => source.entries as Row[],
  id: (row) => row.id as string,
  head: (source) => ({ schemaVersion: source.schemaVersion, builtAt: source.builtAt, summary: source.summary, factSummary: source.factSummary }),
  extra: (source) => ({ sourceCredits: source.sourceCredits, reconciliation: source.reconciliation }),
  opening: (row) => ["documented-profile", "source-supported"].includes(dates(row).status as string) && Number.isFinite(dates(row).born),
  layers: {
    list: {
      id: 1, name: 1, profileId: 1, aliases: 1, verifiedAliases: 1, contributorIds: 1, roles: 1, traditions: 1, collections: 1,
      records: 1, readable: 1, supplements: 1, sourceLifeDates: 1, addedFrom: 1, counts: 1, profileAvailability: 1,
      fields: { "*": { count: 1 } },
      identity: { status: 1, entityType: 1, reviewRequired: 1, candidateIds: 1 },
      facts: { kind: 1, faith: 1, expertise: 1, expertiseBasis: 1, collections: 1, recordedTraditions: 1, sourceContributorIds: 1,
        dates: { status: 1, era: 1, born: 1, died: 1, floruit: 1, approximate: 1, sourceConflict: 1, basis: 1 } },
    },
    titles: { fields: { "*": { example: { title: 1 } } } },
    search: { searchText: 1 },
    analysis: { name: 1, aliases: 1, verifiedAliases: 1, counts: { workGroups: 1 },
      facts: { dates: { status: 1, born: 1, died: 1, floruit: 1, approximate: 1, sourceConflict: 1 } } },
  },
  detailShards: 64,
};

/** The question bank (scripts/build-question-bank.py, data/questions/bank.json: 14,916 questions, 16 MB) for the
 *  Questions pages (src/pages/questions/question-store.ts). Every row's list layer comes first: what the counts, filters,
 *  book ring, statistics and the test's pool read. The head carries what would otherwise need the words of every
 *  question: each theme's questions (two themes match the question's wording, test/themes.ts), the questions without
 *  options (the "multiple choice only" filter) and where each collection's rows lie (the children's page reads only its
 *  two). The words of a question come in small files for the rows on screen, every one of them only for a search; the
 *  tagged passages with them, or all at once when the test page counts a chapter. English only: in another language
 *  the pages read that language's whole bank, as before. Rows have no id of their own; a row's id is its place. */
const questionPlace = new WeakMap<Row, string>();
const questionHead = (source: Row) => {
  const rows = source.questions as Row[];
  // Each theme's questions as gaps from the one before (the first from 0), which compress to a fraction of the places.
  const gaps = (places: number[]) => places.map((place, i) => place - (i ? places[i - 1] : 0));
  const themes = Object.fromEntries(THEMES.map((theme) => [theme.id, gaps(rows.flatMap((row, i) => inTheme(theme, row as unknown as TestQuestion) ? [i] : []))]));
  const ranges: Record<string, [number, number][]> = {};
  rows.forEach((row, i) => {
    const runs = ranges[row.collection as string] ??= [];
    const last = runs[runs.length - 1];
    if (last && last[1] === i) last[1] = i + 1; else runs.push([i, i + 1]);
  });
  const withoutOptions = rows.flatMap((row, i) => (row.options ? [] : [i]));
  return { schema: source.schema, kinds: source.kinds, topics: source.topics, books: source.books, collections: source.collections, themes, withoutOptions, ranges };
};
const questions: Dataset = {
  name: "questions",
  source: "data/questions/bank.json",
  rows: (source) => {
    const rows = source.questions as Row[];
    rows.forEach((row, i) => questionPlace.set(row, String(i)));
    return rows;
  },
  id: (row) => questionPlace.get(row) as string,
  head: questionHead,
  extra: null,
  opening: () => true,
  layers: {
    list: { kind: 1, topic: 1, testament: 1, books: 1, collection: 1, tradition: 1, level: 1, children: 1, standalone: 1, link: 1, lead_in: 1, people: 1, places: 1 },
    text: { question: 1, answer: 1, options: 1, answer_choice: 1, reference: 1, lesson: 1, child: 1 },
    passages: { passages: 1 },
  },
  // About 300 questions a file: a book's or a theme's first screen of 40 reads a few small files, not a few large ones.
  partGzipKB: { text: 24, passages: 24 },
  detailShards: 8,
};

/** The People list (data/study/people.json, scripts/build-study.py people_files: 3,133 rows, 375 KB, 77 KB compressed).
 *  A person page needs only the list layer (names, other names, verse counts, eras: about 37 KB compressed) for the
 *  person's own row, the family links and "one of N people named"; the one-line briefs (the family links' tooltips)
 *  come when the family box nears the screen (job 55541c54). Every row is in that first read, so every row is the
 *  opening. English only: a page in another language reads its translated people.json whole (src/lib/study.ts). */
const people: Dataset = {
  name: "people",
  source: "data/study/people.json",
  rows: (source) => source as unknown as Row[],
  id: (row) => row.id as string,
  head: () => ({}),
  extra: null,
  opening: () => true,
  layers: {
    list: { id: 1, n: 1, o: 1, c: 1, p: 1, g: 1 },
    briefs: { b: 1 },
  },
  detailShards: 1,
};

/** The acquired library's catalogue (public/content/teacher-library/catalogue.json, scripts/build-acquired-teachers.py:
 *  8,477 contributors, 1.5 MB, 230 KB compressed; not in git), read by "The texts we hold, by contributor" on
 *  /teachers/works and the Preachers page. Its figures are the head; the contributor rows (everything a card, the
 *  filters and the search read) come in files under the per-file budget when that section nears the screen (job
 *  55541c54). On /teachers/works it is on the first screen, so every row is the opening. */
const teacherLibrary: Dataset = {
  name: "teacher-library",
  source: "public/content/teacher-library/catalogue.json",
  rows: (source) => source.contributors as Row[],
  id: (row) => row.id as string,
  head: (source) => Object.fromEntries(Object.entries(source).filter(([key]) => key !== "contributors")),
  extra: null,
  opening: () => true,
  layers: {
    list: { id: 1, name: 1, side: 1, traditions: 1, profileId: 1, roles: 1, records: 1, readable: 1, sourceLifeDates: 1 },
  },
  detailShards: 1,
};

export const DATASETS: Dataset[] = [scholars, questions, sources, ...STUDY_DATASETS, people, teacherLibrary];
