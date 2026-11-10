// The birthday release copies and preview cards (docs/features/birthday-verses/design.md 8.2, 8.3, 9.3), built by
// scripts/birthday-verses/pages.ts. Drawing the pictures needs Edge and Bun, so previews.mjs checks each one with
// pictureProblem before writing it; these tests hold the pages, the cards and their English against the live pages'.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { birthdayVersePaths } from "@/data/birthday-verses";
import { bookCode } from "@/lib/verse-card/links";
import { catalog } from "@/pages/life-events/test-kit";
import {
  BIRTHDAY_PREVIEW_FOLDER, dateHeading, datePage, dateWords, hubPage, kindLine, leadLine, monthPage, pageFile, passageOf, pictureFile, previewSpec,
  refOf, referenceOf, type DateWords,
} from "../../../scripts/birthday-verses/pages";
import { toCardSpec } from "./card";
import { allBirthdayDates, datePath, monthPath } from "./dates";
import * as live from "./verse";

const SHELL = readFileSync("index.html", "utf8");
const plain = (date: string) => JSON.parse(readFileSync(`data/plain/bsb/${bookCode(refOf(passageOf(date)).book)}.json`, "utf8")) as Record<string, string>;
const words = (date: string) => dateWords(plain(date), date) as DateWords;
const all = () => [hubPage(SHELL, catalog), ...Array.from({ length: 12 }, (_, index) => monthPage(SHELL, catalog, index + 1)), ...allBirthdayDates().map((date) => datePage(SHELL, catalog, date, words(date)))];
const tag = (html: string, attribute: string) => new RegExp(`<meta ${attribute} content="([^"]*)" />`).exec(html)?.[1];

describe("birthday release copies", () => {
  const pages = all();

  it("writes 379 pages, one for every address in the sitemap, each at its ready-made file", () => {
    expect(pages.map((page) => page.path)).toEqual(birthdayVersePaths());
    expect(pages[0].file).toBe("birthday-verses.html");
    expect(pageFile(monthPath(3))).toBe("birthday-verses/march.html");
    expect(pageFile(datePath("03-16"))).toBe("birthday-verses/march-16.html");
  });

  it("names each page and its one official address", () => {
    for (const page of pages) {
      expect(page.html, page.path).toContain(`<link rel="canonical" href="https://bibleguide.io${page.path}" />`);
      expect(page.html.match(/<title>/g), page.path).toHaveLength(1);
    }
    const march16 = pages.find((page) => page.path === "/birthday-verses/march-16")!;
    expect(march16.html).toContain("<title>Bible Verse for a March 16 Birthday · Bible Guide</title>");
    expect(tag(march16.html, 'name="description"')).toMatch(/^March 16 · John 3:16: /);
    expect(pages.find((page) => page.path === "/birthday-verses/april-1")!.html).toContain("<title>Bible Verse for an April 1 Birthday · Bible Guide</title>");
    expect(pages[0].html).toContain("<title>Birthday Bible Verses: A Verse for Every Day of the Year · Bible Guide</title>");
  });

  it("puts the verse, its reference, the note, the number line and the verses around it in each date's copy", () => {
    const html = pages.find((page) => page.path === "/birthday-verses/march-16")!.html;
    expect(html).toContain("<h1>Bible Verse for a March 16 Birthday</h1>");
    expect(html).toMatch(/<p>“For God so loved the world[^<]*” John 3:16 \(BSB\)<\/p>/);
    expect(html).toContain("<p>Chapter 3, verse 16: the 3rd month and the 16th day.</p>");
    expect(html).toContain('<a href="/read/bsb/JHN/3?hl=16">Read John 3</a>');
    expect(html).toContain('<a href="/birthday-verses/march-15">');
    expect(html).toContain('<a href="/occasion-verses?o=birthday">More verses for a birthday</a>');
    expect(pages.find((page) => page.path === "/birthday-verses/november-29")!.html).toContain("Jeremiah 29:11");
  });

  it("escapes what it writes into the page", () => {
    const html = datePage(SHELL, catalog, "03-16", { text: `<script>alert("x")</script> & more`, before: "a < b" }).html;
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more");
    expect(html).toContain("<p>a &lt; b</p>");
  });

  it("names each date's own picture, and leaves the hub and months the site's picture", () => {
    const shellPicture = tag(SHELL, 'property="og:image"');
    for (const page of pages) {
      const date = allBirthdayDates().find((key) => datePath(key) === page.path);
      const expected = date ? `https://bibleguide.io/${pictureFile(date)}` : shellPicture;
      expect(tag(page.html, 'property="og:image"'), page.path).toBe(expected);
      expect(tag(page.html, 'name="twitter:image"'), page.path).toBe(expected);
    }
    expect(pictureFile("03-16")).toBe(`${BIRTHDAY_PREVIEW_FOLDER}/march-16.png`);
    expect(BIRTHDAY_PREVIEW_FOLDER).toBe("cards/birthday/v1");
    expect(tag(pages.find((page) => page.path === "/birthday-verses/march-16")!.html, 'property="og:image:alt"')).toMatch(/^A birthday card: “For God so loved/);
  });

  it("leaves Today out of the hub's copy and links every month and date from it", () => {
    expect(pages[0].html).not.toMatch(/Today/);
    for (const path of birthdayVersePaths().slice(1)) expect(pages[0].html, path).toContain(`<a href="${path}">`);
  });
});

describe("birthday release copies match the live pages", () => {
  it("writes the same heading, lead line and number line as the date page for all 366 dates", () => {
    for (const date of allBirthdayDates()) {
      const passage = passageOf(date);
      const reference = live.passageReference(catalog, passage);
      expect(referenceOf(catalog, date), date).toBe(reference);
      expect(dateHeading(date), date).toBe(live.dateHeading(date));
      expect(leadLine(date, reference), date).toBe(live.leadLine(date, reference, passage.note));
      expect(kindLine(date), date).toBe(live.kindLine(date, passage));
    }
  });

  it("draws each preview as the page's own card: Paper, Happy birthday, no visitor's line", () => {
    for (const date of ["03-16", "02-29", "07-31", "11-29"]) {
      const found = words(date);
      const spec = previewSpec(catalog, date, found);
      expect(spec, date).toEqual(toCardSpec(date, { text: found.text, reference: referenceOf(catalog, date), book: refOf(passageOf(date)).book }));
      expect(spec.lines, date).toBeUndefined();
    }
  });

  it("finds the Berean words for every date, and the verses either side where the chapter has them", () => {
    const problems = allBirthdayDates().map((date) => dateWords(plain(date), date)).filter((found) => typeof found === "string");
    expect(problems).toEqual([]);
    expect(words("01-01").before).toBeUndefined(); // Genesis 1:1 opens its chapter
    expect(words("01-01").after).toMatch(/^Now the earth was formless/);
  });
});
