// Bible Wordle's shareable result (design §7): the puzzle number, the score and the coloured squares. It never holds a
// letter, the word, its category or the verse, so sharing spoils nothing for anyone who has not played yet.
import { MAX_TRIES, type Mark } from "./evaluate";

export const SHARE_ADDRESS = "bibleguide.io/games/wordle";

export interface ShareInput {
  n: number;
  /** A kind's word ("People 3") in place of the day's "#n". */
  label?: string;
  rows: readonly (readonly Mark[])[];
  won: boolean;
  hard: boolean;
  hint: boolean;
  /** Light theme uses white squares for letters not in the word, dark theme black, as in Wordle. */
  dark: boolean;
  /** High contrast: orange for correct, blue for present. */
  contrast: boolean;
}

export function squareFor(mark: Mark, dark: boolean, contrast: boolean): string {
  if (mark === "correct") return contrast ? "🟧" : "🟩";
  if (mark === "present") return contrast ? "🟦" : "🟨";
  return dark ? "⬛" : "⬜";
}

export function shareText({ n, label, rows, won, hard, hint, dark, contrast }: ShareInput): string {
  const score = `${won ? rows.length : "X"}/${MAX_TRIES}${hard ? "*" : ""}${hint ? " 💡" : ""}`;
  const grid = rows.map((row) => row.map((mark) => squareFor(mark, dark, contrast)).join("")).join("\n");
  return `Bible Wordle ${label ?? `#${n}`} ${score}\n${grid}\n${SHARE_ADDRESS}`;
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
      console.warn("Bible Wordle: sharing failed, copying instead:", error);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (error) {
    console.warn("Bible Wordle: the clipboard is blocked, showing the text to copy:", error);
    return "manual";
  }
}
