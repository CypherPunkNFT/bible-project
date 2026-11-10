// Hot seat's question pools (design §3.1–3.2, §11): each eligibility rule on the fixture, the four groups' levels and
// children's flag, the testament filter, and the pool sizes on the real bank (skipped where the bank is not present).
import fs from "node:fs";
import path from "node:path";
import type { QuestionBank } from "@/lib/data";
import { bankQuestion, fixtureQuestions, ruleQuestions } from "./hot-seat.test.fixture";
import { ANSWER_MAX, GROUP_KEYS, QUESTION_MAX, eligibleQuestions, poolFor, poolSizes, poolsOf } from "./pool";

const texts = (children: boolean) => {
  const rules = ruleQuestions();
  const kept = new Set(eligibleQuestions(Object.values(rules), children).map((e) => e.frozen.text));
  return Object.fromEntries(Object.entries(rules).map(([key, q]) => [key, kept.has(children && q.child ? q.child.question : q.question)]));
};

describe("hot seat pools", () => {
  it("applies every rule of §3.2", () => {
    const kept = texts(false);
    expect(kept).toEqual({
      plain: true, leadIn: false, whichOfThese: false, capitalNot: false, longQuestion: false, longestQuestion: true,
      longAnswer: false, catechism: false, childWorded: true, notStandalone: false, noLevel: false,
    });
    expect(QUESTION_MAX).toBe(140);
    expect(ANSWER_MAX).toBe(40);
  });

  it("uses the children's wording for the children's groups, and judges its answer", () => {
    const rules = ruleQuestions();
    const children = eligibleQuestions([rules.childWorded, rules.plain], true);
    expect(children.map((e) => e.frozen.text)).toEqual(["Who built a big boat?", rules.plain.question]);
    expect(children[0].frozen.options[children[0].frozen.correct]).toBe("Noah");
    expect(children[0].full).toBeNull();
    const ordinary = eligibleQuestions([rules.childWorded], false);
    expect(ordinary[0].frozen.text).toBe(rules.childWorded.question);
  });

  it("keeps the full printed answer only when it says more than the option", () => {
    const q = bankQuestion(1, { answer: "Noah, son of Lamech", answer_choice: "Noah", options: ["Noah", "Shem", "Ham", "Japheth"] });
    expect(eligibleQuestions([q], false)[0].full).toBe("Noah, son of Lamech");
    expect(eligibleQuestions([bankQuestion(2)], false)[0].full).toBeNull();
  });

  it("gives each group its levels, children's questions to the children's groups, and filters by testament", () => {
    const questions = fixtureQuestions(240);
    const pools = poolsOf(questions);
    expect(poolsOf(questions)).toBe(pools); // built once per bank
    const levels = (group: (typeof GROUP_KEYS)[number]) => new Set(poolFor(pools, group, "").map((e) => e.level));
    expect(levels("little")).toEqual(new Set(["easy"]));
    expect(levels("kids")).toEqual(new Set(["easy", "medium"]));
    expect(levels("adults")).toEqual(new Set(["easy", "medium", "hard"]));
    expect(levels("experts")).toEqual(new Set(["medium", "hard"]));
    const childIds = new Set(questions.filter((q) => q.children).map((q) => q.question));
    expect(poolFor(pools, "kids", "").every((e) => childIds.has(e.frozen.text))).toBe(true);
    expect(poolFor(pools, "adults", "OT").every((e) => e.testament === "OT")).toBe(true);
    const sizes = poolSizes(pools, "NT");
    expect(sizes.adults).toBe(poolFor(pools, "adults", "NT").length);
    expect(sizes.adults + poolSizes(pools, "OT").adults).toBe(poolFor(pools, "adults", "").length);
  });
});

const BANK = path.resolve(__dirname, "../../../../data/questions/bank.json");
describe.skipIf(!fs.existsSync(BANK))("hot seat pools on the real question bank", () => {
  it("has at least 1,000 questions per group, and 300 in each testament", () => {
    const bank = JSON.parse(fs.readFileSync(BANK, "utf8")) as QuestionBank;
    const pools = poolsOf(bank.questions);
    const sizes = { both: poolSizes(pools, ""), ot: poolSizes(pools, "OT"), nt: poolSizes(pools, "NT") };
    console.info("Hot seat pool sizes:", JSON.stringify(sizes));
    for (const group of GROUP_KEYS) {
      expect(sizes.both[group], group).toBeGreaterThanOrEqual(1000);
      expect(sizes.ot[group], group).toBeGreaterThanOrEqual(300);
      expect(sizes.nt[group], group).toBeGreaterThanOrEqual(300);
    }
  }, 60_000);
});
