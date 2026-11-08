// Life-event cards printed to PDF (docs/features/life-event-packs/design.md 7.3, "Print check in the browser"): each
// single-sheet format is exactly one page of the chosen paper; the readings sheet runs on with its own page size.
// Not part of `npm test`; run by hand: npx playwright test e2e/life-events-print.spec.ts --project=desktop
import { expect, test } from "@playwright/test";

/** Points: Letter is 612 x 792; A4 is 595.3 x 841.9, which Chromium rounds to whole CSS pixels (594.96 x 841.92). */
const SIZES = { letter: [612, 792], a4: [595.3, 841.9] } as const;
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
const mediaBoxes = (pdf: Buffer) => [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

test.describe("life-event cards print", () => {
  for (const paper of ["letter", "a4"] as const) {
    for (const format of ["Folded card", "Small cards", "Display print", "Readings sheet"]) {
      test(`${format} on ${paper}`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "printing is checked once, on the desktop project");
        await page.addInitScript(() => { window.print = () => { (window as unknown as { printed: number }).printed = ((window as unknown as { printed?: number }).printed ?? 0) + 1; }; });
        await page.goto("/life-events/wedding");
        await page.getByRole("radio", { name: new RegExp(format) }).check();
        await page.getByRole("radio", { name: paper === "letter" ? "US Letter" : "A4" }).check();
        if (format !== "Readings sheet") {
          await page.getByLabel("Name 1").fill("Grace");
          await page.getByLabel("Name 2").fill("Samuel");
        }
        const print = page.getByRole("button", { name: "Print" });
        await expect(print).toBeEnabled({ timeout: 20_000 });
        await print.click();
        expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
        await page.emulateMedia({ media: "print" });
        const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
        await testInfo.attach(`${format}-${paper}.pdf`, { body: pdf, contentType: "application/pdf" });
        const boxes = mediaBoxes(pdf);
        expect(boxes.length).toBeGreaterThan(0);
        for (const [width, height] of boxes) {
          expect(Math.abs(width - SIZES[paper][0])).toBeLessThan(1);
          expect(Math.abs(height - SIZES[paper][1])).toBeLessThan(1);
        }
        if (format === "Readings sheet") expect(pageCount(pdf)).toBeGreaterThan(1);
        else expect(pageCount(pdf)).toBe(1);
      });
    }
  }
});
