// How the New Testament books were written: the research record, the generated verses, synopsis and table, the address
// values the page accepts, and the small rules its drawings use. Everything the address asks for is looked up in a Map,
// so an unknown value falls back to the default, and nothing here throws while the page loads.
import record from "../../../../content/academic-research/42-how-the-new-testament-books-were-written.json";
import generated from "./nt-books-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

export type Three = { evidence: string; inference: string; limit: string };
export type Layer = { id: string; name: string; note: string };
export type Case = Three & { id: string; title: string; passages: string[] };
export type View = { id: string; name: string; tag: string; history: string; held: string; forIt: string; against: string; wouldShow: string };
export type Witness = Three & { id: string; who: string; when: string; where: string };
export type Gospel = { id: string; name: string; who: string; dateViews: string; note: string };
export type Holder = { who: string; held: string };
export type Stage = { id: string; name: string; years: string; who: string; held: string; note: string };
export type Group = { id: string; name: string; letters: string[]; note: string };
export type Row = { book: string; claims: string; witness: string; date: string; home?: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = Three & { id: string; claim: string; head: string; verses: string[]; sources: string[]; test: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; answers: string; read: string };
export type Answer = { head: string; points: string[]; stance: string };

export const D = record as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  confusedWords: { word: string; note: string }[];
  synoptic: { head: string; lead: string; layers: Layer[]; cases: Case[]; views: View[]; stance: string; verses: string[] };
  witnesses: { head: string; lead: string; records: Witness[]; pattern: string };
  gospels: Gospel[];
  john: { head: string; evidence: string; views: Holder[]; date: string; inference: string; limit: string };
  quest: { head: string; lead: string; stages: Stage[]; answer: Answer };
  acts: { head: string; evidence: string; views: Holder[]; date: string; inference: string; limit: string };
  paul: { head: string; lead: string; groups: Group[]; criticalCase: { head: string; points: string[] }; answer: Answer };
  petrine: { head: string; evidence: string; views: string; limit: string };
  hebrews: { head: string; evidence: string; views: Holder[]; forPaul: string; againstPaul: string; date: string; stance: string };
  revelation: { head: string; evidence: string; views: Holder[]; date: string; limit: string };
  dates: { head: string; note: string };
  referenceTable: Row[]; claims: Claim[];
  stance: { head: string; confession: string; confessionSource: string; body: string; verses: string[] };
  reach: string[]; links: { title: string; kind: string; why: string }[]; sources: Source[];
  verses: { label: string; code: string; chapter: number; verse: number }[]; checkNotes: unknown;
};

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type Word = [string, 0 | 1 | 2] | [string, 0 | 1 | 2, 1];
export type Column = { ref: string; book: string; verses: { label: string; n: number; words: Word[] }[] };
export type Bar = { from: number; to: number; soft: boolean; words: string; side: "evangelical" | "critical" | "one" };
export const NB = generated as unknown as {
  recordHash: string; verses: Record<string, Verse>; refs: Record<string, string[]>;
  synopsis: Record<string, { columns: Column[]; tie: { words: string; note: string } }>;
  table: { book: string; bars: Bar[] }[]; links: Record<string, string>;
  notBerean: { quote: string; ref: string; berean: string; at: string }[];
};

// --- References -------------------------------------------------------------------------------------------------
// The same pattern as scripts/build-nt-books-study.py: longest book names first, so "1 John" is never read as "John".
const BOOK_NAMES = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
const NAMES = [...BOOK_NAMES].sort((a, b) => b.length - a.length).join("|");
const SPAN = String.raw`\d+:\d+(?:–\d+(?::\d+)?)?`;
const LIST = String.raw`${SPAN}(?:, \d+(?:–\d+)?|; ${SPAN})*`;
const REF = new RegExp(String.raw`\b(?:(?:${NAMES}) ${LIST}|(?:Philemon|2 John|3 John|Jude) \d+(?:–\d+)?(?![\d:]))`, "g");
const TABLE_REF = new RegExp(String.raw`\((${LIST}|\d+)\)`, "g");

export type Piece = { text: string; ref?: string };

/** A run of reading text cut into plain words and references the build resolved; `book` reads a table row's bracketed references. */
export function splitRefs(text: string, book?: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  const pattern = book ? TABLE_REF : REF;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    const key = book ? `${book} ${match[1]}` : match[0];
    if (!own(NB.refs, key)) continue;
    const start = book ? at + 1 : at, words = book ? match[1] : match[0];
    if (start > last) pieces.push({ text: text.slice(last, start) });
    pieces.push({ text: words, ref: key });
    last = start + words.length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}

