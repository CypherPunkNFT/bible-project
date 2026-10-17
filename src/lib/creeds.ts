/**
 * The Catechisms & Creeds data, as written by scripts/build-creeds.py.
 *
 * A document's prose is already what should be published: where the research corpus could restate a
 * quoted verse in the Berean Standard Bible it did, and where it could not the document keeps its own
 * older wording. This module only describes the shape and reads the labels out in plain English.
 */

export interface CreedScripture {
  title?: string | null;
  abbreviation?: string | null;
  licence?: string | null;
  home?: string | null;
  distribution?: string | null;
}

export interface CreedCard {
  id: string;
  title: string;
  year: number | null;
  yearLabel: string;
  tradition: string | null;
  documentType: string | null;
  sections: number;
  references: number;
  quotations: number;
  publisher: string | null;
  otherEdition?: string;
}

export interface CreedFamily {
  id: string;
  title: string;
  lead: string;
  art: string;
  tone: string;
  span: string;
  documents: CreedCard[];
}

export interface CreedsIndex {
  schema: string;
  built: string;
  scripture: CreedScripture;
  counts: {
    documents: number;
    families: number;
    sections: number;
    references: number;
    quotations: number;
    unrestated: number;
    referenceOnly: number;
    catechisms: number;
  };
  sources: { slug: string; title: string; publisher: string | null; url: string; licence: string; attribution: string | null }[];
  families: CreedFamily[];
}

export interface CreedPart {
  id: string;
  label: string;
  from: number;
  to: number;
  sections: number;
  bundle: string;
}

export interface CreedReference {
  reference: string;
  osis: string;
  span?: [number, number];
  verses?: number[];
  more?: boolean;
  note?: string;
}

export interface CreedProof {
  marker: string;
  references: CreedReference[];
}

export interface CreedSection {
  id: string;
  kind: string | null;
  number: string | null;
  depth: number;
  heading?: string;
  question?: string;
  text?: string;
  restated?: string[];
  unrestated?: { reference: string; reason: string }[];
  proofs?: CreedProof[];
  parallel?: Record<string, string>;
  passageReference?: string;
}

export interface CreedDocument {
  schema: string;
  id: string;
  title: string;
  year: number | null;
  yearLabel: string;
  tradition: string | null;
  documentType: string | null;
  counts: { sections: number; references: number; quotations: number; unrestated: number; referenceOnly: number };
  source: {
    title: string | null;
    publisher: string | null;
    url: string | null;
    licence: string | null;
    attribution: string | null;
    retrieved: string | null;
  };
  scripture: CreedScripture;
  parts: CreedPart[];
  bundles: { id: string; from: number; to: number }[];
  alternativeTitles?: string[];
  authors?: string[];
  location?: string;
  originalLanguage?: string;
  originStory?: string;
  note?: string;
  modernLayerOnly?: boolean;
  otherEdition?: string;
}

export interface CreedBundle {
  id: string;
  bundle: string;
  sections: CreedSection[];
  verses: Record<string, string>;
}

/** "catechism" -> "Catechism", for the eyebrow line above a document's title. */
export function documentTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "catechism":
      return "Catechism";
    case "confession":
      return "Confession";
    case "creed":
      return "Creed";
    case "articles":
      return "Articles of religion";
    case "canons":
      return "Canons and decrees";
    case "rule-of-faith":
      return "Rule of faith";
    case "declaration":
      return "Declaration";
    default:
      return "Document";
  }
}

/** What a section is called where it needs a word: a question, an article, a canon. */
export function sectionKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case "question":
      return "Question";
    case "sub-question":
      return "Question";
    case "article":
      return "Article";
    case "canon":
      return "Canon";
    case "decree":
      return "Decree";
    case "section":
      return "Section";
    default:
      return "";
  }
}

/**
 * Why a quotation the document makes was left in its own older wording. The research layer recorded a
 * reason for every place it declined to act; these are those reasons in plain words, and each one is
 * the page's answer to "why is this sentence not in the Berean text like the others?".
 */
export function unrestatedReason(code: string): string {
  switch (code) {
    case "partial":
      return "part of the verse is quoted, and the matching Berean words could not be bracketed without guessing";
    case "loose":
      return "the wording is close to the verse without reproducing it";
    case "short":
      return "the quotation is too short to be sure the verse is quoted rather than echoed";
    case "overlap":
      return "two references claimed the same words";
    case "uncited":
      return "Scripture is quoted with no reference given, and it matches more than one place equally well";
    case "several":
      return "several references are given, and which one is quoted is a judgement";
    default:
      return "the Berean wording could not be settled without guessing";
  }
}

/** A verse id (BBCCCVVV) as the label a reader expects beside the words: "16" or "3:16". */
export function verseLabel(id: number, span: [number, number] | undefined): string {
  const chapter = Math.floor(id / 1000) % 1000;
  const verse = id % 1000;
  if (!span) return `${chapter}:${verse}`;
  const sameChapter = Math.floor(span[0] / 1000) === Math.floor(span[1] / 1000);
  return sameChapter ? String(verse) : `${chapter}:${verse}`;
}

/** Find a document's card in the index, so a page only ever loads an id the index knows. */
export function findCard(index: CreedsIndex, id: string): { card: CreedCard; family: CreedFamily } | undefined {
  for (const family of index.families) {
    const card = family.documents.find((document) => document.id === id);
    if (card) return { card, family };
  }
  return undefined;
}

/** The part a section index falls in, for the contents rail and the "where am I" line. */
export function partAt(parts: CreedPart[], index: number): CreedPart | undefined {
  return parts.find((part) => index >= part.from && index <= part.to);
}
