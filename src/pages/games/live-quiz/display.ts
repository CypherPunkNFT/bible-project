// Pure helpers behind the redesigned screens (docs/visual-audits/live-quiz.md): a verse reference with its book written
// out in full, the order players joined in, the medal a place earns, and how far a leaderboard row slides in from.
import type { QuizQuestion } from "@/lib/live-quiz/protocol";

type Link = NonNullable<QuizQuestion["link"]>;

/** "Genesis 7:6" from the link and the site's book list, so a night's verses never mix "Gen 7:6" with "Ezekiel 14:1";
 * the bank's own reference when the book is unknown or the link is missing. */
export function fullReference(reference: string | null, link: Link | null, books: ReadonlyArray<{ code: string; name: string }>): string {
  if (!link) return reference ?? "";
  const book = books.find((b) => b.code === link.book);
  if (!book) return reference ?? `${link.book} ${link.chapter}`;
  return link.verse ? `${book.name} ${link.chapter}:${link.verse}` : `${book.name} ${link.chapter}`;
}

/** Remembers the order ids were first seen in; the server sends players ranked, the lobby wants them as they arrived. */
export function joinOrder(seen: Map<string, number>, ids: readonly string[]): Map<string, number> {
  for (const id of ids) if (!seen.has(id)) seen.set(id, seen.size);
  return seen;
}

export const byJoinOrder = <T extends { id: string }>(players: readonly T[], seen: Map<string, number>): T[] =>
  [...players].sort((a, b) => (seen.get(a.id) ?? Infinity) - (seen.get(b.id) ?? Infinity));

/** 1, 2 or 3 for a podium place; null for the rest. */
export const medalFor = (rank: number): 1 | 2 | 3 | null => (rank === 1 || rank === 2 || rank === 3 ? rank : null);

/** Gold, silver and bronze as CSS colours for the three podium steps. */
export const PLACE_TONES: Record<1 | 2 | 3, string> = { 1: "var(--accent)", 2: "#9a9a9a", 3: "#9c6b3c" };

/** How many rows a leaderboard row slides in from: a climber comes up from below, a faller down from above; at most 5. */
export const slideFrom = (move: number | null): number => (move === null ? 0 : Math.max(-5, Math.min(5, move)));

/** Each score as a share of the top score, for bars; all zero when nobody has scored. */
export const shareOfTop = (score: number, top: number): number => (top > 0 ? Math.max(0, Math.min(1, score / top)) : 0);
