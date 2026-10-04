import { expect, test } from "@playwright/test";

test("testimony design: follows branches and offers an accessible list", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/testimonies/design");
  await expect(page.getByText("Fictional sample stories.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Maya New beginnings" }).click();
  await expect(page.getByRole("complementary", { name: "Selected testimony" })).toContainText("Daniel → Maya");
  await page.getByRole("button", { name: /Explore this branch/ }).click();
  await expect(page.locator(".testimony-tree-node")).toHaveCount(4);
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(page.locator(".testimony-list li")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("testimony design: accepted submission immediately adds the correct child without network writes", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (r) => { if (r.method() !== "GET") writes.push(r.url()); });
  await page.goto("/testimonies/design?from=maya");
  await expect(page.getByText("Maya invited you", { exact: true })).toBeVisible();
  await page.getByLabel("Public name", { exact: true }).fill("Sample guest");
  await page.getByLabel("A title for your story").fill("This is a fictional sample story");
  await page.getByLabel("Your testimony", { exact: true }).fill("This is sample text for trying the design. It is not a real testimony and does not describe an actual person's experience. It exists only to test how an invitation grows a branch.");
  await page.getByRole("button", { name: "Add sample story to the branch" }).click();
  await expect(page.getByRole("alert")).toContainText("publicly");
  await page.getByRole("checkbox", { name: /make this story/ }).check();
  await page.getByRole("checkbox", { name: /Maya invited me/ }).check();
  await page.getByRole("button", { name: "Add sample story to the branch" }).click();
  await expect(page.locator(".testimony-notice")).toContainText("connected to Maya");
  await expect(page.locator(".testimony-story-path")).toContainText("Daniel → Maya → Sample guest");
  await expect(page.locator(".testimony-tree-node")).toHaveCount(10);
  await page.getByRole("button", { name: "Preview an invite from Sample guest" }).click();
  await page.getByRole("button", { name: "Try the guest's experience" }).click();
  await page.getByLabel("Public name", { exact: true }).fill("Next guest");
  await page.getByLabel("A title for your story").fill("Another fictional example");
  await page.getByLabel("Your testimony", { exact: true }).fill("Another fictional sample story for testing. This person was invited by the previous sample guest, so the new story should extend that branch by one more generation.");
  await page.getByRole("checkbox", { name: /make this story/ }).check();
  await page.getByRole("checkbox", { name: /Sample guest invited me/ }).check();
  await page.getByRole("button", { name: "Add sample story to the branch" }).click();
  await expect(page.locator(".testimony-story-path")).toContainText("Daniel → Maya → Sample guest → Next guest");
  await expect(page.locator(".testimony-tree-node")).toHaveCount(11);
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(page.locator(".testimony-tree-node")).toHaveCount(9);
  expect(writes).toEqual([]);
});

test("testimony design: invitation has a generated QR and a local preview link", async ({ page }) => {
  await page.goto("/testimonies/design");
  await page.getByRole("button", { name: "Try an invitation" }).click();
  await expect(page.getByRole("img", { name: "QR code for this local design preview" })).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(page.getByLabel("Preview link", { exact: true })).toHaveValue(/\/testimonies\/design\?from=daniel$/);
  await page.getByRole("button", { name: "Try the guest's experience" }).click();
  await expect(page.getByText("Daniel invited you", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("testimony design: unknown invitation never silently attributes a guest to someone else", async ({ page }) => {
  await page.goto("/testimonies/design?from=unknown");
  await expect(page.locator(".testimony-notice")).toContainText("unavailable");
  await expect(page.getByLabel("Your testimony", { exact: true })).toHaveCount(0);
});

test("testimony tree: drag and zoom replace scrolling and the story matches its height", async ({ page }) => {
  await page.goto("/testimonies/design");
  const viewer = page.getByRole("region", { name: "Interactive testimony tree" });
  const surface = page.locator(".testimony-map-surface");
  await viewer.scrollIntoViewIfNeeded();
  await expect(surface).toHaveCSS("transform", /matrix/);
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
  // Dragging a person must move the tree without selecting that person.
  const maya = (await page.getByRole("button", { name: "Maya New beginnings" }).boundingBox())!;
  await page.mouse.move(maya.x + maya.width / 2, maya.y + maya.height / 2);
  await page.mouse.down();
  await page.mouse.move(maya.x + maya.width / 2 + 55, maya.y + maya.height / 2 + 35, { steps: 8 });
  await page.mouse.up();
  const dragged = await geometry();
  expect(dragged.x - before.x).toBeCloseTo(55, 0);
  expect(dragged.y - before.y).toBeCloseTo(35, 0);
  await expect(page.locator(".testimony-author h2")).toHaveText("Daniel");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -160);
  await expect.poll(async () => (await geometry()).scale).toBeGreaterThan(dragged.scale);
  expect((await geometry()).pageY).toBeCloseTo(before.pageY, 0);
  await page.getByRole("button", { name: "Fit branch", exact: true }).click();
  await expect.poll(async () => (await geometry()).scale).toBeCloseTo(before.scale, 3);
  await viewer.focus();
  await page.keyboard.press("ArrowRight");
  expect((await geometry()).x).toBeCloseTo(before.x - 60, 0);
  await page.keyboard.press("+");
  expect((await geometry()).scale).toBeGreaterThan(before.scale);
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "Maya New beginnings" }).click();
  expect((await geometry()).heightDifference).toBeLessThanOrEqual(1);
  expect((await geometry()).scrollX).toBe(0);
  expect((await geometry()).scrollY).toBe(0);
  await expect(page.locator(".testimony-story-body")).toHaveCSS("overflow-y", "visible");
});

test("testimony tree: touch pinch zooms without moving the page", async ({ page, context }, info) => {
  test.skip(info.project.name !== "phone", "Touch gestures use the phone project.");
  await page.goto("/testimonies/design");
  const viewer = page.getByRole("region", { name: "Interactive testimony tree" });
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
  const offset = () => page.locator(".testimony-map-surface").evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).e);
  const beforeDrag = await offset();
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 3 }] });
  for (const distance of [10, 20, 30]) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + distance, y, id: 3 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect((await offset()) - beforeDrag).toBeCloseTo(30, 0);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  await expect(page.locator(".testimony-author h2")).toHaveText("Daniel");
  await session.detach();
});
