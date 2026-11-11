// Hot seat: small pieces the screens share (design §5.2, §6.5): how a mark is written, the reader address a
// question's reference opens (written inline as Jeopardy's Verse.tsx writes it; the site has no shared helper), and
// the reference with its book written out in full.
import type { TrailMark } from "../kit";
import type { FrozenQuestion } from "./deal";
import type { Asked, Mark } from "./game";

export const MARK_SIGNS: Record<Mark, { sign: string; word: string }> = {
  right: { sign: "✓", word: "Right" },
  wrong: { sign: "✗", word: "Wrong" },
  pass: { sign: "↷", word: "Pass" },
};

/** The recap strip's tile for a mark: a pass is the amber "part" tile; an unmarked question stays empty. */
const TILE: Record<Mark, TrailMark> = { right: "right", wrong: "wrong", pass: "part" };
export const tilesOf = (questions: readonly Asked[]): TrailMark[] => questions.map((a) => (a.mark ? TILE[a.mark] : "empty"));

export const readerLink = (link: NonNullable<FrozenQuestion["link"]>) =>
  `/read/bsb/${encodeURIComponent(link.book)}/${link.chapter}${link.verse ? `?v=${link.verse}` : ""}`;

/** The chapter-and-verse tail of a reference: " 16:11", " 4:1-2", " 5" (a whole chapter). */
const TAIL = /\s+(\d+(?:[:.][\d\-–,\s]*\d)?[a-z]?)\s*$/u;

/** The reference with the book's full name in place of the bank's abbreviation, when the link names a book the list
 * knows and the reference ends in a chapter; otherwise the bank's text as it is. */
export function fullReference(reference: string, link: FrozenQuestion["link"], names: Readonly<Record<string, string>>): string {
  const name = link && names[link.book];
  if (!name) return reference;
  const tail = TAIL.exec(reference);
  if (!tail || tail.index === 0) return reference;
  return `${name} ${tail[1].trim()}`;
}
