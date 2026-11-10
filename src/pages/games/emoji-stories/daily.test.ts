// The Daily schedule (design §9, §13): every rule over the whole file, the fixed order in which rules give way, a small
// pool that still fills two years, kept days unchanged by a rebuild, and the share line and guess limits.
import storyFile from "@/data/emoji-stories/stories.json";
import scheduleFile from "@/data/emoji-stories/daily.json";
import { createDaily } from "./daily";
import { RELAX_ORDER, brokenRules, candidates, dailyPool, extendDays, isSunday, repeatGap, rulesFor, type DailyStory } from "./daily-rules";
import { shareText } from "./share";
import { addToStats, maxGuesses, readDevice, validDaily, type DailyRecord } from "./storage";
import type { DailySchedule, StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const schedule = scheduleFile as DailySchedule;

/** How many rules gave way for day `index`, checking it is the fewest that could have. */
function relaxedFor(pool: readonly DailyStory[], epoch: string, days: readonly string[], index: number, all = pool): number {
  const rules = rulesFor(pool, epoch, all);
  for (let relaxed = 0; relaxed <= RELAX_ORDER.length; relaxed++) {
    if (candidates(rules, pool, days, index, relaxed).some((story) => story.id === days[index])) return relaxed;
  }
  return -1;
}

function expectRulesKept(pool: readonly DailyStory[], epoch: string, days: readonly string[], from: number, all = pool) {
  const rules = rulesFor(pool, epoch, all);
  for (let index = from; index < days.length; index++) {
    const relaxed = relaxedFor(pool, epoch, days, index, all);
    expect(relaxed, `day ${index + 1} breaks a rule no order allows`).toBeGreaterThanOrEqual(0);
    if (relaxed > 0) expect(candidates(rules, pool, days, index, relaxed - 1), `day ${index + 1} relaxed too soon`).toEqual([]);
    const story = rules.byId.get(days[index])!;
    expect(brokenRules(rules, days, index, story)).not.toContain("sunday");
  }
}

describe("emoji stories daily schedule", () => {
  it("covers about two years with active stories, keeping every rule or giving way in the fixed order", () => {
    expect(schedule.days.length).toBeGreaterThanOrEqual(700);
    const pool = dailyPool(stories);
    expect(schedule.days.every((id) => pool.some((story) => story.id === id))).toBe(true);
    expectRulesKept(pool, schedule.epoch, schedule.days, schedule.frozenThrough, stories);
    const tierOf = new Map(stories.map((story) => [story.id, story.tier]));
    schedule.days.forEach((id, index) => { if (isSunday(schedule.epoch, index)) expect(tierOf.get(id), `Sunday #${index + 1}`).toBe(1); });
  });

  it("carries on past the end of the file with the same rules for a year", () => {
    const daily = createDaily(schedule, stories);
    const length = schedule.days.length + 365;
    expect(daily.storyFor(length)).not.toBeNull();
    const days = Array.from({ length }, (_, i) => daily.storyFor(i + 1)!);
    expectRulesKept(dailyPool(stories), schedule.epoch, days, schedule.days.length, stories);
  });

  it("fills two years from a small pool (40 stories, five of them tier 1) without an empty day", () => {
    const small: DailyStory[] = Array.from({ length: 40 }, (_, i) => ({ id: `s${String(i).padStart(2, "0")}`, tier: i < 5 ? 1 : i < 34 ? 2 : 3, testament: i % 2 ? "old" : "new" }));
    const pool = dailyPool(small);
    const days: string[] = [];
    extendDays(rulesFor(pool, "2026-11-09"), pool, days, 730);
    expect(days).toHaveLength(730);
    expect(repeatGap(pool.length)).toBe(10);
    expectRulesKept(pool, "2026-11-09", days, 0);
  });

  it("keeps the kept days when a story is added, and only re-plans after them", () => {
    const pool = dailyPool(stories);
    const days: string[] = [];
    extendDays(rulesFor(pool, schedule.epoch), pool, days, 200);
    const extra: DailyStory = { id: "zz-new-story", tier: 1, testament: "new" };
    const bigger = dailyPool([...stories, extra]);
    const rebuilt = days.slice(0, 60);
    extendDays(rulesFor(bigger, schedule.epoch), bigger, rebuilt, 200);
    expect(rebuilt.slice(0, 60)).toEqual(days.slice(0, 60));
    expect(rebuilt).toHaveLength(200);
  });

  it("never schedules a retired story", () => {
    const retired = stories.map((story, i) => (i < 5 ? { ...story, retired: true } : story));
    const pool = dailyPool(retired);
    const days: string[] = [];
    extendDays(rulesFor(pool, schedule.epoch, retired), pool, days, 120);
    expect(days.some((id) => retired.slice(0, 5).some((story) => story.id === id))).toBe(false);
  });

  it("gives puzzle #1 on the epoch and nothing before it", () => {
    const daily = createDaily(schedule, stories);
    const [year, month, day] = schedule.epoch.split("-").map(Number);
    expect(daily.numberOn(new Date(year, month - 1, day, 9))).toBe(1);
    expect(daily.numberOn(new Date(year, month - 1, day - 1, 23, 59))).toBe(0);
    expect(daily.storyFor(0)).toBeNull();
    expect(daily.storyFor(1)).toBe(schedule.days[0]);
  });
});

describe("emoji stories daily record", () => {
  const known = new Set(stories.map((story) => story.id));
  const record = (changes: Partial<DailyRecord>): DailyRecord => ({ n: 3, mode: "typing", guesses: [], asked: 0, over: false, won: false, ...changes });

  it("allows three typed guesses and two with choices", () => {
    expect(maxGuesses("typing")).toBe(3);
    expect(maxGuesses("choices")).toBe(2);
    expect(validDaily(record({ mode: "choices", guesses: ["jonah", "manna", "ruth"] }), known)).toBe(false);
    expect(validDaily(record({ guesses: ["jonah", "jonah"] }), known)).toBe(false);
    expect(validDaily(record({ guesses: ["not-a-story"] }), known)).toBe(false);
    expect(validDaily(record({ guesses: ["jonah", "manna", "ruth"], over: true }), known)).toBe(true);
  });

  it("counts streaks by puzzle number and the 1-2-3 spread", () => {
    let stats = readDevice(null, known).stats;
    stats = addToStats(stats, record({ n: 4, guesses: ["jonah"], over: true, won: true }));
    stats = addToStats(stats, record({ n: 5, guesses: ["manna", "jonah"], over: true, won: true }));
    expect(stats).toMatchObject({ played: 2, solved: 2, streak: 2, best: 2, spread: [1, 1, 0] });
    stats = addToStats(stats, record({ n: 7, guesses: ["jonah"], over: true, won: true }));
    expect(stats.streak).toBe(1);
    stats = addToStats(stats, record({ n: 8, guesses: ["a", "b", "c"], over: true, won: false }));
    expect(stats).toMatchObject({ played: 4, solved: 3, streak: 0, best: 2 });
  });

  it("writes a share line with the puzzle, not the answer", () => {
    const byId = new Map(stories.map((story) => [story.id, story]));
    const answer = byId.get("elijah-chariot")!;
    const text = shareText(42, answer, record({ guesses: ["elijah-ravens", "jonah", "elijah-chariot"], asked: 1, over: true, won: true }), byId);
    expect(text).toBe(`Emoji stories #42  ${answer.emoji.map(([e]) => e).join("")}\n🟨🟥🟩  💡1\nbibleguide.io/games/emoji-stories`);
    expect(text).not.toContain(answer.title);
    const choices = shareText(42, answer, record({ mode: "choices", guesses: ["elijah-chariot"], over: true, won: true }), byId);
    expect(choices.split("\n")[1]).toBe("🟩⬜  with choices");
  });
});
