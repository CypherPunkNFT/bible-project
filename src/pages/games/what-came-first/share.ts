// What came first?: the shareable result (design §9.4). It names the kind of round but never an item, so it spoils
// nothing, and its link opens the same pill. Sharing itself goes through Map quest's generic shareResult (share sheet,
// else clipboard, else a select-and-copy box).
import { categoryInfo, type Choice } from "./categories";
import type { Mode } from "./game";

export { shareResult, type ShareOutcome } from "../map-quest/share";

export const SHARE_ADDRESS = "bibleguide.io/games/what-came-first";

export function shareText(choice: Choice, mode: Mode, score: number): string {
  const result = mode === "streak" ? `streak of ${score} 🔥` : `${score} right in Relaxed ❤️`;
  return `What came first? · ${categoryInfo(choice).heading} — ${result}\n${SHARE_ADDRESS}?c=${choice}`;
}
