// Right, close or wrong (design §6.4) and the Daily's spoiler-free share line (§8.1). The line shows the puzzle's emoji,
// never the answer, so it invites friends to play.
import { trailText, type TrailMark } from "../kit/trail";
import { points, ROUND_LENGTH, sharePerson } from "./deal";
import { maxGuesses, type DailyRecord, type RoundPuzzle } from "./storage";
import type { Story } from "./types";

export type Verdict = "right" | "close" | "wrong";

/** Close: a different story with a person in common ("Right person, different story"); counted as a wrong guess. */
export function verdictOf(answer: Story, picked: Story): Verdict {
  if (picked.id === answer.id) return "right";
  return sharePerson(answer, picked) ? "close" : "wrong";
}

const SQUARE: Record<Verdict, string> = { right: "🟩", close: "🟨", wrong: "🟥" };

export function shareText(n: number, answer: Story, record: DailyRecord, byId: ReadonlyMap<string, Story>): string {
  const squares = record.guesses.map((id) => {
    const picked = byId.get(id);
    return picked ? SQUARE[verdictOf(answer, picked)] : SQUARE.wrong;
  });
  while (squares.length < maxGuesses(record.mode)) squares.push("⬜");
  const extras = [record.asked ? `💡${record.asked}` : "", record.mode === "choices" ? "with choices" : ""].filter(Boolean);
  return [
    `Emoji stories #${n}  ${answer.emoji.map(([emoji]) => emoji).join("")}`,
    [squares.join(""), ...extras].join("  "),
    "bibleguide.io/games/emoji-stories",
  ].join("\n");
}

/** shared / copied: done. cancelled: the player closed the share sheet. manual: show the text to select and copy. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "manual";

/** The phone's share sheet where there is one, else the clipboard, else the caller shows a select-and-copy box. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === "function" && (navigator.canShare?.({ text }) ?? true)) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      console.warn("Emoji stories: sharing failed, copying instead:", error);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (error) {
    console.warn("Emoji stories: the clipboard is blocked, showing the text to copy:", error);
    return "manual";
  }
}

/** A Practice puzzle's mark on the progress trail: green right without a hint, amber right with one, red wrong; the
 * puzzle being played is "current" and the ones to come are empty. */
export function practiceMarks(puzzles: readonly Pick<RoundPuzzle, "id" | "pick" | "hints" | "revealed">[], at: number, over: boolean): TrailMark[] {
  return Array.from({ length: Math.max(ROUND_LENGTH, puzzles.length) }, (_, index) => {
    const puzzle = puzzles[index];
    if (!puzzle) return "empty";
    if (puzzle.revealed) return puzzle.pick !== puzzle.id ? "wrong" : points(true, puzzle.hints) === 3 ? "right" : "part";
    return index === at && !over ? "current" : "empty";
  });
}

/** The Practice round's share line (new in the redesign; the Daily's line above is unchanged): the score, the ten
 * squares, the address. No titles, so it never spoils a puzzle. */
export function practiceShareText(puzzles: readonly Pick<RoundPuzzle, "id" | "pick" | "hints" | "revealed">[], score: number): string {
  return [
    `Emoji stories · Practice ${score}/${ROUND_LENGTH * 3}`,
    trailText(practiceMarks(puzzles, puzzles.length, true)),
    "bibleguide.io/games/emoji-stories",
  ].join("\n");
}
