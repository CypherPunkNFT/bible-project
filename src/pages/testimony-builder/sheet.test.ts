// The sheet from a draft (design §5 and §9): only answered sections in question order, paragraphs and line breaks, the
// default title and the by-line, the plain text and HTML shapes, escaping of a hostile answer, the downloaded page's
// guard, the translator, and the file names.
import { describe, expect, it } from "vitest";
import { DEFAULT_TITLE, escapeHtml, hasStory, pageFileName, paragraphsOf, sheetHtml, sheetPage, sheetSections, sheetText, textFileName } from "./sheet";

const HOSTILE = `<script>alert("x")</script> & 'quotes' <b onmouseover="x">bold</b>`;

describe("sheetSections", () => {
  it("keeps only answered story questions, in question order, under their headings", () => {
    const sheet = sheetSections({ now: "Life now.", began: "  ", scene: "In my car.\n\nI prayed.", title: "The Parking Lot", name: "Lucas", when: "at thirty" });
    expect(sheet.title).toBe("The Parking Lot");
    expect(sheet.byline).toBe("Lucas · at thirty");
    expect(sheet.sections.map((section) => section.id)).toEqual(["scene", "now"]);
    expect(sheet.sections[0].heading).toBe("The day everything changed");
    expect(sheet.sections[0].paragraphs).toEqual([["In my car."], ["I prayed."]]);
    expect(sheet.footer).toBe("");
  });

  it("falls back to the default title, leaves the by-line out, and dates the footer", () => {
    const sheet = sheetSections({ now: "Now." }, undefined, "11 November 2026");
    expect(sheet.title).toBe(DEFAULT_TITLE);
    expect(sheet.byline).toBe("");
    expect(sheet.footer).toBe("Written with Bible Guide, bibleguide.io, on 11 November 2026.");
  });

  it("passes its fixed words through the translator and never the person's", () => {
    const say = (english: string) => `[${english}]`;
    const sheet = sheetSections({ now: "Now.", name: "Lucas" }, say, "today");
    expect(sheet.title).toBe("[My testimony]");
    expect(sheet.sections[0].heading).toBe("[My life now]");
    expect(sheet.sections[0].paragraphs).toEqual([["Now."]]);
    expect(sheet.byline).toBe("Lucas");
    expect(sheet.footer).toBe("[Written with Bible Guide, bibleguide.io, on {date}.]".replace("{date}", "today"));
  });

  it("knows when there is a story to show", () => {
    expect(hasStory({})).toBe(false);
    expect(hasStory({ title: "Only a title", name: "Lucas" })).toBe(false);
    expect(hasStory({ verse: "John 3:16" })).toBe(true);
  });
});

describe("paragraphsOf", () => {
  it("splits on blank lines, trims lines, keeps single newlines as line breaks and drops empty lines", () => {
    expect(paragraphsOf("  One.  \nTwo.\n\n\n  \nThree.\n")).toEqual([["One.", "Two."], ["Three."]]);
    expect(paragraphsOf("   ")).toEqual([]);
  });
});

describe("the outputs", () => {
  const sheet = sheetSections({ scene: "In my car.\nIt was dark.\n\nI prayed.", now: "Now.", title: "The Parking Lot", name: "Lucas" }, undefined, "today");

  it("write plain text with headings in capitals and LF endings", () => {
    expect(sheetText(sheet)).toBe([
      "The Parking Lot", "Lucas", "",
      "THE DAY EVERYTHING CHANGED", "", "In my car.", "It was dark.", "", "I prayed.", "",
      "MY LIFE NOW", "", "Now.", "",
      "Written with Bible Guide, bibleguide.io, on today.", "",
    ].join("\n"));
  });

  it("write HTML with one section per answer and line breaks inside a paragraph", () => {
    const html = sheetHtml(sheet);
    expect(html).toContain(`<h1 dir="auto">The Parking Lot</h1>`);
    expect(html).toContain(`<p class="by" dir="auto">Lucas</p>`);
    expect(html).toContain(`<section><h2>The day everything changed</h2><p dir="auto">In my car.<br>It was dark.</p><p dir="auto">I prayed.</p></section>`);
    expect(html).toContain(`<footer><p>Written with Bible Guide, bibleguide.io, on today.</p></footer>`);
  });

  it("escape everything a person wrote, so nothing is ever markup", () => {
    const hostile = sheetSections({ now: HOSTILE, title: HOSTILE, name: HOSTILE });
    const html = sheetHtml(hostile);
    const page = sheetPage(hostile, "en", "My testimony");
    for (const text of [html, page]) {
      expect(text).not.toMatch(/<script/);
      expect(text).not.toMatch(/<[a-z]+[^>]*\son\w+=/);
      expect(text).not.toContain("<b ");
      expect(text).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quotes&#39;");
    }
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(sheetText(hostile)).toContain(HOSTILE);
  });

  it("make a self-contained page with a charset, a policy against scripts, the site's tab title and a checked language", () => {
    const page = sheetPage(sheet, "es", "My testimony");
    expect(page.startsWith("<!doctype html>\n<html lang=\"es\">\n<head>\n<meta charset=\"utf-8\">\n<meta http-equiv=\"Content-Security-Policy\"")).toBe(true);
    expect(page).toContain("default-src 'none'; style-src 'unsafe-inline'");
    expect(page).toContain("<title>My testimony</title>");
    expect(page).not.toContain("<script");
    expect(page).not.toMatch(/https?:\/\//);
    expect(sheetPage(sheet, "<bad>", "t")).toContain(`<html lang="en">`);
  });

  it("name the files by the local date only", () => {
    const date = new Date(2026, 10, 11, 23, 30);
    expect(textFileName(date)).toBe("my-testimony-2026-11-11.txt");
    expect(pageFileName(date)).toBe("my-testimony-2026-11-11.html");
  });
});
