// What came first?: builds the game's data files in src/data/what-came-first/ (events, ruled, built, journeys, died,
// books, firsts) and the owner's review sheet docs/features/what-came-first/review-sheet.md from the hand-kept
// *.source.json files there and the site's own data (design §4, §10, §12). Who lived first uses Who's older?'s
// whos-older.json unchanged; this build only proves the new ordering function agrees with it. Run by hand after editing
// a source file:
//   node --experimental-strip-types scripts/build-what-came-first.ts
// It writes nothing and exits 1 on any problem, naming the items involved.
import fs from "node:fs";
import path from "node:path";
import { books, writeGenerated, type Log } from "./what-came-first/common.ts";
import { buildBooks } from "./what-came-first/books.ts";
import { buildEvents } from "./what-came-first/events.ts";
import { buildFirsts } from "./what-came-first/firsts.ts";
import { buildHand } from "./what-came-first/hand.ts";
import { buildJourneys } from "./what-came-first/journeys.ts";
import { buildLived } from "./what-came-first/lived.ts";
import { reviewSheet } from "./what-came-first/review-sheet.ts";
import { buildRulers } from "./what-came-first/rulers.ts";
import { SITE } from "./whos-older/site-data.ts";

const SHEET = path.join(SITE, "docs", "features", "what-came-first", "review-sheet.md");
const codes = new Map([...books.values()].map((b) => [b.code, b.num]));

const lived = buildLived();
const events = buildEvents();
const ruled = buildRulers(codes);
const built = buildHand("built", "built.source.json", 6, 50); // a pool of under 40 items: 50 a band
const went = buildJourneys();
const died = buildHand("died", "died.source.json", 6, 100);
const bookOrder = buildBooks();
const firsts = buildFirsts();
const logs: Log[] = [lived.log, events.log, ruled.log, built.log, went.log, died.log, bookOrder.log, firsts.log];

const errors = logs.flatMap((log) => log.errors.map((error) => `[${log.category}] ${error}`));
if (errors.length) {
  console.error(`what came first: ${errors.length} problem(s); nothing was written.\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const stamps = {
  events: writeGenerated("events.json", events.body),
  ruled: writeGenerated("ruled.json", ruled.body),
  built: writeGenerated("built.json", built.body),
  journeys: writeGenerated("journeys.json", went.body),
  died: writeGenerated("died.json", died.body),
  books: writeGenerated("books.json", bookOrder.body),
  firsts: writeGenerated("firsts.json", firsts.body),
};
fs.writeFileSync(SHEET, reviewSheet({ lived, events, ruled, built, went, died, books: bookOrder, firsts }));

const bands = (b: { easy: number; medium: number; hard: number }) => `easy ${b.easy}, medium ${b.medium}, hard ${b.hard}`;
console.log("what came first: every check passed.");
console.log(`  lived:    ${lived.people} people, ${lived.pairs} pairs (${bands(lived.perBand)}); Who's older?'s file, stamp ${lived.stamp}, parity with its orderOf proved for every pair`);
console.log(`  happened: ${events.pool.items.length} events, ${events.pool.orders.length} pairs (${bands(events.pool.perBand)}), ${events.facts.length} facts, ${events.blocked.length} blocked; stamp ${stamps.events}`);
console.log(`  ruled:    ${ruled.pool.items.length} rulers, ${ruled.pool.orders.length} pairs (${bands(ruled.pool.perBand)}), ${ruled.facts.length} facts + ${ruled.expanded.length} before-Saul, ${ruled.blocked.length} blocked; stamp ${stamps.ruled}`);
console.log(`  built:    ${built.pool.items.length} items, ${built.pool.orders.length} pairs (${bands(built.pool.perBand)}), ${built.facts.length} facts, ${built.blocked.length} blocked; stamp ${stamps.built}`);
console.log(`  went:     ${went.journeys} journeys, ${went.pool.items.length} stops, ${went.pool.orders.length} pairs (${bands(went.pool.perBand)}), ${went.blocked.length} blocked; stamp ${stamps.journeys}`);
console.log(`  died:     ${died.pool.items.length} people, ${died.pool.orders.length} pairs (${bands(died.pool.perBand)}), ${died.facts.length} facts, ${died.blocked.length} blocked; stamp ${stamps.died}`);
console.log(`  books:    ${bookOrder.pool.items.length} books, ${bookOrder.pool.orders.length} pairs (${bands(bookOrder.pool.perBand)}); stamp ${stamps.books}`);
console.log(`  firsts:   ${firsts.questions.length} questions, ${firsts.leftOut.length} left out; stamp ${stamps.firsts}`);
console.log(`  review sheet: ${path.relative(SITE, SHEET)}`);
for (const log of logs) for (const notice of log.notices) console.log(`  notice [${log.category}]: ${notice}`);
