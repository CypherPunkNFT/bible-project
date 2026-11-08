// Timeline sort's shareable Daily result (design §11.2): the puzzle number, tries and one row of squares per try. It
// never names an event, so sharing spoils nothing. Sending it goes through Map quest's shareResult, unchanged.
import { shareRow } from "./scoring";

export const SHARE_ADDRESS = "bibleguide.io/games/timeline";
export const DAILY_TRIES = 4;

export function shareText(n: number, tries: readonly (readonly string[])[], truth: readonly string[], solved: boolean): string {
  const score = solved ? `${tries.length}/${DAILY_TRIES}` : `X/${DAILY_TRIES}`;
  return [`Timeline sort #${n} ${score}`, ...tries.map((order) => shareRow(order, truth)), SHARE_ADDRESS].join("\n");
}

export { shareResult, type ShareOutcome } from "../map-quest/share";
