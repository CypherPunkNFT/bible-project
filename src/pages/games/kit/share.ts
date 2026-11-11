// Sharing a result (the audits' result panel, item 6): the phone's share sheet where there is one, else the clipboard,
// else the caller shows the text to select and copy. The same contract as Bible Wordle's share.ts, so a game's own
// shareResult can be swapped for this one. The text is the game's own (its share format is frozen by the brief).

/** shared / copied: done. cancelled: the player closed the share sheet. manual: show the text to select and copy. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "manual";

const canUseShareSheet = (text: string): boolean =>
  typeof navigator !== "undefined" && typeof navigator.share === "function" && (navigator.canShare?.({ text }) ?? true);

/** Call it straight from the tap (iPhones only open the share sheet inside a tap). Never throws. */
export async function shareText(text: string, game = "games kit"): Promise<ShareOutcome> {
  if (canUseShareSheet(text)) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      console.warn(`${game}: sharing failed, copying instead:`, error);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (error) {
    console.warn(`${game}: the clipboard is blocked, showing the text to copy:`, error);
    return "manual";
  }
}
