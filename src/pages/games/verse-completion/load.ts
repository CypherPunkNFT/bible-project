// Verse completion: loading what a card needs (design §4.4). The pool holds ids only; the words come from the site's
// own BSB book files through the verse resolver, each book fetched once per session.
import { loadPlain } from "@/lib/data";
import { bookByNum, splitId } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { resolveRange } from "@/lib/verses";
import type { Passage, Pool } from "./model";
import { joinVerses } from "./passage";
import { words, type Word } from "./words";

const TEXTS = new Map<string, Promise<string>>();

/** A passage's BSB text, as the build counted it. A verse the BSB lacks makes the load fail (§10.7). */
export function passageText(catalog: Catalog, passage: Passage): Promise<string> {
  let text = TEXTS.get(passage.id);
  if (!text) {
    text = resolveRange(catalog, passage.from, passage.to, "bsb").then((resolved) => {
      const missing = resolved.verses.find((verse) => verse.text === null);
      if (missing) throw new Error(`Verse completion: the BSB file has no verse ${missing.id} for ${passage.id}`);
      return joinVerses(resolved.verses.map((verse) => verse.text!));
    });
    text.catch(() => TEXTS.delete(passage.id)); // a failed load is tried again on "Try again"
    TEXTS.set(passage.id, text);
  }
  return text;
}

/** Every word of the passage's book, for word-by-word picking when the decoys run short (§5.1). */
export async function bookWords(catalog: Catalog, passage: Passage): Promise<Word[]> {
  const code = bookByNum(catalog, splitId(passage.from).num)?.code;
  if (!code) return [];
  const plain = await loadPlain("bsb", code);
  return Object.values(plain).slice(0, 400).flatMap((text) => words(text));
}

/** Load the round's passages one after another in the background, so later cards are ready in turn. */
export function preload(catalog: Catalog, pool: ReadonlyMap<string, Passage>, ids: readonly string[]): void {
  ids.reduce<Promise<unknown>>((chain, id) => {
    const passage = pool.get(id);
    return passage ? chain.then(() => passageText(catalog, passage).catch((error) => console.warn("Verse completion: a verse did not preload:", error))) : chain;
  }, Promise.resolve());
}

let poolPromise: Promise<Pool> | null = null;

/** The generated pool (ids and numbers only), imported only on this page. */
export function loadPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = import("@/data/verse-completion/pool.json").then((module) => module.default as unknown as Pool);
    poolPromise.catch(() => { poolPromise = null; });
  }
  return poolPromise;
}

let vocabularyPromise: Promise<ReadonlySet<string>> | null = null;

/** The BSB's distinct words, loaded only when Type with whole words is played (§6.3 rule c). */
export function loadVocabulary(): Promise<ReadonlySet<string>> {
  if (!vocabularyPromise) {
    vocabularyPromise = import("@/data/verse-completion/vocabulary.json").then((module) => new Set(module.default as unknown as string[]));
    vocabularyPromise.catch(() => { vocabularyPromise = null; });
  }
  return vocabularyPromise;
}

/** The reader with the passage shaded, for "Read in context" (§10.3). */
export function contextHref(catalog: Catalog, passage: Passage): string {
  const from = splitId(passage.from);
  const to = splitId(passage.to);
  const code = bookByNum(catalog, from.num)?.code ?? "";
  return `/read/bsb/${code}/${from.chapter}?hl=${from.verse}-${to.verse}`;
}
