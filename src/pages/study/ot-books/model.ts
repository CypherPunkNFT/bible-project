// How the Old Testament books were written: the research record, the generated verses, the three rulers' marks, the table's
// two orders, the reference finder and the address values the page accepts. Everything the address asks for is looked up
// in a Map, so an unknown value falls back to the default and nothing here throws while the page loads.
import record from "../../../../content/academic-research/41-how-the-old-testament-books-were-written.json";
import generated from "./ot-books-data.json";

export type ThreePart = { id: string; head: string; evidence: string; inference: string; limit: string };
export type View = { id: string; name: string; held: string; reading: string; limit?: string };
export type DateView = { id: string; name: string; held: string; forIt: string; against: string };
export type Criterion = { id: string; head: string; theyHold: string; answer: string; limit: string };
export type LaterHand = ThreePart & { verses: string[] };
export type TableRow = { book: string; part: string; says: string; tradition: string; date: string; setting: string; differ: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = ThreePart & { claim: string; test?: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; answers: string; read: string; url?: string };
export type Ref = { code: string; chapter: number; verse: number; toChapter: number; toVerse: number; lines: [number, number, string][]; more?: number };

export const R = record as unknown as {
  title: string; turn: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  stance: { head: string; confession: string; confessionSource: string; body: string; open: string; verses: string[] };
  pentateuch: { headline: string; lead: string; selfWitness: { verse: string; says: string }[]; selfNote: string; remembered: { where: string; says: string }[];
    rememberedNote: string; laterHand: LaterHand[]; views: View[]; chicago: string; stand: string };
  documentary: { headline: string; lead: string; sources: { letter: string; name: string; theyHold: string; date: string }[]; datesNote: string;
    history: { when: string; who: string; what: string }[]; wellhausen: { quote: string; source: string; note: string }; criteria: Criterion[];
    afterWellhausen: string; answer: { head: string; points: string[]; limit: string }; stand: string };
  isaiah: { headline: string; lead: string; lines: { verse: string; quote: string; note: string }[]; evidence: ThreePart[]; views: View[]; stand: string; note: string };
  daniel: { headline: string; lead: string; named: { verse: string; quote: string }[]; namedNote: string; evidence: ThreePart[]; views: DateView[]; stand: string; limit: string };
  darius: { headline: string; question: string; record: string; views: View[]; stand: string };
  table: { headline: string; lead: string; order: string; note: string; rows: TableRow[] };
  claims: Claim[]; confusedWords: { word: string; note: string }[]; reach: string[]; trail: { work: string; answers: string; read: string }[];
  sources: Source[]; checkNotes: unknown[];
};
export const DATA = generated as unknown as {
  recordHash: string; books: string[]; chapters: Record<string, number>; neighbours: Record<string, string>; quotationsChecked: number; refs: Record<string, Ref>;
};

export const REFS = new Map<string, Ref>(Object.entries(DATA.refs));
export const NEIGHBOURS = new Map<string, string>(Object.entries(DATA.neighbours));
export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). A chapter opens whole. */
export function readerHref(ref: Ref): string {
  const base = `/read/bsb/${ref.code}/${ref.chapter}`;
  if (ref.verse === 0) return base;
  return `${base}?hl=${ref.verse}-${ref.toChapter === ref.chapter ? ref.toVerse : ref.verse}`;
}

// The reference finder: the same grammar as scripts/build-ot-books-study.py, built from the data's own list of book names.
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DASH = "[–—-]";
const SPAN = `(\\d+):(\\d+)(?:${DASH}(\\d+)(?::(\\d+))?)?`;
const CONTINUE = `(?:; |, | and )${SPAN}(?![\\d:])`;
const BOOK = `(?<![\\w.])(${DATA.books.map(escape).join("|")})`;
// Inside REFERENCE the continuations are matched without their groups, so that groups 7 and 8 stay the chapter-only form.
const REFERENCE = new RegExp(`${BOOK} (?:${SPAN}((?:${CONTINUE.split("(\\d+)").join("\\d+")})*)|(\\d+)(?:${DASH}(\\d+))?(?![\\d:]))`, "g");
const CONTINUATION = new RegExp(CONTINUE, "g");
const SEPARATOR = /^(?:; |, | and )/;
const BARE = new RegExp(`(?<![\\w:.])${SPAN}(?![\\d:])`, "g");

