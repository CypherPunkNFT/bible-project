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
