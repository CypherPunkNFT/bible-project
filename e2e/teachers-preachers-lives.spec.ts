import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Preachers & authors, sections 04–06 (approved mock-up: design/authors-directions/teachers/lives, crossing, handed):
// who was alive in a year (the lifelines canvas, its cursor, play, order, the side panel and its map), two lives side by
// side, and the documented links between teachers. Expected numbers are computed from the page's own data file.
// Runs at desktop, tablet and phone, with reduced motion (so the cursor jumps instead of sweeping).

interface Person { id: string; name: string; short: string; born: number; died: number | null; places: [string, number, number, number][] }
interface Data { people: Person[]; links: { from: string; to: string; note: string }[] }
const DATA = JSON.parse(readFileSync(fileURLToPath(new URL("../src/data/teachers/people.json", import.meta.url)), "utf8")) as Data;
const byId = (id: string) => { const p = DATA.people.find((x) => x.id === id); if (!p) throw new Error(`test data: no ${id}`); return p; };
const aliveIn = (year: number) => DATA.people.filter((p) => p.born <= year && year <= (p.died ?? 2026));
const plural = (n: number, one: string) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : `${one}s`}`;

const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
const drawer = (page: Page) => page.getByRole("dialog", { name: "Teacher profile" });

async function open(page: Page, id: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`/teachers/preachers-and-authors#${id}`);
  const section = page.locator(`#${id}`);
  await section.scrollIntoViewIfNeeded();
  return { section, errors };
}

test("04 lives: the year opens on 1660 with those alive, and the keys, play and a click move it", async ({ page }) => {
  const { section, errors } = await open(page, "lives");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("Who was alive at the same time?");
  await expect(section.locator(".tp-num")).toHaveText("04");
  const slider = section.getByRole("slider", { name: "Year" });
  const year = section.locator(".life-year");
  await expect(year).toHaveText("1660");
  await expect(slider).toHaveAttribute("aria-valuenow", "1660");
  await expect(section.locator(".life-meta b")).toHaveText(`${plural(aliveIn(1660).length, "teacher")} alive`);
  await expect(section.locator(".life-alive .life-chip")).toHaveCount(aliveIn(1660).length);

  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(year).toHaveText("1661");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(year).toHaveText("1671");
  await page.keyboard.press("Home");
  await expect(year).toHaveText("1500");
  await expect(section.locator(".life-plain")).toHaveText("No teacher in the library was alive yet. Drag right.");
  await page.keyboard.press("End");
  await expect(year).toHaveText("2026");
  await expect(section.locator(".life-alive .life-chip")).toHaveCount(aliveIn(2026).length);

  // A click on the empty axis strip moves the cursor there.
  const box = await slider.boundingBox();
  if (!box) throw new Error("the lifelines canvas has no box");
  const narrow = box.width < 640, padL = narrow ? 50 : 72, padR = narrow ? 12 : 18;
  const x = padL + ((1800 - 1500) / (2026 - 1500)) * (box.width - padL - padR);
  await page.mouse.click(box.x + x, box.y + 12);
  await expect.poll(async () => Math.abs(Number(await year.textContent()) - 1800)).toBeLessThanOrEqual(1);

  // Play runs the years forward; pause stops them.
  await page.keyboard.press("Home");
  const play = section.getByRole("button", { name: "Play through the years" });
  await play.click();
  await expect(section.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => Number(await year.textContent())).toBeGreaterThan(1502);
  await section.getByRole("button", { name: "Pause" }).click();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("04 lives: order, tradition chips and the map switch; a name opens the profile", async ({ page }) => {
  const { section, errors } = await open(page, "lives");
  const order = section.getByRole("group", { name: "Order the lives" });
  await order.getByRole("button", { name: "By tradition" }).click();
  await expect(order.getByRole("button", { name: "By tradition" })).toHaveAttribute("aria-pressed", "true");
  await expect(order.getByRole("button", { name: "By birth" })).toHaveAttribute("aria-pressed", "false");
  const puritans = section.getByRole("group", { name: "Traditions" }).getByRole("button", { name: /Puritans/ });
  await puritans.click();
  await expect(puritans).toHaveAttribute("aria-pressed", "true");
  await puritans.click();
  await expect(puritans).toHaveAttribute("aria-pressed", "false");

  const map = section.getByRole("group", { name: "Map" });
  await map.getByRole("button", { name: "Atlantic" }).click();
  await expect(map.getByRole("button", { name: "Atlantic" })).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".life-inset svg")).toHaveAttribute("viewBox", /^0 0 /);
  await expect(section.locator(".life-pin[style*='opacity: 1']")).not.toHaveCount(0);

  const first = aliveIn(1660)[0];
  await section.locator(".life-alive .life-chip", { hasText: first.short }).click();
  await expect(drawer(page)).toBeVisible();
  await expect(drawer(page)).toContainText(first.name);
  expect(errors).toEqual([]);
  await noSideScroll(page);
});

