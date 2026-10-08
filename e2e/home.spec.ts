import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("home: landing designs switch in place and keep flat illustrated shortcuts", async ({ page }) => {
  await page.goto("/?landing=outline");
  const options = page.getByRole("navigation", { name: "Landing designs" });
  const shortcuts = page.getByRole("navigation", { name: "Explore the five collections" });
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    const themeSwitch = page.getByRole("switch", { name: "Dark mode" });
    if ((await themeSwitch.getAttribute("aria-checked")) !== String(theme === "dark")) await themeSwitch.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const [id, name] of [["outline", "Outlined boxes"], ["gallery", "Open gallery"], ["rail", "Illustrated rail"]]) {
      await options.getByRole("button", { name: new RegExp(name) }).click();
      await expect(page.locator(".home-hub")).toHaveAttribute("data-landing", id);
      await expect(options.getByRole("button", { name: new RegExp(name) })).toHaveAttribute("aria-pressed", "true");
      await expect(shortcuts.getByRole("link")).toHaveCount(5);
      await expect(shortcuts.locator(".home-doorway-art > svg")).toHaveCount(5);
      await expect(page.getByRole("link", { name: "Explore the collections", exact: true })).toHaveCount(0);
      expect(await shortcuts.getByRole("link").first().evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const box = await shortcuts.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
      await page.screenshot({ path: `front-end capture/2026-10-07/landing-${id}-${theme}-${test.info().project.name}.png` });
    }
  }
  await shortcuts.getByRole("link", { name: /^Bible/ }).click();
  await expect(page).toHaveURL(/\/bible$/);
  await page.goto("/");
  await expect(options).toHaveCount(0);
});

test("home: illustrated collections fit both themes and all destinations exist", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const index = JSON.parse(readFileSync("data/topics/index.json", "utf8"));
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("One Word.A world to discover.");
    const paths = page.getByRole("navigation", { name: "Explore the five collections" });
    await expect(paths.getByRole("link")).toHaveCount(5);
    await expect(paths.locator(".home-doorway-art > svg")).toHaveCount(5);
    const opening = await page.locator(".home-opening").boundingBox();
    const cards = await paths.boundingBox();
    const marquee = await page.locator(".home-preview-strip").boundingBox();
    const viewportHeight = page.viewportSize()!.height;
    expect(opening!.y + opening!.height).toBeGreaterThanOrEqual(viewportHeight - 1);
    expect(cards!.y + cards!.height).toBeLessThanOrEqual(viewportHeight + 1);
    expect(marquee!.y).toBeGreaterThanOrEqual(viewportHeight);
    for (const [name, url] of [["Bible", "/bible"], ["Study", "/study"], ["Apologetics", "/apologetics"], ["Topics", "/topics"], ["Atlas", "/study/atlas"]]) {
      await expect(paths.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", url);
    }
    const links = await page.locator('.home-hub a[href^="/topics/"]').evaluateAll((elements) => elements.map((el) => el.getAttribute("href")!));
    for (const href of links) {
      const id = href.split("/").at(-1);
      expect(href.includes("/c/") ? index.categories.some((category: { id: string }) => category.id === id) : Boolean(index.topics[id!]), href).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `front-end capture/2026-10-07/home-${theme}-${test.info().project.name}.png`, fullPage: true });
    await page.screenshot({ path: `front-end capture/2026-10-07/home-hero-${theme}-${test.info().project.name}.png` });
  }
  expect(errors).toEqual([]);
});

test("home: reading memory and preview navigation open the intended pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home-hero-actions").getByRole("link", { name: "Begin with John 1" })).toHaveAttribute("href", "/read/kjv/JHN/1");
  await page.evaluate(() => localStorage.setItem("bp-last-read", "/read/kjv/ROM/8"));
  await page.reload();
  const resume = page.locator(".home-hero-actions").getByRole("link", { name: "Continue: Romans 8" });
  await expect(resume).toHaveAttribute("href", "/read/kjv/ROM/8");
  await resume.click();
  await expect(page).toHaveURL(/\/read\/kjv\/ROM\/8$/);
  await page.goBack();
  await page.locator(".home-study-card").filter({ hasText: "His names" }).click();
  await expect(page).toHaveURL(/\/study\/names$/);
  await expect(page.getByRole("button", { name: "Expand JESUS CHRIST names" })).toBeVisible();
  for (const [name, heading] of [["Who is Jesus?", "Jesus"], ["Can I trust Scripture?", "Bible"], ["What do I do with doubt?", "Doubt"]]) {
    await page.goto("/");
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(new RegExp(heading, "i"));
  }
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explore the collections", exact: true })).toHaveCount(0);
});

test("home: marquee keeps moving on hover, supports deliberate pause and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const track = page.locator(".home-marquee-track");
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationName)).toBe("home-marquee");
  await page.locator(".home-marquee").hover();
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
  await page.getByRole("button", { name: "Pause collection previews" }).click();
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.getByRole("button", { name: "Play collection previews" }).click();
  await page.mouse.move(0, 0);
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
  const first = page.locator(".home-marquee-group").first().getByRole("link").first();
  await first.focus();
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/study\/gospels$/);
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(page.locator('.home-marquee-group[aria-hidden="true"]').first()).toBeHidden();
  await expect(page.locator(".home-floating-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause collection previews" })).toBeHidden();
});

test("home: glimpse band covers wide screens through the loop seam and after resizing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Wide-screen coverage uses the desktop browser");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const frame = page.locator(".home-marquee");
  for (const width of [1440, 2552, 3840, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => frame.evaluate((el) => {
      const group = el.querySelector(".home-marquee-group")!;
      return el.querySelectorAll(".home-marquee-group").length >= Math.ceil(el.clientWidth / group.getBoundingClientRect().width) + 1;
    })).toBe(true);
    const coverage = await frame.evaluate((el) => {
      const track = el.querySelector(".home-marquee-track")!;
      const animation = track.getAnimations()[0];
      animation.pause();
      const duration = Number(animation.effect!.getTiming().duration);
      const cards = Array.from(el.querySelectorAll(".home-preview"));
      const frame = el.getBoundingClientRect();
      const phases = [0, .5, .9999, 1, 1.0001].map((phase) => {
        animation.currentTime = phase * duration;
        const bounds = cards.map((card) => card.getBoundingClientRect());
        return { left: bounds[0].left - frame.left, right: bounds.at(-1)!.right - frame.right };
      });
      return phases;
    });
    for (const phase of coverage) {
      expect(phase.left).toBeLessThanOrEqual(1);
      expect(phase.right).toBeGreaterThanOrEqual(-16);
    }
    if (width === 2552) {
      await frame.scrollIntoViewIfNeeded();
      await page.screenshot({ path: "front-end capture/2026-10-07/home-marquee-wide.png" });
    }
  }
});
