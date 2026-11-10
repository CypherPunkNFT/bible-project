// Dealing (design §6.2, §8.2): 1,000 rounds per offered filter, every wrong choice fair, positions balanced.
import storyFile from "@/data/emoji-stories/stories.json";
import { DIFFICULTIES, ROUND_LENGTH, TESTAMENTS, choicesFor, dealRound, fairWrongChoice, isOffered, points, remember, sharePerson, storiesFor } from "./deal";
import type { StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const byId = new Map(stories.map((story) => [story.id, story]));
const filters = DIFFICULTIES.flatMap((difficulty) => TESTAMENTS.map((testament) => ({ difficulty, testament }))).filter((filter) => isOffered(stories, filter));

describe("emoji stories dealing", () => {
  it.each(filters.map((filter) => [`${filter.difficulty} / ${filter.testament}`, filter] as const))("deals 1,000 fair rounds: %s", (_, filter) => {
    const positions = [0, 0, 0, 0];
    const pool = storiesFor(stories, filter);
    for (let seed = 1; seed <= 1000; seed++) {
      const ids = dealRound(stories, filter, [], seed);
      expect(ids).toHaveLength(ROUND_LENGTH);
      expect(new Set(ids).size).toBe(ROUND_LENGTH);
      for (const [index, id] of ids.entries()) {
        const answer = byId.get(id)!;
        expect(pool).toContain(answer);
        const choices = choicesFor(answer, stories, seed * 31 + index).map((choice) => byId.get(choice)!);
        expect(new Set(choices).size).toBe(4);
        positions[choices.indexOf(answer)] += 1;
        for (const [i, choice] of choices.entries()) {
          if (choice !== answer) expect(fairWrongChoice(answer, choice), `${choice.id} beside ${answer.id}`).toBe(true);
          for (const other of choices.slice(i + 1)) expect(sharePerson(choice, other), `${choice.id} and ${other.id}`).toBe(false);
        }
      }
    }
    const total = positions.reduce((sum, n) => sum + n, 0);
    for (const count of positions) {
      expect(count / total).toBeGreaterThan(0.15);
      expect(count / total).toBeLessThan(0.35);
    }
  }, 60_000); // 1,000 rounds of ten: slow when the whole suite runs at once

  it("never offers confusable stories or rows sharing two emoji side by side", () => {
    const furnace = byId.get("fiery-furnace")!, peter = byId.get("peter-rooster")!;
    expect(fairWrongChoice(furnace, peter)).toBe(false);
    expect(fairWrongChoice(byId.get("manna")!, byId.get("elijah-ravens")!)).toBe(false);
    expect(fairWrongChoice(byId.get("ten-commandments")!, byId.get("temptation")!)).toBe(false); // ⛰️ and 🪨
  });

  it("keeps the last 60 puzzles back while others remain", () => {
    const filter = { difficulty: "mixed", testament: "both" } as const;
    const recent = dealRound(stories, filter, [], 1).concat(dealRound(stories, filter, [], 2));
    for (let seed = 3; seed < 50; seed++) {
      for (const id of dealRound(stories, filter, recent, seed)) expect(recent).not.toContain(id);
    }
    const easyOld = storiesFor(stories, { difficulty: "easy", testament: "old" }).map((story) => story.id);
    const seenAlmostAll = easyOld.slice(0, easyOld.length - 3);
    const round = dealRound(stories, { difficulty: "easy", testament: "old" }, seenAlmostAll, 7);
    expect(round.slice(0, 3).sort()).toEqual(easyOld.slice(-3).sort());
    expect(round.slice(3)).toEqual(seenAlmostAll.slice(0, ROUND_LENGTH - 3));
  });

  it("remembers at most 60 puzzles, newest last", () => {
    const ids = stories.slice(0, 70).map((story) => story.id);
    const recent = remember([], ids);
    expect(recent).toHaveLength(60);
    expect(recent[59]).toBe(ids[69]);
    expect(remember(recent, [ids[30]]).at(-1)).toBe(ids[30]);
  });

  it("scores 3 with no hint, 2 with one, 1 with two or three, 0 when wrong", () => {
    expect([points(true, 0), points(true, 1), points(true, 2), points(true, 3), points(false, 0)]).toEqual([3, 2, 1, 1, 0]);
  });
});
