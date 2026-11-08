// Timeline sort: a small pool for the tests, with the windows of the design's worked examples (§5.3). Used only by the
// *.test.ts(x) files beside it; the game itself loads src/data/timeline/timeline.json.
import { buildOrderIndex, type Era, type OrderFact, type Tier } from "./order";
import type { EventEntry, TimelineData } from "./text";

type Row = [id: string, label: string, era: Era, tier: Tier, lo: number | null, hi: number | null, shown?: boolean];

const ROWS: Row[] = [
  ["creation", "God creates the heavens and the earth", "beginnings", 1, -10000, -9990, false],
  ["flood", "The Flood", "beginnings", 1, -7400, -7390, false],
  ["babel", "The Tower of Babel", "beginnings", 1, -5000, -4990, false],
  ["abram-called", "God calls Abram to leave Haran", "patriarchs", 1, -2140, -1638],
  ["job-trials", "Job loses everything", "patriarchs", 2, null, -593],
  ["joseph-sold", "Joseph is sold into Egypt", "patriarchs", 1, -1945, -1445],
  ["exodus", "Israel leaves Egypt", "exodus", 1, -1495, -1208],
  ["sinai-commandments", "The Ten Commandments at Sinai", "exodus", 1, -1495, -1208],
  ["jericho-falls", "The walls of Jericho fall", "exodus", 1, -1455, -1168],
  ["joshua-dies", "Joshua dies", "exodus", 2, -1425, -1110],
  ["gideon-midian", "Gideon defeats Midian", "kingdom", 1, -1300, -1050],
  ["david-king-hebron", "David is made king at Hebron", "kingdom", 1, -1055, -1002],
  ["solomon-temple", "Solomon begins building the temple", "kingdom", 1, -1012, -959],
  ["kingdom-splits", "The kingdom splits under Rehoboam", "divided", 2, -975, -922],
  ["samaria-falls", "Samaria falls to Assyria", "divided", 1, -724, -721],
  ["jerusalem-destroyed", "Jerusalem and the temple are destroyed", "divided", 1, -588, -586],
  ["cyrus-decree", "Cyrus lets the exiles go home", "return", 1, -539, -536],
  ["daniel-lions", "Daniel in the lions' den", "return", 1, -539, -530],
  ["esther-queen", "Esther becomes queen", "return", 2, -479, -478],
  ["ezra-arrives", "Ezra arrives in Jerusalem", "return", 2, -458, -398],
  ["nehemiah-walls", "Nehemiah rebuilds the walls", "return", 1, -445, -444],
  ["jesus-born", "Jesus is born", "jesus", 1, -7, -2],
  ["feeding-5000", "Jesus feeds the five thousand", "jesus", 1, 26, 33],
  ["sermon-mount", "The Sermon on the Mount", "jesus", 1, 26, 33],
  ["entry-jerusalem", "Jesus rides into Jerusalem", "jesus", 1, 30, 33],
  ["last-supper", "The Last Supper", "jesus", 1, 30, 33],
  ["crucifixion", "Jesus is crucified", "jesus", 1, 30, 33],
  ["patmos-vision", "John's vision on Patmos", "church", 2, 64, 96],
];

const fact = (first: string, second: string, why: string, close: boolean, verse: number): OrderFact => ({ first, second, why, close, refs: [[verse, verse]] });

export const FACTS: OrderFact[] = [
  fact("creation", "flood", "The Flood came on the world God had made.", false, 1006007),
  fact("exodus", "sinai-commandments", "Israel reached Mount Sinai in the third month after leaving Egypt.", true, 2019001),
  fact("sinai-commandments", "jericho-falls", "Israel wandered forty years after Sinai before crossing to Jericho.", false, 6005006),
  fact("jericho-falls", "joshua-dies", "Jericho fell in Joshua's lifetime.", true, 6024029),
  fact("joshua-dies", "gideon-midian", "Joshua died before Gideon's day.", false, 7002008),
  fact("entry-jerusalem", "last-supper", "The supper came on the Passover after the entry.", true, 41014012),
  fact("last-supper", "crucifixion", "Jesus was arrested that night and crucified the next day.", true, 41015025),
];
export const CONTESTED: [string, string][] = [["ezra-arrives", "nehemiah-walls"], ["daniel-lions", "cyrus-decree"]];

export const EVENTS: EventEntry[] = ROWS.map(([id, label, era, tier, lo, hi, shown = true], rank) => ({
  id, label, era, tier, lo, hi, shown, rank, dating: shown ? `About ${lo}–${hi}.` : "In the Bible's early chapters.", refs: [[1001001, 1001001]],
  people: [],
}));

export const DATA: TimelineData = { stamp: "fixture", books: { "1": ["GEN", "Genesis"], "41": ["MRK", "Mark"] }, events: EVENTS, facts: FACTS, contested: CONTESTED };
export const fixtureIndex = () => buildOrderIndex(EVENTS, FACTS, CONTESTED);
