// Verse completion: the three word buttons of Pick at Hard (design §5.1, "word by word"). Chosen in the browser from
// words already loaded, with a generator seeded by the round and the passage, so a reload offers the same buttons.
import { differsByEnding } from "./match.ts";
import { equivalent } from "./equivalents.ts";
import { hashString, seeded, shuffle } from "./model.ts";
import type { Word } from "./words.ts";

/** A word as a button shows it: no punctuation, so no option gives itself away by its comma or quote. */
export const bareWord = (word: Word): string => word.text.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}’']+$/u, "").replace(/[’']$/, "");

const capitalised = (text: string) => /^\p{Lu}/u.test(text);

/** The right word's capitalisation on every option, so the capital is never the clue. */
function styled(option: string, right: string): string {
  if (/^\p{Lu}{2,}$/u.test(right) || capitalised(option) === capitalised(right)) return option;
  return capitalised(right) ? option.charAt(0).toUpperCase() + option.slice(1) : option.charAt(0).toLowerCase() + option.slice(1);
}

export interface WordChoice { options: string[]; right: number }

/**
 * The options for hidden word `index` of `hidden`: the right word and two others, in a seeded order. The others come
 * first from the next four hidden words, then from the decoy passages, then from the book. Never the same word, never
 * a word differing only by its ending, never one option twice. Null when two such words cannot be found (§10.7).
 */
export function wordChoices(hidden: readonly Word[], index: number, sources: { decoys: readonly Word[]; book: readonly Word[] }, seed: number, passageId: string): WordChoice | null {
  const right = hidden[index];
  const rightKey = equivalent(right.key);
  const rightText = bareWord(right);
  const random = seeded(seed ^ hashString(`${passageId}:${index}`));
  const taken = new Set([rightKey]);
  const fits = (word: Word) => {
    const key = equivalent(word.key);
    return key.length > 0 && !taken.has(key) && !differsByEnding(key, rightKey);
  };
  const similar = (word: Word) => capitalised(bareWord(word)) === capitalised(rightText) && Math.abs(word.key.length - right.key.length) <= 2;
  const picked: string[] = [];
  const take = (word: Word) => { taken.add(equivalent(word.key)); picked.push(styled(bareWord(word), rightText)); };
  const later = hidden.slice(index + 1, index + 5).filter(fits);
  if (later.length) take(later[Math.floor(random() * later.length)]);
  for (const pool of [sources.decoys, sources.book]) {
    for (const strict of [true, false]) { // the length and capital preferences relax; the exclusions never do
      const candidates = shuffle(pool.filter((word) => fits(word) && (!strict || similar(word))), random);
      while (picked.length < 2 && candidates.length) {
        const word = candidates.shift()!;
        if (fits(word)) take(word);
      }
    }
  }
  if (picked.length < 2) return null;
  const options = shuffle([rightText, ...picked], random);
  return { options, right: options.indexOf(rightText) };
}
