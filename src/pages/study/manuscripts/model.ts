// What every section of the Manuscripts page shares (approved mock-up: design/manuscripts-directions/js/core.js): the kinds
// of witness with their colours, look-ups into the collection, and the words for dates, books and holders.
import type { CSSProperties } from "react";
import type { ManuscriptCollection, MsHolder, MsRecord } from "@/lib/manuscripts";

export interface Kind { key: string; label: string; tone: string; glyph: GlyphName; group: string; line: string }
export type GlyphName = "fragment" | "codex" | "hand" | "lectern" | "scroll" | "tongue";

/** One entry per kind of witness: label, the site colour it is drawn in, a glyph, and a plain line. */
export const KINDS: Kind[] = [
  { key: "papyrus", label: "Papyri", tone: "--history", glyph: "fragment", group: "Greek New Testament", line: "Greek New Testament on papyrus" },
  { key: "majuscule", label: "Majuscules", tone: "--prophets", glyph: "codex", group: "Greek New Testament", line: "Greek New Testament in capital letters, on parchment" },
  { key: "minuscule", label: "Minuscules", tone: "--gospels", glyph: "hand", group: "Greek New Testament", line: "Greek New Testament in a joined, small hand" },
  { key: "lectionary", label: "Lectionaries", tone: "--acts", glyph: "lectern", group: "Greek New Testament", line: "Readings arranged for the church year" },
  { key: "lxx", label: "Greek Old Testament", tone: "--epistles", glyph: "codex", group: "Greek Old Testament", line: "Septuagint manuscripts, by their Rahlfs number" },
  { key: "dss", label: "Judaean Desert scrolls", tone: "--poetry", glyph: "scroll", group: "Hebrew Bible", line: "From Qumran, Masada and the caves nearby" },
  { key: "hebrew", label: "Hebrew Bible", tone: "--revelation", glyph: "codex", group: "Hebrew Bible", line: "The Masoretic codices and the Nash Papyrus" },
  { key: "latin", label: "Latin", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Old Latin and Vulgate" },
  { key: "syriac", label: "Syriac", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Old Syriac and Peshitta gospels" },
  { key: "coptic", label: "Coptic", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Egypt's own language, in Greek letters" },
  { key: "gothic", label: "Gothic", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Wulfila's translation" },
  { key: "armenian", label: "Armenian", tone: "--accent", glyph: "tongue", group: "Early translations", line: "" },
  { key: "georgian", label: "Georgian", tone: "--accent", glyph: "tongue", group: "Early translations", line: "" },
  { key: "geez", label: "Ge'ez", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Ethiopia's ancient language" },
  { key: "arabic", label: "Arabic", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Christian and Judaeo-Arabic translations" },
  { key: "slavonic", label: "Church Slavonic", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Gospels, Psalters and Apostols of the Slavs" },
  { key: "samaritan", label: "Samaritan", tone: "--revelation", glyph: "codex", group: "Hebrew Bible", line: "The Samaritan Pentateuch" },
];
const KIND_BY_KEY = new Map(KINDS.map((k) => [k.key, k]));

/** The kind a record is filed under; a key the page does not know is a data fault worth stopping on. */
export function kindOf(key: string): Kind {
  const kind = KIND_BY_KEY.get(key);
  if (!kind) throw new Error(`Manuscripts: a record is filed under kind "${key}", which KINDS does not list`);
  return kind;
}

/** "--tone: var(--history)" as a style object. */
export const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;

/** "1,228": the site's number format. */
export const formatNumber = (n: number) => n.toLocaleString("en-GB");
export const plural = (n: number, word: string, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/** A dated record's midpoint; only call on a record that has "e" and "l". */
export const mid = (r: MsRecord) => ((r.e ?? 0) + (r.l ?? 0)) / 2;
export const isDated = (r: MsRecord): r is MsRecord & { e: number; l: number } => r.e !== undefined && r.l !== undefined;
/** A year as words, as the mock-up wrote them: a negative year counts astronomically (-1 is 2 BC). */
export const yearText = (y: number) => (y < 0 ? `${-y + 1} BC` : y < 400 ? `AD ${y}` : String(y));
/** The siglum, when the name does not already say it. */
export const sigla = (r: MsRecord) => (r.g && r.g !== r.n && !r.n.endsWith(` ${r.g}`) && !r.n.endsWith(` ${r.g.replace(/^P/, "")}`) ? r.g : "");
/** Names in natural order ("P2" before "P10"). One shared collator: passing options to localeCompare rebuilt it on every
 *  comparison, which made sorting the collection a visible pause. Same order either way. */
export const byName = new Intl.Collator("en", { numeric: true }).compare;
/** Oldest first; undated records last, by name. */
export const byDate = (a: MsRecord, b: MsRecord) =>
  (isDated(a) ? 0 : 1) - (isDated(b) ? 0 : 1) || (isDated(a) && isDated(b) ? mid(a) - mid(b) : 0) || byName(a.n, b.n);

/** Look-ups built once per collection. */
export interface MsIndex {
  data: ManuscriptCollection;
  byId: Map<string, MsRecord>;
  holderById: Map<string, MsHolder>;
}
export function buildIndex(data: ManuscriptCollection): MsIndex {
  return { data, byId: new Map(data.records.map((r) => [r.i, r])), holderById: new Map(data.holders.map((h) => [h.id, h])) };
}

/** The books a record holds, as a short phrase: whole groups by their names, single books by theirs. */
export function booksText(index: MsIndex, r: MsRecord): string {
  if (!r.b?.length) return "";
  const { books, groups } = index.data;
  const set = new Set(r.b), named: string[] = [];
  const whole = (list: number[]) => list.every((b) => set.has(b));
  const OT = [...Array(39).keys()], NT = [...Array(27).keys()].map((i) => i + 39);
  if (whole(OT)) { named.push("the whole Old Testament"); OT.forEach((b) => set.delete(b)); }
  if (whole(NT)) { named.push("the whole New Testament"); NT.forEach((b) => set.delete(b)); }
  for (const [key, label] of [["gospels", "the four Gospels"], ["paul", "Paul's letters and Hebrews"], ["catholic", "the general letters"]] as const) {
    if (whole(groups[key])) { named.push(label); groups[key].forEach((b) => set.delete(b)); }
  }
  const rest = [...set].sort((a, b) => a - b).map((b) => books[b].name);
  const all = [...named, ...rest];
  return all.length > 6 ? `${all.slice(0, 5).join(", ")} and ${all.length - 5} more` : all.length > 1 ? `${all.slice(0, -1).join(", ")} and ${all.at(-1)}` : all[0];
}

/** Where a record is kept now: its placed holders, else the catalogue's own words. */
export function holderText(index: MsIndex, r: MsRecord): string {
  if (!r.h?.length) return r.hr ?? "";
  return r.h.map((id) => {
    const h = index.holderById.get(id);
    if (!h) throw new Error(`Manuscripts: record ${r.i} names holder "${id}", which the holder table does not list`);
    return `${h.name}, ${h.city}`;
  }).join("; ");
}

/** "1–3, 5" from a sorted list of chapters. */
export function ranges(list: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < list.length; i++) {
    let j = i;
    while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
    out.push(i === j ? `${list[i]}` : `${list[i]}–${list[j]}`);
    i = j;
  }
  return out.join(", ");
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
