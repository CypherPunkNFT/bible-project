// The five citation styles, each a list of entries (a works-cited line, the first and later citations in the text, a
// note…) built from a parsed reference (parse.ts) and a version from the catalogue. An entry is a list of runs so the
// page can show titles in italics and copy them in italics too. The forms and the sources behind them: README.md.
import { languageName } from "@/lib/languages";
import type { Translation } from "@/lib/types";
import { apaOriginal, bookLabel, mlaDate, type BookStyle } from "./abbreviations";
import type { Passage, Reference } from "./parse";

export type StyleId = "mla" | "apa" | "chicago" | "turabian" | "sbl";

export const STYLES: readonly { id: StyleId; name: string; edition: string }[] = [
  { id: "mla", name: "MLA", edition: "MLA Handbook, 9th edition" },
  { id: "apa", name: "APA", edition: "APA Publication Manual, 7th edition" },
  { id: "chicago", name: "Chicago", edition: "Chicago Manual of Style, notes and bibliography" },
  { id: "turabian", name: "Turabian", edition: "Turabian, A Manual for Writers, 9th edition" },
  { id: "sbl", name: "SBL", edition: "SBL Handbook of Style, 2nd edition" },
];

/** A piece of a citation: plain text, or a title in italics. */
export type Run = string | { italic: string };

export interface Entry { key: string; label: string; runs: Run[]; hint?: string }

/** A printed Bible's details, when the visitor read one rather than the site. Empty fields are left out. */
export interface PrintedBible { publisher: string; place: string; year: string }

/** The address a reference entry gives for the Bible read on this site (the reader, where every version opens). */
export const SITE_NAME = "Bible Guide";
export const SITE_URL = "https://bibleguide.io/read";

/** Versions dated before this are older works republished on the site: APA adds "Original work published". */
const MODERN_FROM = 1950;

const ENGLISH = new Set(["en", "enm"]);

/** What the styles need to know about a version. */
export function versionFacts(version: Translation) {
  const english = ENGLISH.has(version.lang);
  // "Reina-Valera 1909 (Spanish)": the language in brackets is the site's label, not part of the title.
  const title = english ? version.name : version.name.replace(/\s*\([^)]*\)\s*$/, "");
  return {
    title,
    // Only the English versions' short names are ones readers know; any other version is named in full.
    short: english ? version.abbr : title,
    year: version.year,
    older: version.year < MODERN_FROM,
    language: english ? null : languageName(version.lang),
  };
}

interface Marks { joiner: string; dash: string; book: BookStyle }
const MARKS: Record<StyleId, Marks> = {
  mla: { joiner: ".", dash: "-", book: "mla" },
  apa: { joiner: ":", dash: "–", book: "full" },
  chicago: { joiner: ":", dash: "–", book: "chicago" },
  turabian: { joiner: ":", dash: "–", book: "chicago" },
  sbl: { joiner: ":", dash: "–", book: "sbl" },
};

/** "3:16", "3:16–18", "3:16–4:2", "23", "1–3"; a one-chapter book gives verses only. */
function passageText(p: Passage, marks: Marks, singleChapter: boolean): string {
  const { joiner, dash } = marks;
  if (singleChapter) return p.verse === null ? "" : p.endVerse !== p.verse ? `${p.verse}${dash}${p.endVerse}` : `${p.verse}`;
  if (p.verse === null) return p.endChapter !== p.chapter ? `${p.chapter}${dash}${p.endChapter}` : `${p.chapter}`;
  const start = `${p.chapter}${joiner}${p.verse}`;
  if (p.endChapter !== p.chapter) return `${start}${dash}${p.endChapter}${joiner}${p.endVerse}`;
  return p.endVerse !== p.verse ? `${start}${dash}${p.endVerse}` : start;
}

/** The whole reference in a style: "1 Cor. 13:4–7, 13", "Pss 23; 91:1–4", "Jude 3", "Ps 151:1–7". */
export function formatReference(reference: Reference, style: StyleId): string {
  const marks = MARKS[style];
  const { passages, singleChapter, code, name } = reference;
  const chapters = new Set(passages.flatMap((p) => [p.chapter, p.endChapter]));
  const book = bookLabel(code, name, marks.book, code === "PSA" && chapters.size > 1);
  let text = "";
  passages.forEach((p, i) => {
    const prev = passages[i - 1];
    const sameChapter = prev && prev.verse !== null && p.verse !== null && p.chapter === prev.endChapter && p.endChapter === p.chapter;
    const part = sameChapter ? passageText(p, marks, true) : passageText(p, marks, singleChapter);
    text += i === 0 ? part : sameChapter || singleChapter ? `, ${part}` : `; ${part}`;
  });
  if (!text) return book;
  // Psalm 151 is a book named with a number, so its verses follow a colon (a full stop in MLA): "Ps 151:1–7".
  return `${book}${code === "PS2" ? marks.joiner : " "}${text}`;
}