/** Every reference a string holds, as the page reads it; the tests hold this against the build's list. */
export const refsIn = (text: string, book?: string): string[] => splitRefs(plainText(text), book).flatMap((p) => (p.ref ? [p.ref] : []));
export const refsWritten = (text: string, book?: string): string[] =>
  [...plainText(text).matchAll(book ? TABLE_REF : REF)].map((m) => (book ? `${book} ${m[1]}` : m[0]));

/** The verses a reference holds, in order: a single label from the record's list is its own reference. */
export function versesOf(key: string): { label: string; verse: Verse }[] {
  const labels = own(NB.refs, key) ? NB.refs[key] : own(NB.verses, key) ? [key] : [];
  return labels.flatMap((label) => (NB.verses[label] ? [{ label, verse: NB.verses[label] }] : []));
}

/** Every verse on this page opens in the Berean (study rule 3); a run inside one chapter is lit as a run. */
export function readerHref(key: string): string | null {
  const verses = versesOf(key).map((v) => v.verse);
  if (!verses.length) return null;
  const first = verses[0], sameChapter = verses.filter((v) => v.code === first.code && v.chapter === first.chapter);
  return `/read/bsb/${first.code}/${first.chapter}?hl=${first.verse}-${sameChapter[sameChapter.length - 1].verse}`;
}

// --- The address ------------------------------------------------------------------------------------------------
export const DEFAULT_CASE = "paralytic";
export const DEFAULT_LAYER = "triple";
export const DEFAULT_GOSPEL = "mark";
export const DEFAULT_STAGE = "strauss";
export const DEFAULT_LETTER = "peter";

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));
const caseById = byId(D.synoptic.cases);
const layerById = byId(D.synoptic.layers);
const viewById = byId(D.synoptic.views);
const stageById = byId(D.quest.stages);
const claimById = byId(D.claims);
export const witnessById = byId(D.witnesses.records);
export const sourceById = byId(D.sources);

function pick<T>(map: Map<string, T>, value: string | null, fallback: string): T {
  return (value ? map.get(value) : undefined) ?? map.get(fallback)!;
}

export const findCase = (value: string | null): Case => pick(caseById, value, DEFAULT_CASE);
export const findLayer = (value: string | null): Layer => pick(layerById, value, DEFAULT_LAYER);
export const findStage = (value: string | null): Stage => pick(stageById, value, DEFAULT_STAGE);
export const findClaim = (value: string | null): Claim => pick(claimById, value, D.claims[0].id);
/** No map is chosen until the reader chooses one: the page does not rank the four. */
export const findView = (value: string | null): View | null => (value ? viewById.get(value) : undefined) ?? null;

export const BOOK_IDS = ["mark", "matthew", "luke", "john", "acts"] as const;
export type BookId = (typeof BOOK_IDS)[number];
export const findGospel = (value: string | null): BookId => (BOOK_IDS as readonly string[]).includes(value ?? "") ? value as BookId : DEFAULT_GOSPEL;

export const LETTER_IDS = ["peter", "hebrews", "revelation"] as const;
export type LetterId = (typeof LETTER_IDS)[number];
export const findLetter = (value: string | null): LetterId => (LETTER_IDS as readonly string[]).includes(value ?? "") ? value as LetterId : DEFAULT_LETTER;

export const findRow = (value: string | null): string | null => (value && D.referenceTable.some((r) => r.book === value) ? value : null);

const own = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

/** What the sheet holds: a reference's verses or one witness's record. Anything else opens nothing. */
export type Opened = { kind: "verse"; key: string } | { kind: "witness"; witness: Witness };
export function findOpened(value: string | null): Opened | null {
  if (!value) return null;
  if (value.startsWith("verse:")) {
    const key = value.slice(6);
    return own(NB.refs, key) || own(NB.verses, key) ? { kind: "verse", key } : null;
  }
  if (value.startsWith("witness:")) {
    const witness = witnessById.get(value.slice(8));
    return witness ? { kind: "witness", witness } : null;
  }
  return null;
}

// --- The witnesses' chain -----------------------------------------------------------------------------------------
/** A witness whose own work is lost is drawn hollow: the record's `where` says so in words. */
export const isLost = (w: Pick<Witness, "where">): boolean => /\blost\b/i.test(plainText(w.where));
export const viaEusebius = (w: Pick<Witness, "where">): boolean => /Eusebius/.test(plainText(w.where));

