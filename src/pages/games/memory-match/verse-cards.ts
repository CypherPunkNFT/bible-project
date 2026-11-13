// Memory card match, Verses version: the shipped file holds verse ids and split points only (the site keeps no verse
// wording in its data), so the cards' words are looked up in the BSB when a board is dealt, for that board's verses
// alone. The split must match the build's (scripts/memory-match/mm_verses.py, verse_words): the cleaned verse without
// double quotation marks, an opening single mark or a closing single mark after punctuation, cut into words at single
// spaces. verse-cards.test.ts checks every shipped verse against the build's limits.
import type { Catalog } from "@/lib/types";
import { resolveVerses } from "@/lib/verses";
import type { DeckInfo, PairInfo, PairsFile } from "./deal";

export interface VerseRow {
  id: string;
  verseId: number;
  /** The word the second card starts at. */
  split: number;
  tier: 1 | 2 | 3;
  decks: string[];
  ref: string;
  readerHref: string;
  words: string[];
  notWith: string[];
  notOnHard?: boolean;
}

export interface VersesFile { about: string; version: number; stamp: string; decks: DeckInfo[]; verses: VerseRow[] }

/** The verse's words as the cards split them. `text` is already cleaned by src/lib/verses.ts. */
export function verseWords(text: string): string[] {
  return text.replace(/([.,!?;:—])’/g, "$1").replace(/[“”"‘]/g, "").replace(/\s+/g, " ").trim().split(" ");
}

/** The two cards' words: the first ends with an ellipsis and the second opens with one, so each reads as half. */
export function verseHalves(text: string, split: number): [string, string] {
  const words = verseWords(text);
  const at = split > 0 && split < words.length ? split : Math.ceil(words.length / 2); // a changed text still splits
  return [`${words.slice(0, at).join(" ")} …`, `… ${words.slice(at).join(" ")}`];
}

/** The verses as a pairs file the game draws from; the card words stay empty until withVerseText fills a board's. */
export function versesAsPairs(file: VersesFile): PairsFile {
  const pairs: PairInfo[] = file.verses.map((row) => ({
    id: row.id, who: row.id, story: "", tier: row.tier, decks: row.decks, ref: row.ref, readerHref: row.readerHref,
    keyVerse: row.ref, keyVerseId: row.verseId, words: row.words, notWith: row.notWith, notOnHard: row.notOnHard,
    split: row.split,
  }));
  const characters = Object.fromEntries(file.verses.map((row) => [row.id, { label: "", href: null, first: row.id }]));
  return { about: file.about, version: file.version, stamp: file.stamp, decks: file.decks, characters, pairs };
}

/** The pairs file with these verses' words filled in from the BSB. Fails if the BSB has no text for one of them. */
export async function withVerseText(catalog: Catalog, data: PairsFile, ids: readonly string[]): Promise<PairsFile> {
  const rows = ids.map((id) => {
    const pair = data.pairs.find((p) => p.id === id);
    if (!pair) throw new Error(`memory match: verse ${id} is not in the verses file (stamp ${data.stamp})`);
    return pair;
  });
  const resolved = await resolveVerses(catalog, rows.map((pair) => pair.keyVerseId), "bsb");
  const characters = { ...data.characters };
  const filled = new Map<string, string>();
  rows.forEach((pair, n) => {
    const text = resolved.verses[n].text;
    if (text === null) throw new Error(`memory match: the BSB has no text for ${pair.ref} (verse ${pair.keyVerseId})`);
    const [first, second] = verseHalves(text, pair.split ?? 0);
    characters[pair.who] = { ...characters[pair.who], label: first };
    filled.set(pair.id, second);
  });
  return { ...data, characters, pairs: data.pairs.map((pair) => (filled.has(pair.id) ? { ...pair, story: filled.get(pair.id)! } : pair)) };
}