function spanKey(name: string, m: (string | undefined)[]): string {
  const [c, v, end, endVerse] = m.map((x) => (x === undefined ? undefined : Number(x)));
  if (end === undefined) return `${name} ${c}:${v}`;
  return endVerse === undefined ? `${name} ${c}:${v}–${end}` : `${name} ${c}:${v}–${end}:${endVerse}`;
}

export type Found = { start: number; end: number; key: string };

/** Every reference in a plain string, in order. A bare "ch:v" outside a named reference takes `book`, where one is given. */
export function findReferences(text: string, book?: string): Found[] {
  const found: Found[] = [];
  for (const match of text.matchAll(REFERENCE)) {
    const name = match[1], at = match.index ?? 0, end = at + match[0].length;
    if (match[7]) {
      found.push({ start: at, end, key: match[8] ? `${name} ${Number(match[7])}–${Number(match[8])}` : `${name} ${Number(match[7])}` });
      continue;
    }
    const more = match[6] ?? "", firstEnd = end - more.length;
    found.push({ start: at, end: firstEnd, key: spanKey(name, [match[2], match[3], match[4], match[5]]) });
    for (const next of more.matchAll(CONTINUATION)) {
      const start = firstEnd + (next.index ?? 0) + (SEPARATOR.exec(next[0])?.[0].length ?? 0);
      found.push({ start, end: firstEnd + (next.index ?? 0) + next[0].length, key: spanKey(name, [next[1], next[2], next[3], next[4]]) });
    }
  }
  if (book) {
    const claimed = [...text.matchAll(REFERENCE)].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
    for (const match of text.matchAll(BARE)) {
      const at = match.index ?? 0;
      if (!claimed.some(([s, e]) => s <= at && at < e)) found.push({ start: at, end: at + match[0].length, key: spanKey(book, [match[1], match[2], match[3], match[4]]) });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

/** Which book a field's bare references mean: the same rules as the build script's bare_book(). */
export function bareBook(path: string): string | undefined {
  const index = Number(/\[(\d+)\]/.exec(path)?.[1] ?? -1);
  if (path.startsWith(".table.rows[")) return REFERENCE_BOOKS.has(R.table.rows[index]?.book) ? R.table.rows[index].book : undefined;
  if (path.startsWith(".pentateuch.selfWitness[")) return bookOf(R.pentateuch.selfWitness[index]?.verse);
  if (path.startsWith(".pentateuch.laterHand[")) return bookOf(R.pentateuch.laterHand[index]?.verses[0]);
  if (path.startsWith(".isaiah.evidence[") && R.isaiah.evidence[index]?.id === "sirach") return undefined;
  if (path.startsWith(".daniel.evidence[") && R.daniel.evidence[index]?.id === "early-readers") return undefined;
  if (path.startsWith(".claims[") && R.claims[index]?.id === "cyrus") return "Isaiah";
  return SECTION_BOOK.get(path.slice(0, path.indexOf(".", 1) + 1));
}
const REFERENCE_BOOKS = new Set(DATA.books);
const SECTION_BOOK = new Map([[".isaiah.", "Isaiah"], [".daniel.", "Daniel"], [".darius.", "Daniel"]]);
export const bookOf = (label: string | undefined): string | undefined => DATA.books.find((name) => label?.startsWith(`${name} `));
export const ISAIAH_BARE = (id: string) => (id === "sirach" ? undefined : "Isaiah");
export const DANIEL_BARE = (id: string) => (id === "early-readers" ? undefined : "Daniel");

// The rulers: one line of chapters per book argued in full, chapter counts from the Berean itself.
export type MarkKind = "self" | "later" | "divide";
export type Mark = { id: string; kind: MarkKind; at: string; chapter: number; label: string; open: string };
export type Segment = { code: string; name: string; chapters: number; first: number };
export type Ruler = { id: string; name: string; segments: Segment[]; total: number; marks: Mark[]; band?: { from: number; to: number; label: string } };

function segments(books: [string, string][]): { segments: Segment[]; total: number } {
  let first = 0;
  const list = books.map(([code, name]) => { const s = { code, name, chapters: DATA.chapters[code] ?? 0, first }; first += s.chapters; return s; });
  return { segments: list, total: first };
}

function placed(at: string, kind: MarkKind, id: string, label: string, open: string, chapterOnly?: number): Mark | null {
  const ref = REFS.get(at);
  if (!ref && chapterOnly === undefined) return null;
  return { id, kind, at, chapter: chapterOnly ?? ref!.chapter, label, open };
}

/** Where each criterion is first argued from: a reference its own `theyHold` names (tested). Vocabulary and style has none. */
export const CRITERION_AT: Record<string, string> = { names: "Exodus 6:3", doublets: "Genesis 12:10–20", worship: "Deuteronomy 12" };
export const DANIEL_SELF = ["Daniel 7:2", "Daniel 8:1", "Daniel 9:2", "Daniel 10:2"];

function fiveBooks(): Ruler {
  const p = R.pentateuch;
  const marks = [
    ...p.selfWitness.map((w, i) => placed(w.verse, "self", `self-${i}`, w.verse, `self:${i}`)),
    ...p.laterHand.map((h) => placed(h.verses[0], "later", `later-${h.id}`, h.head, `later:${h.id}`)),
    ...R.documentary.criteria.filter((c) => CRITERION_AT[c.id]).map((c) => placed(CRITERION_AT[c.id], "divide", `divide-${c.id}`, c.head, `crit:${c.id}`)),
  ];
  return { id: "five", name: "The five books", ...segments([["GEN", "Genesis"], ["EXO", "Exodus"], ["LEV", "Leviticus"], ["NUM", "Numbers"], ["DEU", "Deuteronomy"]]), marks: marks.filter((m): m is Mark => m !== null) };
}

function isaiah(): Ruler {
  const marks = [
    placed("Isaiah 1:1", "self", "self-heading", "Isaiah 1:1, the heading", "v:Isaiah 1:1"),
    ...R.isaiah.lines.map((l, i) => placed(l.verse, "self", `line-${i}`, l.verse, `line:${i}`)),
    placed("Isaiah 40", "divide", "divide-40", "Chapter 40: a second writer proposed", "isa:case"),
    placed("Isaiah 56", "divide", "divide-56", "Chapter 56: a third writer proposed", "isa:case", 56),
  ];
  return { id: "isaiah", name: "Isaiah", ...segments([["ISA", "Isaiah"]]), marks: marks.filter((m): m is Mark => m !== null) };
}

function daniel(): Ruler {
  const marks = [
    ...DANIEL_SELF.map((at) => placed(at, "self", `self-${at.slice(7)}`, `${at}: “I, Daniel”`, `v:${at}`)),
    placed("Daniel 3", "later", "later-language", "Chapter 3: Greek instrument names, argued as late", "dan:language"),
    placed("Daniel 11:3–35", "later", "later-detail", "Chapter 11: the detail said to sharpen near 167 BC", "view:late"),
    placed("Daniel 7", "divide", "divide-7", "Chapter 7: the visions held to be written in the crisis", "view:late", 7),
  ];
  return { id: "daniel", name: "Daniel", ...segments([["DAN", "Daniel"]]), marks: marks.filter((m): m is Mark => m !== null),
    band: { from: 2, to: 7, label: "Aramaic, 2:4 to 7:28" } };
}

export const RULERS = new Map<string, Ruler>([["five", fiveBooks()], ["isaiah", isaiah()], ["daniel", daniel()]]);
export const DEFAULT_BOOK = "five";
export const markX = (ruler: Ruler, code: string, chapter: number): number => {
  const segment = ruler.segments.find((s) => s.code === code) ?? ruler.segments[0];
  return (segment.first + chapter - 0.5) / ruler.total;
};
export const markCode = (ruler: Ruler, mark: Mark): string => REFS.get(mark.at)?.code ?? ruler.segments[0].code;

// What the sheet can open. Keys are the address's `open` values; anything else opens nothing.
export type Opened =
  | { kind: "verse"; key: string; ref: Ref }
  | { kind: "self"; label: string; says: string }
  | { kind: "line"; label: string; quote: string; note: string }
  | { kind: "record"; label: string; part: string; record: ThreePart; verses: string[] }
  | { kind: "criterion"; criterion: Criterion }
  | { kind: "dateView"; view: DateView };

function openables(): Map<string, Opened> {
  const map = new Map<string, Opened>();
  for (const [key, ref] of REFS) map.set(`v:${key}`, { kind: "verse", key, ref });
  R.pentateuch.selfWitness.forEach((w, i) => map.set(`self:${i}`, { kind: "self", label: w.verse, says: w.says }));
  R.isaiah.lines.forEach((l, i) => map.set(`line:${i}`, { kind: "line", label: l.verse, quote: l.quote, note: l.note }));
  for (const h of R.pentateuch.laterHand) map.set(`later:${h.id}`, { kind: "record", label: "A later hand · the five books", part: "pentateuch", record: h, verses: h.verses });
  for (const e of R.isaiah.evidence) map.set(`isa:${e.id}`, { kind: "record", label: "Evidence · Isaiah", part: "isaiah", record: e, verses: [] });
  for (const e of R.daniel.evidence) map.set(`dan:${e.id}`, { kind: "record", label: "Evidence · Daniel", part: "daniel", record: e, verses: [] });
  for (const c of R.documentary.criteria) map.set(`crit:${c.id}`, { kind: "criterion", criterion: c });
  for (const v of R.daniel.views) map.set(`view:${v.id}`, { kind: "dateView", view: v });
  return map;
}
export const OPENABLE = openables();
export const findOpened = (value: string | null): Opened | null => (value ? OPENABLE.get(value) ?? null : null);
export const findRuler = (value: string | null): Ruler => RULERS.get(value ?? "") ?? RULERS.get(DEFAULT_BOOK)!;

// The table: English order is the record's; Hebrew order is that of most printed Hebrew Bibles, as the record's own note gives it.
export const HEBREW_ORDER = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "1 and 2 Samuel", "1 and 2 Kings", "Isaiah", "Jeremiah",
  "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Psalms", "Proverbs", "Job",
  "Song of Songs", "Ruth", "Lamentations", "Ecclesiastes", "Esther", "Daniel", "Ezra", "Nehemiah", "1 and 2 Chronicles"];
export type Order = "english" | "hebrew";
export const findOrder = (value: string | null): Order => (value === "hebrew" ? "hebrew" : "english");
export const rowSlug = (book: string): string => book.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const ROWS = new Map(R.table.rows.map((row) => [rowSlug(row.book), row]));
export const findRow = (value: string | null): TableRow | null => (value ? ROWS.get(value) ?? null : null);
export function orderedRows(order: Order): TableRow[] {
  if (order === "english") return R.table.rows;
  const place = new Map(HEBREW_ORDER.map((book, i) => [book, i]));
  return [...R.table.rows].sort((a, b) => (place.get(a.book) ?? 99) - (place.get(b.book) ?? 99));
}
export const booksCovered = (rows: TableRow[]): number => rows.reduce((n, row) => n + (row.book.startsWith("1 and 2 ") ? 2 : 1), 0);

export const sourceById = new Map(R.sources.map((s) => [s.id, s]));
const READ_TAG: Record<string, string> = { read: "read", carried: "carried from another study", "second-hand": "reported second-hand", located: "located, not read" };
export const readingTag = (status: string): string => READ_TAG[status] ?? "status not given";