// --- Paul's signature and scribe, read from the lead's own clauses ------------------------------------------------
function booksInSentence(text: string, word: RegExp): string[] {
  const sentence = plainText(text).split(/(?<=\.) |(?<=;) (?=[a-z])/).filter((s) => word.test(s)).join(" ");
  return [...new Set(refsWritten(sentence).map((ref) => BOOK_NAMES.find((name) => ref.startsWith(`${name} `)) ?? ""))].filter(Boolean);
}
export const SIGNED = booksInSentence(D.paul.lead, /own hand/);
export const SCRIBED = booksInSentence(D.paul.lead, /scribe/);

// --- The four maps --------------------------------------------------------------------------------------------------
export type MapNode = { id: string; label: string; x: number; y: number; lost?: boolean };
export type MapArrow = { from: string; to: string; spoken?: boolean };
/** Each view's arrows, drawn at one size. An arrow means "was used by", as each view's own tag says; nothing is drawn larger. */
export const MAPS: Record<string, { nodes: MapNode[]; arrows: MapArrow[]; band?: boolean; caption: string }> = {
  "two-source": {
    nodes: [{ id: "mk", label: "Mk", x: 80, y: 26 }, { id: "mt", label: "Mt", x: 28, y: 102 }, { id: "lk", label: "Lk", x: 132, y: 102 }, { id: "q", label: "Q", x: 80, y: 102, lost: true }],
    arrows: [{ from: "mk", to: "mt" }, { from: "mk", to: "lk" }, { from: "q", to: "mt" }, { from: "q", to: "lk" }],
    caption: "Mark to Matthew and to Luke; a lost Q, drawn hollow, to both.",
  },
  farrer: {
    nodes: [{ id: "mk", label: "Mk", x: 80, y: 26 }, { id: "mt", label: "Mt", x: 28, y: 102 }, { id: "lk", label: "Lk", x: 132, y: 102 }],
    arrows: [{ from: "mk", to: "mt" }, { from: "mk", to: "lk" }, { from: "mt", to: "lk" }],
    caption: "Mark to Matthew; Mark and Matthew to Luke. No Q.",
  },
  "matthew-first": {
    nodes: [{ id: "mt", label: "Mt", x: 80, y: 26 }, { id: "lk", label: "Lk", x: 28, y: 102 }, { id: "mk", label: "Mk", x: 132, y: 102 }],
    arrows: [{ from: "mt", to: "lk" }, { from: "mt", to: "mk" }, { from: "lk", to: "mk" }],
    caption: "Drawn as Griesbach's and Farmer's form: Matthew, then Luke, then Mark from both. Augustine's and Wenham's order runs Matthew, Mark, Luke.",
  },
  independence: {
    nodes: [{ id: "mt", label: "Mt", x: 28, y: 102 }, { id: "mk", label: "Mk", x: 80, y: 102 }, { id: "lk", label: "Lk", x: 132, y: 102 }],
    arrows: [{ from: "band", to: "mt", spoken: true }, { from: "band", to: "mk", spoken: true }, { from: "band", to: "lk", spoken: true }],
    band: true,
    caption: "No arrow between the three; each draws on spoken teaching, drawn as a wave.",
  },
};

/** An arrow from one node's edge to the other's, so the head stops at the ring. */
export function arrowPath(from: { x: number; y: number }, to: { x: number; y: number }, radius = 14): string {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length;
  const x1 = from.x + ux * radius, y1 = from.y + uy * radius, x2 = to.x - ux * (radius + 4), y2 = to.y - uy * (radius + 4);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// --- The reference table ------------------------------------------------------------------------------------------
export const AXIS = { from: 40, to: 135, ticks: [40, 50, 60, 70, 80, 90, 100, 110, 120, 130] } as const;
export const axisShare = (year: number): number => (Math.min(AXIS.to, Math.max(AXIS.from, year)) - AXIS.from) / (AXIS.to - AXIS.from);

/** The site's fixed section colours: Gospels & Acts violet, Epistles gold, Revelation rose. */
export function sectionOf(book: string): "gospels" | "epistles" | "revelation" {
  if (["Matthew", "Mark", "Luke", "John", "Acts"].includes(book)) return "gospels";
  return book === "Revelation" ? "revelation" : "epistles";
}

export const SIDE_WORD = { evangelical: "Most often argued by evangelical scholars", critical: "The common critical range", one: "The range given" } as const;

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    case "second-hand": return "reported second-hand";
    default: return "located, not read";
  }
}

export const LINK_HREF = new Map(Object.entries(NB.links));
export const ACADEMIC_BACK = "/study/academic?area=texts";
