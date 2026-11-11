// Bible twenty questions: the shipped game file (design §15 "Data" and "The simulation as a test"). Every id is a real
// person, the values are well formed, the early-Genesis rule holds, every question passes the form rules, Jesus's
// values are the hand file's, the server's allow-list matches, and the play simulation does not get worse.
import { readFileSync } from "node:fs";
import data from "@/data/twenty-questions/twenty-questions.json";
import evidence from "@/data/twenty-questions/twenty-questions-evidence.json";
import { TQ_PEOPLE, TQ_TAGS, TQ_VERSION } from "../../../../server/twenty-questions-ids";
import { prepare, type TqData } from "./engine";
import { questionProblems } from "./questions";
import { TARGETS, playEveryone } from "./simulation";

const file = data as unknown as TqData;
const refs = (evidence as unknown as { version: string; refs: Record<string, Record<string, number>> });
const site = new Map((JSON.parse(readFileSync("data/study/people.json", "utf8")) as { id: string; g?: number | null }[]).map((row) => [row.id, row]));
const jesusFile = JSON.parse(readFileSync("scripts/twenty-questions/jesus.source.json", "utf8")) as { values: Record<string, string[]> };
const index = new Map(file.tags.map((t, i) => [t.id, i]));
const value = (personId: string, tagId: string) => file.people.find((p) => p.id === personId)!.v[index.get(tagId)!];

/**
 * The simulation's results when the two-pass model tagging of design §5.3 shipped (review sheet, 2026-11-11): 96.4 %,
 * 82.2 %, 65.7 % and 81.4 %. They are still below the design's targets (TARGETS); these floors stop the game from getting
 * worse. Raise them, never lower them, when the tags improve. (The hand-tagged build of 2026-11-10 measured 84.9 / 69.1 /
 * 46.6 / 59.6 %.)
 */
const FLOORS = { truthfulTier1: 0.96, truthfulPool: 0.82, dontKnowTier1: 0.65, oneSlipTier1: 0.81 };

describe("the shipped game file", () => {
  it("holds only real people from the site's list, never a tribe or a people, with unique ids and labels", () => {
    for (const p of file.people) {
      expect(site.has(p.id), p.id).toBe(true);
      expect(site.get(p.id)?.g ?? 0, `${p.id} is a group`).toBeFalsy();
    }
    expect(new Set(file.people.map((p) => p.id)).size).toBe(file.people.length);
    expect(new Set(file.people.map((p) => p.label.toLowerCase())).size).toBe(file.people.length);
    expect(file.people.filter((p) => p.t === 1).length).toBeGreaterThanOrEqual(140);
  });

  it("gives every person one allowed letter per tag, with n/a only for Jesus (set in the hand file)", () => {
    for (const p of file.people) {
      expect(p.v, p.id).toMatch(new RegExp(`^[yn?YN-]{${file.tags.length}}$`));
      if (p.id !== "jesus-isa-7-14") expect(p.v, p.id).not.toContain("-");
    }
    expect(() => prepare(file)).not.toThrow();
  });

  it("keeps implications and exclusions consistent for every person", () => {
    for (const p of file.people) for (const [t, tag] of file.tags.entries()) {
      if (p.v[t].toLowerCase() !== "y") continue;
      for (const other of tag.implies ?? []) expect(value(p.id, other).toLowerCase(), `${p.label}: ${tag.id} implies ${other}`).not.toBe("n");
      for (const other of tag.excludes ?? []) expect(value(p.id, other).toLowerCase(), `${p.label}: ${tag.id} excludes ${other}`).not.toBe("y");
    }
  });

  it("leaves Israelite and another nation unsure for everyone before Jacob's sons (design §4.2)", () => {
    // People of the Genesis eras who are Jacob, his children or later, and so may be yes or no.
    const fromJacob = new Set(["israel-gen-25-26", "joseph-gen-30-24", "dinah-gen-30-21", "tamar-gen-38-6", "ephraim-gen-41-52", "manasseh-gen-41-51",
      "potiphar-gen-37-36", "pharaoh-gen-37-36"]);
    const sonOfJacob = index.get("son-of-jacob")!;
    const early = file.people.filter((p) => (value(p.id, "era-flood") === "y" || value(p.id, "era-patriarchs") === "y")
      && value(p.id, "era-exodus") !== "y" && p.v[sonOfJacob] !== "y" && !fromJacob.has(p.id));
    expect(early.map((p) => p.id)).toEqual(expect.arrayContaining(["abraham-gen-11-26", "esau-gen-25-25", "noah-gen-5-29"]));
    for (const p of early) expect(`${value(p.id, "israelite")}${value(p.id, "foreign")}`, p.label).toBe("??");
    expect(value("israel-gen-25-26", "israelite")).toBe("y");
  });

  it("writes every question to the form rules (design §6)", () => {
    const all = file.tags.map((t) => t.q);
    for (const t of file.tags) expect(questionProblems(t.q, all), t.id).toEqual([]);
  });

  it("matches Jesus's values to the hand file", () => {
    const jesus = file.people.find((p) => p.id === "jesus-isa-7-14")!;
    for (const [tagId, [letter]] of Object.entries(jesusFile.values)) expect(jesus.v[index.get(tagId)!], tagId).toBe(letter);
  });

  it("keeps the evidence file and the server's allow-list in step with the game file", () => {
    expect(refs.version).toBe(file.version);
    for (const [personId, byTag] of Object.entries(refs.refs)) {
      expect(TQ_PEOPLE.has(personId), personId).toBe(true);
      for (const [tagId, verse] of Object.entries(byTag)) {
        expect(index.has(tagId), tagId).toBe(true);
        expect(verse).toBeGreaterThan(1_000_000);
      }
    }
    expect(TQ_VERSION).toBe(file.version);
    expect([...TQ_PEOPLE].sort()).toEqual(file.people.map((p) => p.id).sort());
    expect([...TQ_TAGS].sort()).toEqual(file.tags.map((t) => t.id).sort());
  });

  it("finds people in the play simulation at least as often as when it shipped (design §5.5)", () => {
    const { rates } = playEveryone(file);
    for (const key of Object.keys(FLOORS) as (keyof typeof FLOORS)[]) {
      expect(rates[key], key).toBeGreaterThanOrEqual(FLOORS[key]);
      expect(FLOORS[key], `${key}: a floor above the design's target is a mistake`).toBeLessThanOrEqual(TARGETS[key]);
    }
  }, 60_000);
});
