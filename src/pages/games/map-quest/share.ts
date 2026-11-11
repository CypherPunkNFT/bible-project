// The Daily Five's shareable result (design §7): the puzzle number, the total and five coloured squares. It never names
// a place, so sharing spoils nothing for anyone who has not played yet.
import { formatNumber } from "@/lib/site-format";
import { BAND_EMOJI, MAX_POINTS, bandFor } from "./scoring";

export const SHARE_ADDRESS = "bibleguide.io/games/map-quest";

export function shareText(n: number, points: readonly number[]): string {
  const total = formatNumber(points.reduce((sum, p) => sum + p, 0));
  const most = formatNumber(points.length * MAX_POINTS);
  const squares = points.map((p) => BAND_EMOJI[bandFor(p)]).join("");
  return `Bible Map Quest #${n} — ${total} / ${most}\n${squares}\n${SHARE_ADDRESS}`;
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
      console.warn("Map quest: sharing failed, copying instead:", error);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (error) {
    console.warn("Map quest: the clipboard is blocked, showing the text to copy:", error);
    return "manual";
  }
}
