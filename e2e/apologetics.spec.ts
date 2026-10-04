import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`apologetics: header destination works and the ${theme} page fits`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: theme });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const link = page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Apologetics", exact: true });
    await link.click();
    await expect(page).toHaveURL(/\/apologetics$/);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A reason for the hope.");
    await expect(page.getByRole("tab")).toHaveCount(6);
    await expect(page.getByText("No debates have been added yet.", { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("apologetics: keyboard foundations show their claims and open the correct Scripture", async ({ page }) => {
  await page.goto("/apologetics");
  await page.getByRole("tab", { name: "God", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Jesus Christ" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Was Jesus simply a great teacher?");
  await page.getByText("Read the first passage here", { exact: true }).click();
  await expect(page.locator(".ap-read-preview")).toContainText("the Word was made flesh");
  await page.getByRole("tabpanel").getByRole("link", { name: "John 20:24–31", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/JHN\/20\?hl=24-31$/);
});

test("apologetics: ministry steps and Islam preparation links work", async ({ page }) => {
  await page.goto("/apologetics");
  await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Across beliefs" }).click();
  await expect(page).toHaveURL(/#across-beliefs$/);
  await expect(page.locator(".ap-islam-questions li")).toHaveCount(6);
  await page.getByRole("link", { name: "How we will study the debates" }).click();
  await expect(page).toHaveURL(/#debates$/);
  await expect(page.locator(".ap-debate-method")).toContainText("The strongest objection and reply");
  await page.getByRole("group", { name: "Conversation steps" }).getByRole("button", { name: /Invite/ }).click();
  await expect(page.locator(".ap-step-detail")).toContainText("Would you like to keep exploring this with me?");
  await expect(page.locator(".ap-step-detail a")).toHaveAttribute("href", /\/read\/kjv\/COL\/4\?hl=5-6$/);
});
