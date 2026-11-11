// Family charades: the small helpers behind the redesigned screens: the cards-left count on the card, the sample
// card's titles and the recap bar's shares.
import file from "@/data/charades/scenes.json";
import { answerScene, cardsLeft, deal, newDealer, type Scene, type ScenesFile } from "./deck";
import { bestShares, sampleTitles } from "./display";

const scenes = (file as unknown as ScenesFile).scenes;
const storyOf = (id: string) => scenes.find((s) => s.id === id)?.story;

describe("cards left on the card", () => {
  it("counts the fresh scenes ahead, one per story, plus the passes that come back", () => {
    const noah = scenes.filter((s) => s.story && s.story === scenes.find((x) => x.id === "noah-builds-ark")?.story).map((s) => s.id);
    expect(noah.length).toBeGreaterThan(1);
    const single = scenes.filter((s) => !s.story).slice(0, 3).map((s) => s.id);
    const order = [...noah, ...single];
    let dealer = newDealer(order);
    expect(cardsLeft(dealer, storyOf)).toBe(1 + single.length); // the Noah scenes count once
    const first = deal(dealer, storyOf);
    dealer = answerScene(first.dealer, first.id!, "pass");
    expect(cardsLeft(dealer, storyOf)).toBe(single.length + 1); // the other Noah scenes are skipped; the pass comes back
    const second = deal(dealer, storyOf);
    dealer = answerScene(second.dealer, second.id!, "correct");
    expect(cardsLeft(dealer, storyOf)).toBe(single.length - 1 + 1);
  });
  it("is zero when every scene has been got", () => {
    const [a, b] = scenes.filter((s) => !s.story).slice(0, 2).map((s) => s.id);
    let dealer = newDealer([a, b]);
    const first = deal(dealer, storyOf); dealer = answerScene(first.dealer, a, "correct");
    const second = deal(dealer, storyOf); dealer = answerScene(second.dealer, b, "correct");
    expect(cardsLeft(dealer, storyOf)).toBe(0);
  });
});

describe("the start screen's sample card", () => {
  it("shows four well-known scenes from the real file", () => {
    const titles = sampleTitles(scenes);
    expect(titles).toHaveLength(4);
    expect(titles[0]).toMatch(/Noah/);
    expect(new Set(titles).size).toBe(4);
  });
  it("fills from short titles when the well-known ids are missing", () => {
    const made: Scene[] = scenes.filter((s) => !["noah-builds-ark", "david-goliath", "jonah-fish", "lions-den"].includes(s.id));
    const titles = sampleTitles(made);
    expect(titles).toHaveLength(4);
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(22);
  });
});

describe("the recap's bar against the best", () => {
  it("measures both against the larger, never dividing by zero", () => {
    expect(bestShares(0, 0)).toEqual({ score: 0, best: 0 });
    expect(bestShares(4, 8)).toEqual({ score: 0.5, best: 1 });
    expect(bestShares(8, 4)).toEqual({ score: 1, best: 0.5 });
  });
});
