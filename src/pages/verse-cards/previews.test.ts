import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cardPageHtml, fileBudget, FILE_LIMIT, firstWords, MAX_PICTURE_BYTES, pageFile, pictureProblem, pictureUrl, previewPassage, previewRefs,
  previewSpec, refFromScheduleId, withPicture, type PreviewPassage, type ScheduleFile,
} from "../../../scripts/verse-cards/preview-pages";
import { bookCode, refFromKey } from "@/lib/verse-card/links";
import { resolveCard } from "@/lib/verse-card/spec";
import { catalog } from "./test-kit";
import { QUICK_KEYS } from "./quick";

// The link-preview script's list and pages (design 8). Drawing the pictures needs Edge and Bun, so the script itself
// checks every picture with pictureProblem before writing it; these tests hold that check and everything around it.
const SHELL = readFileSync("index.html", "utf8");
const schedule = JSON.parse(readFileSync("src/data/verse-of-the-day/schedule.json", "utf8")) as ScheduleFile;
const plain = (book: number) => JSON.parse(readFileSync(`data/plain/bsb/${bookCode(book)}.json`, "utf8")) as Record<string, string>;
const passage = (key: string) => {
  const ref = refFromKey(key)!;
  return previewPassage(catalog, plain(ref.book), key, ref) as PreviewPassage;
};
const metaTags = (html: string) => html.match(/<(?:meta|link|script)\b[^>]*>/g) ?? [];

/** A PNG's first 24 bytes (signature, IHDR length and name, width, height), padded to `size`. */
const png = (width: number, height: number, size = 100) => {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
};

describe("which passages get a preview", () => {
  it("lists every verse-of-the-day passage and the start page's six, each once", () => {
    const { refs, problems } = previewRefs(schedule);
    expect(problems).toEqual([]);
    const keys = refs.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(428);
    for (const key of QUICK_KEYS) expect(keys).toContain(key);
    for (const { key, ref } of refs) expect(refFromKey(key)).toEqual(ref);
  });

  it("reads the schedule's passage ids, ranges included, and refuses anything else", () => {
    expect(refFromScheduleId("NUM.6.24-26")).toEqual({ book: 4, chapter: 6, first: 24, last: 26 });
    expect(refFromScheduleId("1JN.4.8")).toEqual({ book: 62, chapter: 4, first: 8, last: 8 });
    for (const id of ["TOB.1.1", "JHN.3.18-16", "JHN.3", "JHN.0.1", "jhn.3.16", "JHN.3.16a"]) expect(refFromScheduleId(id)).toBeNull();
    expect(previewRefs({ poolOrder: ["GEN.1.1-2.3"], days: {} }).problems).toEqual([expect.stringContaining("GEN.1.1-2.3")]);
  });

  it("finds the Berean words of every listed passage, within what a card holds", () => {
    const problems: string[] = [];
    for (const { key, ref } of previewRefs(schedule).refs) {
      const found = previewPassage(catalog, plain(ref.book), key, ref);
      if (typeof found === "string") problems.push(found);
    }
    expect(problems).toEqual([]);
    expect(passage("ephesians-3-13-14").text).toMatch(/your glory\. \.\.\. for this reason/);
    expect(passage("proverbs-3-5-6")).toMatchObject({ reference: "Proverbs 3:5–6", text: expect.stringMatching(/^Trust in the LORD .* straight\.$/) });
  });

  it("names a verse the Berean leaves out and a run longer than a card", () => {
    const missing = refFromKey("matthew-17-21")!;
    expect(previewPassage(catalog, plain(missing.book), "matthew-17-21", missing)).toMatch(/no verse 17:21/);
    const long = refFromKey("esther-8-9-12")!;
    expect(previewPassage(catalog, plain(long.book), "esther-8-9-12", long)).toMatch(/more than a card holds/);
  });

  it("draws the card page's own card in the default design, with no heading and no visitor's line", () => {
    const card = resolveCard(previewSpec(passage("john-3-16")));
    expect(card).toMatchObject({ reference: "John 3:16", link: "https://bibleguide.io/verse-cards/john-3-16", lines: [], heading: null });
    expect(card.look.id).toBe("paper");
  });
});

describe("the card page's ready-made copy", () => {
  const html = cardPageHtml(SHELL, passage("john-3-16"));

  it("names the card's picture and describes it in all four picture tags", () => {
    const picture = "https://bibleguide.io/cards/preview/v1/john-3-16.png";
    expect(pictureUrl("john-3-16")).toBe(picture);
    expect(html).toContain(`<meta property="og:image" content="${picture}" />`);
    expect(html).toContain(`<meta name="twitter:image" content="${picture}" />`);
    for (const tag of ['property="og:image:alt"', 'name="twitter:image:alt"']) {
      expect(html).toMatch(new RegExp(`<meta ${tag} content="A verse card: “For God so loved the world[^"]*” John 3:16, Berean Standard Bible, bibleguide.io" />`));
    }
    expect(html).toContain("<title>John 3:16: a verse card | Bible Guide</title>");
    expect(html).toContain('<link rel="canonical" href="https://bibleguide.io/verse-cards/john-3-16" />');
    expect(html).toContain('<meta property="og:url" content="https://bibleguide.io/verse-cards/john-3-16" />');
    expect(html).toContain('<a href="/read/bsb/JHN/3?hl=16">Read John 3</a>');
    expect(pageFile("john-3-16")).toBe("verse-cards/john-3-16.html");
  });

  it("keeps every other tag of the site's shell as it is", () => {
    const changed = /og:image"|og:image:alt|twitter:image"|twitter:image:alt|og:title|og:description|og:url|twitter:title|twitter:description|name="description"/;
    const kept = metaTags(SHELL).filter((tag) => !changed.test(tag));
    expect(kept.length).toBeGreaterThan(10);
    const written = metaTags(html);
    for (const tag of kept) expect(written).toContain(tag);
    expect(written.length).toBe(metaTags(SHELL).length + 1); // and the canonical address
  });

  it("escapes what it writes and stops when the shell lost a picture tag", () => {
    expect(withPicture(SHELL, "https://bibleguide.io/a.png", 'Say "<hi>" & go')).toContain('content="Say &quot;&lt;hi&gt;&quot; &amp; go"');
    expect(() => withPicture(SHELL.replace(/<meta name="twitter:image" [^>]*>/, ""), "x", "y")).toThrow(/twitter:image/);
  });

  it("shortens long words for the description at a word, with an ellipsis", () => {
    expect(firstWords("Jesus wept.", 40)).toBe("Jesus wept.");
    expect(firstWords("In the beginning God created the heavens and the earth.", 20)).toBe("In the beginning God…");
    expect(firstWords("Trust in the LORD, with all", 18)).toBe("Trust in the LORD…");
  });
});

describe("the checks on each picture and on the release", () => {
  it("takes a 1200 × 630 PNG under 300 KB and names what is wrong with anything else", () => {
    expect(pictureProblem(png(1200, 630))).toBeNull();
    expect(pictureProblem(png(1080, 1080))).toBe("1080 × 1080 px, expected 1200 × 630");
    expect(pictureProblem(png(1200, 630, MAX_PICTURE_BYTES + 1))).toMatch(/over the 300 KB/);
    expect(pictureProblem(new TextEncoder().encode("<!doctype html><html>not a picture</html>"))).toBe("not a PNG file");
  });

  it("stops before a release would pass Cloudflare's file limit", () => {
    expect(fileBudget(43_800, 860)).toEqual({ total: 44_660, problem: null });
    expect(fileBudget(FILE_LIMIT, 1).problem).toMatch(/over the 99500/);
  });
});
