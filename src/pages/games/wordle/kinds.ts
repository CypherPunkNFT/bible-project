// Bible Wordle's kinds of word, the start page's cards (owner, 2026-11-13: "make Wordle have categories including
// Mixed ... cards like memory card match"). Mixed is the day's word, one for everyone, exactly as before. Each other
// kind deals as many words as the player likes, one after another: word n of a kind is the same for everyone, taken
// from a fixed shuffle of that kind's words, so no word comes back until the kind has been played through.
import type { Answers } from "./daily";
import type { Category } from "./daily-rules";
import { CATEGORY_HINT } from "./text";

export type Kind = Category | "mixed";

/** The cards in order, each with one of the site's book-colour tones (src/index.css). Under `label:` for translation. */
export const KINDS: readonly { key: Kind; label: string; note: string; tone: string }[] = [
  { key: "person", label: "People", note: CATEGORY_HINT.person.label, tone: "epistles" },
  { key: "place", label: "Places", note: CATEGORY_HINT.place.label, tone: "history" },
  { key: "creature", label: "Creatures", note: CATEGORY_HINT.creature.label, tone: "poetry" },
  { key: "object", label: "Things", note: CATEGORY_HINT.object.label, tone: "prophets" },
  { key: "idea", label: "Ideas", note: CATEGORY_HINT.idea.label, tone: "revelation" },
  { key: "action", label: "Actions", note: CATEGORY_HINT.action.label, tone: "acts" },
  { key: "mixed", label: "Mixed", note: "Today's word, the same for everyone", tone: "gospels" },
];

/** The kind named in the address (?c=), or Mixed for anything else. */
export const asKind = (value: string | null): Kind => KINDS.find((kind) => kind.key === value)?.key ?? "mixed";

export const kindInfo = (kind: Kind) => KINDS.find((item) => item.key === kind) ?? KINDS[KINDS.length - 1];

/** A small seeded generator (mulberry32), so every player gets the same order. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (text: string) => [...text].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);

/** A kind's words (retired ones left out) in its fixed shuffled order. */
export function kindOrder(answers: Answers, kind: Category): string[] {
  const words = Object.keys(answers).filter((word) => answers[word].c === kind && !answers[word].r).sort();
  const random = seeded(seedOf(kind));
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

/** Word n (from 1) of a kind, going round again after the last. */
export function kindWord(order: readonly string[], n: number): string | undefined {
  return order.length ? order[(Math.max(1, n) - 1) % order.length] : undefined;
}

/** The word a kind's record is on: the one under way, else the one after the last finished. */
export function kindNumber(record: { lastDone: number; today: { n: number } | null }): number {
  return record.today && record.today.n > record.lastDone ? record.today.n : record.lastDone + 1;
}
