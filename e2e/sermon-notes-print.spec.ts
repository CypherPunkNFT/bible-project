// The sermon notes sheet printed to PDF (src/pages/resources/sermon-notes/README.md): the adults' and the children's sheet
// are each exactly one page of the chosen paper, with the title and passage empty or filled to their 80-character limit.
// Not part of `npm test`; run by hand: npx playwright test e2e/sermon-notes-print.spec.ts --project=desktop
import { expect, test, type Page } from "@playwright/test";

/** Points: Letter is 612 x 792; A4 is 595.3 x 841.9, which Chromium rounds to whole CSS pixels (594.96 x 841.92). */
const SIZES = { letter: [612, 792], a4: [595.3, 841.9] } as const;
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
const mediaBoxes = (pdf: Buffer) => [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

async function countPrints(page: Page) {
  await page.addInitScript(() => { window.print = () => { (window as unknown as { printed: number }).printed = ((window as unknown as { printed?: number }).printed ?? 0) + 1; }; });
}

test.describe("sermon notes sheet prints on one page", () => {
  for (const paper of ["letter", "a4"] as const) {
    for (const sheet of ["For adults", "For children"]) {
      for (const filled of [false, true]) {
        test(`${sheet} on ${paper}${filled ? ", fields full" : ""}`, async ({ page }, testInfo) => {
          test.skip(testInfo.project.name !== "desktop", "printing is checked once, on the desktop project");
          await countPrints(page);
          await page.goto("/resources/sermon-notes");
          await page.getByRole("radio", { name: sheet }).check();
          await page.getByRole("radio", { name: paper === "letter" ? "US Letter" : "A4" }).check();
          if (filled) {
            await page.getByLabel("Sermon title (optional)").fill("W".repeat(80));
            await page.getByLabel("Bible passage (optional)").fill("Lamentations 3:22-26, Psalm 119:105-112 and 2 Corinthians 4:16-18 and more!");
          }
          const print = page.getByRole("button", { name: "Print", exact: true });
          await expect(print).toBeEnabled({ timeout: 20_000 });
          await print.click();
          expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
          await page.emulateMedia({ media: "print" });
          const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
          await testInfo.attach(`sermon-notes-${sheet}-${paper}${filled ? "-full" : ""}.pdf`, { body: pdf, contentType: "application/pdf" });
          const boxes = mediaBoxes(pdf);
          expect(boxes.length).toBeGreaterThan(0);
          for (const [width, height] of boxes) {
            expect(Math.abs(width - SIZES[paper][0])).toBeLessThan(1);
            expect(Math.abs(height - SIZES[paper][1])).toBeLessThan(1);
          }
          expect(pageCount(pdf)).toBe(1);
          // The footer is the last thing on the sheet: if it is on the page, nothing was cut off.
          const footer = page.locator(".print-sheet-portal .sn-foot");
          const sheetBox = await page.locator(".print-sheet-portal .sn-sheet").boundingBox();
          const footBox = await footer.boundingBox();
          expect(sheetBox && footBox && footBox.y + footBox.height <= sheetBox.y + sheetBox.height + 1).toBe(true);
        });
      }
    }
  }
});
