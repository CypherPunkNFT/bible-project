// Memory card match on real phones' sizes (docs/features/memory-match/design.md 8 and 14): a Hard board with the
// longest labels fits a 360 × 640 screen with no card text clipped, scrolls by at most one row at 320 × 568, and turning
// the phone never moves a card. Run: npx playwright test -c e2e/memory-match.config.ts (after a build).
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

interface Pair { id: string; who: string; story: string; tier: number }
const data = JSON.parse(readFileSync("src/data/memory-match/pairs.json", "utf8")) as { stamp: string; characters: Record<string, { label: string; first: string }>; pairs: Pair[] };
const length = (text: string) => text.split(String.fromCharCode(0xad)).join("").length;

/** Twelve pairs, longest labels first, one per character and first name: the hardest text the board can get. */
function longestBoard(): Pair[] {
  const sorted = [...data.pairs].sort((a, b) =>
    Math.max(length(b.story), length(data.characters[b.who].label)) - Math.max(length(a.story), length(data.characters[a.who].label)));
  const chosen: Pair[] = [];
  for (const pair of sorted) {
    const first = data.characters[pair.who].first;
    if (chosen.length < 12 && !chosen.some((p) => data.characters[p.who].first === first)) chosen.push(pair);
  }
  return chosen;
}

/** A saved Hard board, every pair but the last already matched, so 22 cards show their words. */
async function openBoard(page: Page, columns: number) {
  const pairs = longestBoard();
  const cards = pairs.flatMap((p) => [{ pair: p.id, kind: "who" }, { pair: p.id, kind: "story" }]);
  const matched = cards.map((_, n) => (n < cards.length - 2 ? 0 : null));
  const game = { stamp: data.stamp, deck: "mixed", difficulty: "hard", columns, cards, up: [], matched,
    found: pairs.slice(0, -1).map((p) => p.id), moves: 11, players: ["You"], turn: 0, elapsedMs: 0, studying: false };
  await page.goto("/games");
  await page.evaluate((saved) => sessionStorage.setItem("bp-memory-match-game", saved), JSON.stringify(game));
  await page.goto("/games/memory-match");
  await expect(page.getByRole("group", { name: /^Cards, \d columns by 6 rows$/ })).toBeVisible();
}

/** Scrolls so the game bar sits right under the sticky site header, as a player would hold it. */
async function boardInView(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const bar = document.querySelector(".mm-bar")!;
    const top = header ? header.getBoundingClientRect().height : 0;
    window.scrollTo(0, bar.getBoundingClientRect().top + window.scrollY - top);
    const grid = document.querySelector(".mm-grid")!.getBoundingClientRect();
    const card = document.querySelector(".mm-card")!.getBoundingClientRect();
    return { overflow: grid.bottom - window.innerHeight, row: card.height };
  });
}

async function clippedTexts(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll(".mm-card")].flatMap((card) => {
    const text = card.querySelector(".mm-card__text");
    if (!text) return [];
    const box = card.getBoundingClientRect();
    const words = text.getBoundingClientRect();
    const clipped = words.left < box.left - 1 || words.right > box.right + 1 || words.top < box.top - 1 || words.bottom > box.bottom + 1;
    return clipped || text.scrollWidth > text.clientWidth + 1 ? [text.textContent] : [];
  }));
}

test("a Hard board of the longest labels fits a 360 × 640 phone with no text clipped", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openBoard(page, 4);
  const { overflow } = await boardInView(page);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(await clippedTexts(page)).toEqual([]);
});

test("at 320 × 568 the Hard board scrolls by no more than one row", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openBoard(page, 4);
  const { overflow, row } = await boardInView(page);
  expect(overflow).toBeLessThanOrEqual(row);
  expect(await clippedTexts(page)).toEqual([]);
});

test("turning the phone keeps every card in its row and column", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openBoard(page, 4);
  const places = () => page.evaluate(() => {
    const boxes = [...document.querySelectorAll(".mm-card")].map((card) => card.getBoundingClientRect());
    const xs = [...new Set(boxes.map((b) => Math.round(b.left)))].sort((a, b) => a - b);
    const ys = [...new Set(boxes.map((b) => Math.round(b.top)))].sort((a, b) => a - b);
    return boxes.map((b) => [ys.indexOf(Math.round(b.top)), xs.indexOf(Math.round(b.left))]);
  });
  const before = await places();
  await page.setViewportSize({ width: 640, height: 360 });
  expect(await places()).toEqual(before);
  expect(new Set(before.map(([, column]) => column)).size).toBe(4);
});
