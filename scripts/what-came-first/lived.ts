// Who lived first? (category 1, design §4.1): no new file. Who's older?'s whos-older.json is used as it is; this step
// proves the new ordering function gives exactly Who's older?'s answer for every pair, and counts the pairs per band.
import path from "node:path";
import { bandOf as whosOlderBand, buildIndex as whosOlderIndex, orderOf as whosOlderOrder,
  type Fact as WhosOlderFact } from "../../src/pages/games/whos-older/pairing.ts";
import { BANDS, bandOf } from "../../src/pages/games/what-came-first/bands.ts";
import { livedItems } from "../../src/pages/games/what-came-first/categories/lived.ts";
import { RULES, buildIndex, orderOf } from "../../src/pages/games/what-came-first/order.ts";
import { SITE, readJson } from "../whos-older/site-data.ts";
import { Log, type BandCounts } from "./common.ts";

interface WhosOlderFile { stamp: string; characters: Parameters<typeof livedItems>[0]["characters"]; facts: WhosOlderFact[]; blocked: [string, string][] }

export interface LivedResult { log: Log; people: number; pairs: number; perBand: BandCounts; blocked: number; facts: number; stamp: string }

export function buildLived(): LivedResult {
  const log = new Log("lived");
  const file = readJson<WhosOlderFile>(path.join(SITE, "src", "data", "whos-older", "whos-older.json"));
  const items = livedItems(file);
  const oldIndex = whosOlderIndex(file.facts, file.blocked);
  const newIndex = buildIndex(file.facts, file.blocked);
  const perBand = Object.fromEntries(BANDS.map((band) => [band, 0])) as BandCounts;
  let pairs = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const before = whosOlderOrder(file.characters[i], file.characters[j], oldIndex);
      const now = orderOf(items[i], items[j], newIndex, RULES.lived);
      const same = before === null ? now === null
        : now !== null && now.first.id === before.first.id && JSON.stringify(now.reason) === JSON.stringify(before.reason);
      if (!same) { log.error(`parity: ${items[i].label} / ${items[j].label} differs from Who's older?`); continue; }
      if (!now || !before) continue;
      pairs++;
      const band = bandOf("lived", now);
      if (band !== whosOlderBand(before)) log.error(`parity: ${items[i].label} / ${items[j].label} is ${band}, Who's older? says ${whosOlderBand(before)}`);
      perBand[band]++;
    }
  }
  return { log, people: items.length, pairs, perBand, blocked: file.blocked.length, facts: file.facts.length, stamp: file.stamp };
}