const filled = (printed?: PrintedBible) => {
  const clean = { publisher: printed?.publisher.trim() ?? "", place: printed?.place.trim() ?? "", year: printed?.year.trim() ?? "" };
  return clean.publisher || clean.year ? clean : null;
};

/** The entries for one style. `today` dates MLA's "Accessed". */
export function citeIn(style: StyleId, reference: Reference, version: Translation, printed: PrintedBible | undefined, today: Date): Entry[] {
  const facts = versionFacts(version);
  const passage = formatReference(reference, style);
  const print = filled(printed);
  const title: Run = { italic: facts.title };
  switch (style) {
    case "mla": {
      const works: Run[] = print
        ? [title, `. ${facts.older ? `${facts.year}. ` : ""}${[print.publisher, print.year].filter(Boolean).join(", ")}.`]
        : [title, `. ${facts.year}. `, { italic: SITE_NAME }, `, ${SITE_URL.replace(/^https:\/\//, "")}. Accessed ${mlaDate(today)}.`];
      return [
        { key: "works", label: "Works Cited", runs: works },
        { key: "first", label: "In the text, the first time", runs: ["(", title, `, ${passage})`] },
        { key: "later", label: "In the text, after that", runs: [`(${passage})`], hint: "Name the version again only if you change to another one." },
      ];
    }
    case "apa": {
      const date = print ? print.year || "n.d." : facts.older ? "n.d." : `${facts.year}`;
      const source = print ? (print.publisher ? ` ${print.publisher}.` : "") : ` ${SITE_NAME}. ${SITE_URL}`;
      const original = facts.older ? ` ${apaOriginal(facts.year)}` : "";
      const translated = facts.language ? ` [${facts.language} Bible]` : "";
      const inText = facts.older ? `${facts.year}/${date}` : date;
      return [
        { key: "reference", label: "Reference list", runs: [title, `${translated}. (${date}).${source}${original}`] },
        { key: "in-text", label: "In the text, every time", runs: ["(", title, `, ${inText}, ${passage})`] },
      ];
    }
    case "chicago":
    case "turabian": {
      const named = style === "turabian" ? facts.title : facts.short;
      const bibliography: Run[] = print
        ? [title, `. ${print.place ? `${print.place}: ` : ""}${[print.publisher, print.year].filter(Boolean).join(", ")}.`]
        : [title, `. ${facts.year}. ${SITE_NAME}. ${SITE_URL}.`];
      return [
        { key: "first-note", label: "First note", runs: [`${passage} (${named}).`] },
        { key: "later-notes", label: "Later notes", runs: [`${passage}.`] },
        { key: "in-text", label: "In the text (author-date)", runs: [`(${passage} ${facts.short})`] },
        { key: "bibliography", label: "Bibliography", runs: bibliography, hint: "Usually left out: both manuals say the Bible need not be listed. Add it if your teacher asks." },
      ];
    }
    case "sbl": {
      const once = facts.short === facts.title ? facts.title : `${facts.title} (${facts.short})`;
      return [
        { key: "statement", label: "Say once, in your first note or preface", runs: [`Unless otherwise noted, Scripture quotations are from the ${once}.`] },
        { key: "note", label: "Note", runs: [`${passage}.`] },
        { key: "in-text", label: "In the text", runs: [`(${passage})`] },
        { key: "other-version", label: "When you quote another version beside it", runs: [`(${passage} ${facts.short})`], hint: "Name the version this way only when it differs from the one you said you use." },
      ];
    }
  }
}

/** A citation as plain text, for copying where italics cannot go. */
export const plainText = (runs: readonly Run[]) => runs.map((run) => (typeof run === "string" ? run : run.italic)).join("");

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** A citation as HTML, so a word processor keeps the italics. */
export const htmlText = (runs: readonly Run[]) => runs.map((run) => (typeof run === "string" ? escapeHtml(run) : `<i>${escapeHtml(run.italic)}</i>`)).join("");
