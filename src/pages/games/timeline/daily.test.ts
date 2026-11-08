// The Daily schedule (daily.json) and the fallback past its end, against every rule of design §6.1.
import scheduleFile from "@/data/timeline/daily.json";
import timelineFile from "@/data/timeline/timeline.json";
import { createDaily } from "./daily";
import { DAILY_CARDS, HISTORY_DAYS, dailyPool, dayProblems, nextDay, type TimelineSchedule } from "./daily-rules";
import { prepare, type TimelineData } from "./text";

const schedule = scheduleFile as unknown as TimelineSchedule;
const { index } = prepare(timelineFile as unknown as TimelineData);
const problemsIn = (days: readonly string[][], from = 0) => days.slice(from).flatMap((day, i) =>
  dayProblems(index, day, days.slice(Math.max(0, from + i - HISTORY_DAYS), from + i)).map((problem) => `puzzle #${from + i + 1}: ${problem}`));

/** The first days as they were at implementation (2026-11-07): frozen, so no rebuild may change them. */
const FROZEN_AT_LAUNCH: string[][] = [
  ["jordan-crossing", "sennacherib-siege", "return-to-nazareth", "abram-called", "sermon-mount", "christians-antioch"],
  ["exodus", "paul-arrested", "solomon-wisdom", "nehemiah-walls", "last-supper", "naaman-healed"],
  ["stephen-stoned", "sodom-destroyed", "jerusalem-destroyed", "passover", "ezekiel-call", "david-goliath"],
  ["pharaoh-kills-boys", "ishmael-born", "jerusalem-council", "cain-kills-abel", "jesus-born", "ahab-dies"],
  ["ananias-sapphira", "lydia-believes", "samuel-called", "seth-born", "shepherds-visit", "potiphar-prison"],
  ["anointing-bethany", "isaac-born", "abram-renamed", "esther-queen", "golden-calves", "temple-foundation"],
  ["water-from-rock-horeb", "zechariah-angel", "deborah-barak", "samson-delilah", "writing-on-wall", "cyrus-decree"],
  ["peter-freed", "joseph-born", "jericho-falls", "transfiguration", "david-spares-saul", "daniel-taken"],
  ["abram-lot-part", "jacob-settles-egypt", "walking-on-water", "aaron-dies", "endor-medium", "water-into-wine"],
  ["zacchaeus", "temple-dedicated", "gideon-fleece", "three-visitors", "jacob-wrestles", "manna"],
  ["entry-jerusalem", "jonathan-covenant", "bronze-serpent", "absalom-revolt", "calms-storm", "samaria-falls"],
  ["covenant-stars", "jehoiakim-burns-scroll", "ehud-kills-eglon", "temptation", "wise-men", "gideon-midian"],
  ["mordecai-plot", "sinai-commandments", "naboth-vineyard", "bethlehem-boys", "amalek-defeated", "lazarus-raised"],
  ["cornelius", "balaam-donkey", "elisha-bears", "rebekah-at-well", "damascus-road", "moses-born"],
  ["joseph-sold", "josiah-book-law", "abram-rescues-lot", "joseph-dies", "malta-shipwreck", "kingdom-splits"],
];

describe("timeline sort Daily schedule", () => {
  it("covers about three years, with a date, a build date and a frozen margin", () => {
    expect(schedule.epoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schedule.builtOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schedule.frozenThrough).toBeGreaterThanOrEqual(2);
    expect(schedule.days.length).toBeGreaterThanOrEqual(3 * 365);
    for (const day of schedule.days) expect(day).toHaveLength(DAILY_CARDS);
  });

  it("keeps every rule on every day: certain, tiers, eras, closeness and no repeat within 28 days", () => {
    expect(problemsIn(schedule.days)).toEqual([]);
  });

  it("keeps the frozen first days exactly as they were at launch", () => {
    expect(schedule.days.slice(0, FROZEN_AT_LAUNCH.length)).toEqual(FROZEN_AT_LAUNCH);
  });

  it("was written with the same rule the browser uses past the end of the file", () => {
    const pool = dailyPool(index);
    for (const at of [schedule.frozenThrough + 1, 200, 500, schedule.days.length - 1]) {
      expect(nextDay(index, pool, schedule.days, at), `puzzle #${at + 1}`).toEqual(schedule.days[at]);
    }
  });

  it("carries on past the end of the file for a year with the same rules, the same in every browser", () => {
    const daily = createDaily(schedule, index);
    const again = createDaily(schedule, index);
    const end = schedule.days.length;
    const days = [...schedule.days];
    for (let n = end + 1; n <= end + 365; n++) days.push(daily.eventsFor(n)!);
    expect(problemsIn(days, end)).toEqual([]);
    expect(again.eventsFor(end + 365)).toEqual(days[end + 364]);
    expect(daily.eventsFor(0)).toBeNull();
    expect(daily.eventsFor(1)).toEqual(schedule.days[0]);
  }, 180_000);
});
