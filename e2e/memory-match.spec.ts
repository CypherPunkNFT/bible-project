// Memory card match on real phones' sizes (docs/features/memory-match/design.md 8 and 14): a Hard board with the
// longest labels fits a 360 × 640 screen with no card text clipped, scrolls by at most one row at 320 × 568, and turning
// the phone never moves a card. Every card of the board is turned up in turn, two at a time (a non-pair, as in play),
// for the People and the Places versions. Run: npx playwright test -c e2e/memory-match.config.ts (after a build).
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

interface Pair { id: string; who: string; story: string; tier: number }
interface Data { stamp: string; characters: Record<string, { label: string; first: string }>; pairs: Pair[] }
const read = (name: string) => JSON.parse(readFileSync(`src/data/memory-match/${name}.json`, "utf8")) as Data;
const VERSIONS = [{ key: "people", data: read("pairs") }, { key: "places", data: read("places") }] as const;
const length = (text: string) => text.split(String.fromCharCode(0xad)).join("").length;

/** Twelve pairs, longest labels first, one per character and first name: the hardest text the board can get. */
function longestBoard(data: Data): Pair[] {
  const sorted = [...data.pairs].sort((a, b) =>
    Math.max(length(b.story), length(data.characters[b.who].label)) - Math.max(length(a.story), length(data.characters[a.who].label)));
  const chosen: Pair[] = [];
  for (const pair of sorted) {
    const first = data.characters[pair.who].first;
    if (chosen.length < 12 && !chosen.some((p) => data.characters[p.who].first === first)) chosen.push(pair);
  }
  return chosen;
}

/** A saved Hard board of the longest labels with pair `at`'s who card and the next pair's story card face up. */
async function openBoard(page: Page, columns: number, version: (typeof VERSIONS)[number], at = 0) {
  const pairs = longestBoard(version.data);
  const cards = pairs.flatMap((p) => [{ pair: p.id, kind: "who" }, { pair: p.id, kind: "story" }]);
  const game = { stamp: version.data.stamp, deck: "mixed", difficulty: "hard", columns, cards,
    up: [2 * at, (2 * at + 3) % cards.length], matched: cards.map(() => null), found: [], moves: 11, players: ["You"],
    turn: 0, elapsedMs: 0, studying: false, version: version.key };
  await page.goto("/games");
  await page.evaluate((saved) => sessionStorage.setItem("bp-memory-match-game", saved), JSON.stringify(game));
  await page.goto("/games/memory-match");
  await expect(page.getByRole("group", { name: /^Cards, \d columns by 6 rows$/ })).toBeVisible();
  await expect(page.locator(".mm-card__text")).toHaveCount(2);
}

/** Scrolls so the game bar sits right under the sticky site header, as a player would hold it. */
async function boardInView(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const bar = document.querySelector(".mm-track")!;
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

for (const version of VERSIONS) {
  test(`a ${version.key} Hard board of the longest labels fits a 360 × 640 phone with no text clipped`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (let at = 0; at < 12; at += 1) {
      await openBoard(page, 4, version, at);
      const { overflow } = await boardInView(page);
      expect(overflow, `pair ${at}`).toBeLessThanOrEqual(1);
      expect(await clippedTexts(page), `pair ${at}`).toEqual([]);
    }
  });

  test(`at 320 × 568 the ${version.key} Hard board scrolls by no more than one row`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    for (let at = 0; at < 12; at += 1) {
      await openBoard(page, 4, version, at);
      const { overflow, row } = await boardInView(page);
      expect(overflow, `pair ${at}`).toBeLessThanOrEqual(row);
      expect(await clippedTexts(page), `pair ${at}`).toEqual([]);
    }
  });
}

test("turning the phone keeps every card in its row and column", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openBoard(page, 4, VERSIONS[0]);
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
