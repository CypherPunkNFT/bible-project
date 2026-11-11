// Map quest's Daily Five schedule (design §7), called by scripts/build-map-quest.py after it has staged places.json:
//   node --experimental-strip-types scripts/build-map-quest-daily.ts --places FILE --existing daily.json --out FILE [--epoch YYYY-MM-DD]
// Days up to two days after today stay exactly as they were in the existing file (a past or current puzzle never
// changes anywhere in the world); every later day is chosen again from the current places with the game's own rules.
import fs from "node:fs";
import { eligiblePool, nextDay, type DailyPlace, type DailySchedule } from "../src/pages/games/map-quest/daily-rules.ts";

const YEARS_AHEAD_DAYS = 3 * 366;
const FROZEN_AHEAD = 2;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function fail(message: string): never {
  console.error(`map quest daily: ${message}`);
  process.exit(1);
}

/** Calendar days between two Y-M-D dates, counted on the calendar (no clock or daylight-saving involved). */
function dayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) fail(`expected a date as YYYY-MM-DD, got ${JSON.stringify(date)}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function readExisting(path: string): DailySchedule | null {
  if (!fs.existsSync(path)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(path, "utf8")) as DailySchedule;
    if (typeof value.epoch !== "string" || !Array.isArray(value.days)) throw new Error("no epoch or days");
    return value;
  } catch (error) {
    return fail(`${path} exists but could not be read (${String(error)}); fix or restore it rather than lose its past puzzles`);
  }
}

const placesPath = argument("places") ?? fail("--places is required");
const existingPath = argument("existing") ?? fail("--existing is required");
const outPath = argument("out") ?? fail("--out is required");
const existing = readExisting(existingPath);
const epochFlag = argument("epoch");
if (existing && epochFlag && epochFlag !== existing.epoch) {
  fail(`daily.json already starts on ${existing.epoch}; changing it to ${epochFlag} would renumber every puzzle. Delete daily.json first if that is really wanted.`);
}
const epoch = existing?.epoch ?? epochFlag ?? fail("first build: pass --epoch YYYY-MM-DD, the date of puzzle #1");
dayNumber(epoch);

const places = JSON.parse(fs.readFileSync(placesPath, "utf8")) as DailyPlace[];
const pool = eligiblePool(places);
const byId = new Map(pool.map((place) => [place.id, place]));
const today = dayNumber(localToday()) - dayNumber(epoch) + 1;
const frozenThrough = Math.max(0, today + FROZEN_AHEAD);
const kept = (existing?.days ?? []).slice(0, frozenThrough);
kept.forEach((day, index) => {
  const gone = day.filter((id) => !byId.has(id));
  if (gone.length) fail(`puzzle #${index + 1} is frozen (today is #${today}) but uses ${gone.join(", ")}, no longer playable; put it back in places or restore curation`);
});

const days: string[][] = [...kept];
const total = Math.max(frozenThrough, today) + YEARS_AHEAD_DAYS;
for (let index = days.length; index < total; index++) {
  const day = nextDay(pool, days, index);
  if (!day) fail(`no puzzle #${index + 1} fits the rules (tiers per slot, no repeats within 30/90 days, 15 km apart, a Holy Land and a wider-world place); widen REPEAT_DAYS in daily-rules.ts and note it in the design`);
  days.push(day);
}

const used = new Set(days.flat());
const schedule: DailySchedule = { epoch, frozenThrough, days };
const lines = days.map((day) => JSON.stringify(day)).join(",\n");
fs.writeFileSync(outPath, `{"epoch":${JSON.stringify(epoch)},"frozenThrough":${frozenThrough},"days":[\n${lines}\n]}\n`, "utf8");
console.log(`daily: ${schedule.days.length} puzzles from ${epoch} (today #${today}, ${kept.length} kept unchanged), ${used.size} of ${pool.length} places used`);
