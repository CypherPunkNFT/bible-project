import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { ROOT_ACCESS } from "./testimony-fixtures";

const origin = "http://127.0.0.1:8934";
const local = (value: string) => { const url = new URL(value); return url.pathname + url.search + url.hash; };
async function invite(request: APIRequestContext) {
  expect((await request.post("/api/testimonies/session", { headers: { Origin: origin }, data: { token: ROOT_ACCESS } })).ok()).toBeTruthy();
  const response = await request.post("/api/testimonies/invitations", { headers: { Origin: origin }, data: {} });
  expect(response.status()).toBe(201);
  return await response.json() as { id: string; url: string };
}
async function fillStory(page: Page, name: string) {
  await page.getByLabel("Public name", { exact: true }).fill(name);
  await page.getByLabel("A title for your story").fill("An isolated browser test story");
  await page.getByLabel("Story theme (optional)").selectOption("Hope");
  await page.getByLabel("When it happened (optional)").fill("Spring 2022");
  await page.getByLabel("A short blurb", { exact: true }).fill("This fictional story exists only in a disposable test database. It checks that a person's testimony is saved, linked to their inviter, and available again after reloading the page.");
}

test("canonical page has real story details and no preview controls", async ({ page }, info) => {
  if (info.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Testimonies", exact: true }).click();
  await expect(page).toHaveURL(/\/testimonies$/);
  await page.getByRole("button", { name: /Maya New beginnings/ }).click();
  await expect(page.locator(".testimony-details")).toContainText("Story themeNew beginnings");
  await expect(page.locator(".testimony-details")).toContainText("Shared on");
  await expect(page.getByText(/Design preview|Reset preview|Live policy|Add sample story/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.goto("/testimonies/design");
  await expect(page).toHaveURL(/\/testimonies$/);
});

test("invitation publishes once, survives reload and grants private access on another device", async ({ page, playwright, browser }, info) => {
  const request = await playwright.request.newContext({ baseURL: origin });
  const invitation = await invite(request);
  await page.goto(local(invitation.url));
  await expect(page.getByText("Daniel invited you", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/testimonies\/join$/);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  const name = "Guest " + info.project.name;
  await fillStory(page, name);
  await page.getByRole("button", { name: "Publish testimony", exact: true }).click();
  const access = page.getByLabel("Private access link", { exact: true });
  await expect(access).toHaveValue(/^https:\/\/bible-project-4af.pages.dev\/testimonies\/access#key=/);
  const url = await access.inputValue();
  await page.getByRole("button", { name: "I've saved my link" }).click();
  await page.reload();
  await page.getByRole("button", { name: "My testimony", exact: true }).click();
  await expect(page.getByLabel("Public name", { exact: true })).toHaveValue(name);
  await expect(page.getByLabel("Story theme (optional)")).toHaveValue("Hope");
  const second = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const secondPage = await second.newPage();
  await secondPage.goto(origin + local(url));
  await expect(secondPage.getByLabel("Public name", { exact: true })).toHaveValue(name);
  await expect(secondPage).toHaveURL(/\/testimonies$/);
  await second.close();
  await page.getByRole("navigation", { name: "Testimonies", exact: true }).getByRole("button", { name: "Invite someone", exact: true }).click();
  await page.getByRole("button", { name: "Create invitation", exact: true }).click();
  await expect(page.getByRole("img", { name: "QR code for your testimony invitation" })).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(/^https:\/\/bible-project-4af.pages.dev\/testimonies\/join#code=/);
  await page.getByRole("button", { name: "My testimony", exact: true }).click();
  await page.getByRole("button", { name: "Withdraw my testimony" }).click();
  await expect(page.getByText("Your story is not currently public.", { exact: true })).toBeVisible();
  await request.dispose();
});

test("two main destinations and a guest preview that never publishes or changes the inviter", async ({ page }, info) => {
  const writes: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST" && /\/api\/testimonies\/(submissions|invitations)$/.test(request.url())) writes.push(request.url()); });
  if (info.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/testimonies");
  const navigation = page.getByRole("navigation", { name: "Testimonies", exact: true });
  await expect(navigation.getByRole("button")).toHaveText(["Explore the branches", "Invite someone"]);
  await navigation.getByRole("button", { name: "Invite someone", exact: true }).click();
  await page.getByRole("button", { name: "See the guest experience" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  const publish = page.getByRole("button", { name: "Publish testimony", exact: true });
  await expect(publish).toBeDisabled();
  await expect(publish).toHaveCSS("opacity", "0.6");
  await fillStory(page, "Preview only");
  await page.getByLabel("A title for your story").press("Enter");
  await expect(page.getByRole("region", { name: "Guest experience preview" })).toBeVisible();
  await page.getByRole("button", { name: "Back to your invitation" }).click();
  await page.getByRole("button", { name: "See the guest experience" }).click();
  await expect(page.getByLabel("Public name", { exact: true })).toHaveValue("");
  expect(writes).toEqual([]);

  // Only the signed-in contributor can originate invitations, regardless of the selected story.
  expect((await page.request.post("/api/testimonies/session", { headers: { Origin: origin }, data: { token: ROOT_ACCESS } })).ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("button", { name: "My testimony", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Ruth Grace/ }).click();
  await expect(page.getByRole("complementary", { name: "Selected testimony" }).getByRole("button")).toHaveText(["Read the full testimony"]);
  await navigation.getByRole("button", { name: "Invite someone", exact: true }).click();
  await expect(page.getByText("An invitation from Daniel", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "See the guest experience" }).click();
  await expect(page.getByText("Daniel invited you", { exact: true })).toBeVisible();
  await expect(publish).toBeDisabled();
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "front-end capture/2026-10-04/testimonies-guest-preview-" + info.project.name + ".png", fullPage: true });
});

test("an empty collection starts with Lucas alone without inventing or publishing stories", async ({ page, request }, info) => {
  const before = (await (await request.get("/api/testimonies/branches")).json()).total;
  const writes: string[] = [];
  page.on("request", (request) => { if (request.method() !== "GET") writes.push(request.url()); });
  await page.route("**/api/testimonies/branches?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ nodes: [], ancestors: [], rootId: null, hasMore: false, total: 0 }) }));
  await page.goto("/testimonies");
  await expect(page.locator(".testimony-tree-node")).toHaveCount(1);
  await expect(page.locator(".testimony-author h2")).toHaveText("Lucas");
  await expect(page.locator(".testimony-story-body")).toContainText("His testimony will appear here when he shares it");
  await expect(page.getByText(/Three trees|Many beginnings|Fictional people and stories|Explore this branch|Explore example trees/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Read the full testimony", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "front-end capture/2026-10-04/testimonies-lucas-" + info.project.name + ".png", fullPage: true });
  expect((await (await request.get("/api/testimonies/branches")).json()).total).toBe(before);
  expect(writes).toEqual([]);
});

test("a 5,000-word testimony saves separately from its blurb and opens in a scrollable reader", async ({ page, playwright }, info) => {
  const request = await playwright.request.newContext({ baseURL: origin });
  await page.goto(local((await invite(request)).url));
  await fillStory(page, "Long story " + info.project.name);
  const blurb = "This brief introduction stays beside the tree while the complete journey has room to be read in full.";
  const full = Array.from({ length: 100 }, (_, i) => "Paragraph " + (i + 1) + ": " + "This is a fictional passage for testing a long testimony. ".repeat(5)).join("\n\n") + "\n\nThese are the final words of the full testimony.";
  await page.getByLabel("A short blurb", { exact: true }).fill(blurb);
  await page.getByRole("button", { name: "Add your full testimony", exact: true }).click();
  await page.getByLabel("Your full testimony (optional)", { exact: true }).fill(full);
  await page.getByRole("button", { name: "Collapse full testimony", exact: true }).click();
  await page.getByRole("button", { name: "Continue your full testimony", exact: true }).click();
  await expect(page.getByLabel("Your full testimony (optional)", { exact: true })).toHaveValue(full);
  await page.getByRole("button", { name: "Publish testimony", exact: true }).click();
  await expect(page.getByLabel("Private access link", { exact: true })).toBeVisible();
  const account = await (await page.request.get("/api/testimonies/me")).json();
  expect(account.person.body).toBe(full); expect(account.person.blurb).toBe(blurb);
  await page.getByRole("button", { name: "I've saved my link" }).click();
  await page.goto("/testimonies?branch=" + account.person.id);
  await expect(page.locator(".testimony-story-body")).toHaveText(blurb);
  await expect(page.getByText("These are the final words of the full testimony.", { exact: true })).toHaveCount(0);
  const read = page.getByRole("button", { name: "Read the full testimony", exact: true });
  await read.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".testimony-reader-prose p")).toHaveCount(101);
  await expect(dialog.locator(".testimony-reader-blurb")).toHaveText(blurb);
  await expect(dialog.locator(".testimony-reader-prose")).toContainText("Paragraph 1:");
  expect(await page.locator(".testimony-reader-scroll").evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
  await page.screenshot({ path: "front-end capture/2026-10-04/testimonies-full-reader-" + info.project.name + ".png", fullPage: false });
  await dialog.getByRole("button", { name: "Larger text", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Larger text", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByText("These are the final words of the full testimony.", { exact: true }).scrollIntoViewIfNeeded();
  expect(await page.locator(".testimony-reader-scroll").evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(read).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await read.click();
  await page.getByRole("button", { name: "Close full testimony" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "My testimony", exact: true }).click();
  await expect(page.getByLabel("A short blurb", { exact: true })).toHaveValue(blurb);
  await expect(page.getByLabel("Your full testimony (optional)", { exact: true })).toHaveValue(full);
  await request.dispose();
});

test("failed publication retains the draft and can be retried", async ({ page, playwright }) => {
  const request = await playwright.request.newContext({ baseURL: origin });
  await page.goto(local((await invite(request)).url));
  await fillStory(page, "Retry guest");
  await page.route("**/api/testimonies/submissions", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Temporarily unavailable. Please try again." }) }), { times: 1 });
  await page.getByRole("button", { name: "Publish testimony", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Temporarily unavailable");
  await page.reload();
  await expect(page.getByLabel("Public name", { exact: true })).toHaveValue("Retry guest");
  await page.getByRole("button", { name: "Publish testimony", exact: true }).click();
  await expect(page.getByLabel("Private access link", { exact: true })).toBeVisible();
  await request.dispose();
});

test("a committed submission with a lost response can be recovered after reload", async ({ page, playwright }) => {
  const request = await playwright.request.newContext({ baseURL: origin });
  await page.goto(local((await invite(request)).url));
  await fillStory(page, "Recovered guest");
  await page.route("**/api/testimonies/submissions", async (route) => {
    expect((await route.fetch()).status()).toBe(201);
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Connection interrupted." }) });
  }, { times: 1 });
  await page.getByRole("button", { name: "Publish testimony", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Connection interrupted");
  await page.reload();
  await page.getByRole("button", { name: "Recover my submission", exact: true }).click();
  await expect(page.getByLabel("Private access link", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Public name", { exact: true })).toHaveValue("Recovered guest");
  await request.dispose();
});

test("revoked invitation cannot publish", async ({ page, playwright }) => {
  const request = await playwright.request.newContext({ baseURL: origin });
  const invitation = await invite(request);
  expect((await request.delete("/api/testimonies/invitations/" + invitation.id, { headers: { Origin: origin } })).ok()).toBeTruthy();
  await page.goto(local(invitation.url));
  await expect(page.getByRole("heading", { name: "Invitation unavailable" })).toBeVisible();
  await expect(page.getByLabel("Your full testimony (optional)", { exact: true })).toHaveCount(0);
  await request.dispose();
});

test("drag and zoom replace internal scrolling and the story matches the viewer height", async ({ page }) => {
  await page.goto("/testimonies");
  const viewer = page.getByRole("region", { name: "Interactive testimony tree" });
  await expect(page.locator(".testimony-story-body")).toContainText("In this fictional example");
  await viewer.scrollIntoViewIfNeeded();
  const geometry = () => page.evaluate(() => {
    const map = document.querySelector(".testimony-map")!, story = document.querySelector(".testimony-story")!;
    const viewport = document.querySelector<HTMLElement>(".testimony-map-viewport")!;
    const transform = new DOMMatrix(getComputedStyle(document.querySelector(".testimony-map-surface")!).transform);
    return { heightDifference: Math.abs(map.getBoundingClientRect().height - story.getBoundingClientRect().height), overflow: getComputedStyle(viewport).overflow, scrollX: viewport.scrollLeft, scrollY: viewport.scrollTop, x: transform.e, y: transform.f, scale: transform.a, pageY: window.scrollY };
  });
  const before = await geometry();
  expect(before.heightDifference).toBeLessThanOrEqual(1);
  expect(before.overflow).toBe("clip");
  const bounds = (await viewer.boundingBox())!;
  const maya = (await page.getByRole("button", { name: /Maya New beginnings/ }).boundingBox())!;
  await page.mouse.move(maya.x + maya.width / 2, maya.y + maya.height / 2);
  await page.mouse.down();
  await page.mouse.move(maya.x + maya.width / 2 + 45, maya.y + maya.height / 2 + 30, { steps: 8 });
  await page.mouse.up();
  const dragged = await geometry();
  expect(dragged.x - before.x).toBeCloseTo(45, 0);
  expect(dragged.y - before.y).toBeCloseTo(30, 0);
  await expect(page.locator(".testimony-author h2")).toHaveText("Daniel");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -160);
  await expect.poll(async () => (await geometry()).scale).toBeGreaterThan(dragged.scale);
  expect((await geometry()).pageY).toBeCloseTo(before.pageY, 0);
  await page.getByRole("button", { name: "Fit branch", exact: true }).click();
  await viewer.focus();
  await page.keyboard.press("ArrowRight");
  expect((await geometry()).x).toBeCloseTo(before.x - 60, 0);
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: /Maya New beginnings/ }).click();
  expect((await geometry()).heightDifference).toBeLessThanOrEqual(1);
  expect((await geometry()).scrollX).toBe(0);
  expect((await geometry()).scrollY).toBe(0);
});

test("touch pinch zooms without moving the page", async ({ page, context }, info) => {
  test.skip(info.project.name !== "phone", "Touch gestures use the phone project.");
  await page.goto("/testimonies");
  const viewer = page.getByRole("region", { name: "Interactive testimony tree" });
  await expect(page.locator(".testimony-story-body")).toContainText("In this fictional example");
  await viewer.scrollIntoViewIfNeeded();
  const box = (await viewer.boundingBox())!, x = box.x + box.width / 2, y = box.y + box.height / 2;
  const scale = () => page.locator(".testimony-map-surface").evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  const before = await scale(), pageY = await page.evaluate(() => scrollY);
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
  for (const distance of [40, 50, 60]) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(await scale()).toBeGreaterThan(before * 1.5);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  await session.detach();
});

for (const theme of ["light", "dark"]) test("visual layout in " + theme, async ({ page, playwright }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (info.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript((value) => { localStorage.setItem("bp-theme", value); }, theme);
  await page.goto("/testimonies");
  await page.getByRole("button", { name: /Maya New beginnings/ }).click();
  await expect(page.locator(".testimony-story-body")).toContainText("In this fictional example, Maya");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "front-end capture/2026-10-04/testimonies-live-tree-" + theme + "-" + info.project.name + ".png", fullPage: true });
  const request = await playwright.request.newContext({ baseURL: origin });
  await page.goto(local((await invite(request)).url));
  await expect(page.getByLabel("Public name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "front-end capture/2026-10-04/testimonies-live-form-" + theme + "-" + info.project.name + ".png", fullPage: true });
  expect(errors).toEqual([]);
  await request.dispose();
});
