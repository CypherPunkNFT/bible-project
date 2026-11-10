// Hot seat: small pieces the screens share (design §5.2, §6.5): how a mark is written, and the reader address a
// question's reference opens (written inline as Jeopardy's Verse.tsx writes it; the site has no shared helper).
import type { FrozenQuestion } from "./deal";
import type { Mark } from "./game";

export const MARK_SIGNS: Record<Mark, { sign: string; word: string }> = {
  right: { sign: "✓", word: "Right" },
  wrong: { sign: "✗", word: "Wrong" },
  pass: { sign: "↷", word: "Pass" },
};

export const readerLink = (link: NonNullable<FrozenQuestion["link"]>) =>
  `/read/bsb/${encodeURIComponent(link.book)}/${link.chapter}${link.verse ? `?v=${link.verse}` : ""}`;
