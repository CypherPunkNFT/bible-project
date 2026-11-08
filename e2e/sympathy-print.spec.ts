// Sympathy cards printed to PDF (docs/features/sympathy/design.md 7.4, "Print check in the browser"): the folded card,
// the memorial cards and the display print are each exactly one page of the chosen paper; the funeral readers' sheet runs
// on with its own page size. Not part of `npm test`; run by hand: npx playwright test e2e/sympathy-print.spec.ts --project=desktop
import { expect, test, type Page } from "@playwright/test";

/** Points: Letter is 612 x 792; A4 is 595.3 x 841.9, which Chromium rounds to whole CSS pixels (594.96 x 841.92). */
const SIZES = { letter: [612, 792], a4: [595.3, 841.9] } as const;
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
const mediaBoxes = (pdf: Buffer) => [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

async function countPrints(page: Page) {
  await page.addInitScript(() => { window.print = () => { (window as unknown as { printed: number }).printed = ((window as unknown as { printed?: number }).printed ?? 0) + 1; }; });
}

async function printedPdf(page: Page, print: ReturnType<Page["getByRole"]>) {
  await expect(print).toBeEnabled({ timeout: 20_000 });
  await print.click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  await page.emulateMedia({ media: "print" });
  return page.pdf({ preferCSSPageSize: true, printBackground: false });
}

function expectPaper(pdf: Buffer, paper: keyof typeof SIZES) {
  const boxes = mediaBoxes(pdf);
  expect(boxes.length).toBeGreaterThan(0);
  for (const [width, height] of boxes) {
    expect(Math.abs(width - SIZES[paper][0])).toBeLessThan(1);
    expect(Math.abs(height - SIZES[paper][1])).toBeLessThan(1);
  }
}

test.describe("sympathy cards print", () => {
  for (const paper of ["letter", "a4"] as const) {
    for (const format of ["Print a card", "Memorial cards", "Display print"]) {
      test(`${format} on ${paper}`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "printing is checked once, on the desktop project");
        await countPrints(page);
        await page.goto("/sympathy/loss-of-mother");
        await page.getByRole("tab", { name: format }).click();
        await page.getByRole("radio", { name: paper === "letter" ? "US Letter" : "A4" }).check();
        if (format === "Print a card") await page.getByLabel("Their name or names").fill("Grace");
        if (format === "Memorial cards") await page.getByLabel("Name of the person who died").fill("Ruth Ann Miller");
        const pdf = await printedPdf(page, page.getByRole("button", { name: "Print", exact: true }));
        await testInfo.attach(`${format}-${paper}.pdf`, { body: pdf, contentType: "application/pdf" });
        expectPaper(pdf, paper);
        expect(pageCount(pdf)).toBe(1);
      });
    }

    test(`funeral readers' sheet on ${paper}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "printing is checked once, on the desktop project");
      await countPrints(page);
      await page.goto("/sympathy/funeral-readings?list=psalm-23-1-6,john-14-1-6");
      const list = page.getByRole("complementary", { name: "Our readings" });
      await list.getByRole("radio", { name: paper === "letter" ? "US Letter" : "A4" }).check();
      const pdf = await printedPdf(page, list.getByRole("button", { name: "Print readers' sheet" }));
      await testInfo.attach(`readers-sheet-${paper}.pdf`, { body: pdf, contentType: "application/pdf" });
      expectPaper(pdf, paper);
      expect(pageCount(pdf)).toBeGreaterThan(1);
    });
  }
});
