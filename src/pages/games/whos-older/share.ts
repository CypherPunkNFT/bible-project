// Who's older?: the shareable result (design §6.4). It never names a person, so it spoils nothing. Sharing itself goes
// through Map quest's generic shareResult (share sheet, else clipboard, else a select-and-copy box).
import type { Mode } from "./game";

export { shareResult, type ShareOutcome } from "../map-quest/share";

export const SHARE_ADDRESS = "bibleguide.io/games/whos-older";

export function shareText(mode: Mode, score: number): string {
  const result = mode === "streak" ? `streak of ${score} 🔥` : `${score} right in Relaxed ❤️`;
  return `Who's older? — ${result}\n${SHARE_ADDRESS}`;
}