test("05 crossing: Calvin and Knox open the section; swap, a suggestion and two lives that never met", async ({ page }) => {
  const { section, errors } = await open(page, "crossing");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("Did their lives cross?");
  const first = section.getByRole("combobox", { name: "First teacher" }), second = section.getByRole("combobox", { name: "Second teacher" });
  await expect(first).toHaveValue("author-john-calvin");
  await expect(second).toHaveValue("author-john-knox");
  const calvin = byId("author-john-calvin"), knox = byId("author-john-knox");
  const s = Math.max(calvin.born, knox.born), e = Math.min(calvin.died ?? 2026, knox.died ?? 2026);
  const say = section.locator(".xing-say");
  await expect(say).toContainText(`Calvin and Knox were both alive for ${plural(e - s, "year")}, from ${s} to ${e}.`);
  await expect(say).toContainText("They lived in the same city: Geneva");
  await expect(second.locator('option[value="author-john-calvin"]')).toHaveAttribute("disabled", "");
  await expect(section.locator(".xing-suggest .xing-chip").first()).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".xing-svg text", { hasText: "Geneva" }).first()).toBeVisible();

  await section.getByRole("button", { name: "Swap the two teachers" }).click();
  await expect(first).toHaveValue("author-john-knox");
  await expect(say).toContainText("Knox and Calvin were both alive");

  const chip = section.locator(".xing-suggest .xing-chip").nth(1);
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(first).not.toHaveValue("author-john-knox");

  await first.selectOption("author-john-calvin");
  await second.selectOption("author-charles-spurgeon");
  await expect(say).toContainText("Their lives never overlapped.");
  const spurgeon = byId("author-charles-spurgeon");
  await section.locator(".xing-who", { hasText: spurgeon.name }).click();
  await expect(drawer(page)).toContainText(spurgeon.name);
  expect(errors).toEqual([]);
  await noSideScroll(page);
});

/** A point in the middle of a curve, in page pixels. */
async function curveMiddle(curve: Locator) {
  return curve.evaluate((path: SVGPathElement) => {
    const point = path.getPointAtLength(path.getTotalLength() / 2), matrix = path.getScreenCTM();
    if (!matrix) throw new Error("the curve has no screen position");
    return { x: point.x * matrix.a + point.y * matrix.c + matrix.e, y: point.x * matrix.b + point.y * matrix.d + matrix.f };
  });
}

test("06 handed: the Princeton chain is numbered, curves read out their note, and All links sums them up", async ({ page }, info) => {
  const { section, errors } = await open(page, "handed");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("Who passed it to whom");
  const chips = section.locator(".hand-chip");
  await expect(chips).toHaveCount(7);
  await expect(chips.first()).toHaveAttribute("aria-pressed", "true");
  const steps = section.locator(".hand-steps li");
  const count = await steps.count();
  expect(count).toBeGreaterThan(1);
  await expect(chips.first().locator("small")).toHaveText(String(count));
  await expect(section.locator(".hand-num.on")).toHaveCount(count);
  for (let i = 0; i < count; i++) await expect(section.locator(".hand-num.on text").filter({ hasText: new RegExp(`^${i + 1}$`) })).toHaveCount(1);

  // Point at (or tap) the first lit curve: its note shows in the tooltip and its step lights up.
  await section.locator(".hand-host").scrollIntoViewIfNeeded();
  // (Measured and pointed at again until it holds: a scroll, such as the page settling on its #address, hides the tip.)
  await expect(async () => {
    const { x, y } = await curveMiddle(section.locator(".hand-link.on .hand-hit").first());
    if (info.project.name === "phone") await page.touchscreen.tap(x, y); else { await page.mouse.move(x - 3, y); await page.mouse.move(x, y); }
    await expect(page.locator(".hand-tip.show")).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(section.locator(".hand-steps li.hot")).toHaveCount(1);
  const note = await section.locator(".hand-steps li.hot p").textContent();
  await expect(page.locator(".hand-tip")).toContainText(note ?? "");

  await chips.filter({ hasText: "All links" }).click();
  await expect(section.locator(".hand-note h3")).toHaveText(`All ${DATA.links.length} links`);
  await expect(section.locator(".hand-num.on")).toHaveCount(0);
  await section.locator(".hand-steps .hand-pair button").first().click();
  await expect(drawer(page)).toBeVisible();
  expect(errors).toEqual([]);
  await noSideScroll(page);
});
