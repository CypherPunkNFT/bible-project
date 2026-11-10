import { describe, expect, it } from "vitest";
import { drawCard } from "./draw";
import { FOOTER, layoutResolved, printQuotes } from "./layout";
import { LOOK_IDS } from "./looks";
import { renderCard } from "./render";
import { SIZES, SIZE_IDS } from "./sizes";
import { resolveCard } from "./spec";
import { bereanVerse, fixedMeasure, recordingContext } from "./test-kit";

const text = bereanVerse("PSA", 23, 1)!;

describe("drawing a card", () => {
  it("draws the words in order, the reference, and the footer, for every design and size", () => {
    for (const look of LOOK_IDS) {
      for (const size of SIZE_IDS) {
        const card = resolveCard({ passage: { text, reference: "Psalm 23:1", book: 19 }, link: "https://bibleguide.io/verse-cards/psalm-23-1", look });
        const layout = layoutResolved(card, SIZES[size], fixedMeasure);
        const { context, texts } = recordingContext();
        drawCard(context, layout, card.look, 0.5, () => null);
        const drawn = texts().map((call) => String(call.args[0])).join("");
        const squash = (value: string) => value.replace(/\s+/g, "");
        expect(drawn, `${look} ${size}`).toBe(squash(printQuotes(text)) + squash("Psalm 23:1") + squash(FOOTER));
        const footer = texts().slice(-FOOTER.split(" ").length);
        expect(footer.every((call) => call.fillStyle === card.look.accent)).toBe(true);
      }
    }
  });

  it("paints a gradient corner to corner and strokes the ornament in the accent colour", () => {
    const card = resolveCard({ passage: { text, reference: "Psalm 23:1" }, link: "https://bibleguide.io", look: "dawn" });
    const layout = layoutResolved(card, SIZES.square, fixedMeasure);
    const { context, calls } = recordingContext();
    const made: string[] = [];
    drawCard(context, layout, card.look, 1, (data) => { made.push(data); return {} as Path2D; });
    expect(calls.find((call) => call.op === "createLinearGradient")?.args).toEqual([0, 0, 1080, 1080]);
    expect(calls.filter((call) => call.op === "addColorStop").map((call) => call.args)).toEqual([[0, "#35264A"], [1, "#94502F"]]);
    expect(made).toHaveLength(1);
    expect(calls.some((call) => call.op === "stroke")).toBe(true);
    expect(calls.find((call) => call.op === "set strokeStyle")?.args[0]).toBe("#FFDDB3");
  });
});

describe("making the picture", () => {
  it("fails with an error naming the size when the browser cannot draw (the test browser has no canvas)", async () => {
    await expect(renderCard({ passage: { text, reference: "Psalm 23:1" }, link: "https://bibleguide.io", look: "paper" }, "story")).rejects.toThrow(/story/);
  });

  it("fails, naming the problem, for a card that cannot be drawn", async () => {
    await expect(renderCard({ passage: { text, reference: "Psalm 23:1" }, link: "https://example.com", look: "paper" }, "square")).rejects.toThrow(/must be on https:\/\/bibleguide\.io/);
  });
});
