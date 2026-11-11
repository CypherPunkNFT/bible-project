import { describe, expect, it } from "vitest";
import { canvasMeasure } from "./draw";
import { layoutSlide } from "./layout";
import { deckEntries, makeDeck, xmlText } from "./pptx";
import { makeSlides } from "./slides";
import { byId, FONTS, LAYOUTS, SHAPES, THEMES } from "./templates";
import { crc32, dosDateTime, joinParts, makeZip } from "./zip";

const decoder = new TextDecoder();

/** Reads back a stored zip: each local entry's name and bytes, checked against its CRC, and the end record's count. */
function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: { name: string; data: Uint8Array }[] = [];
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    expect(view.getUint16(at + 8, true)).toBe(0);
    const size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true);
    const name = decoder.decode(bytes.subarray(at + 30, at + 30 + nameLength));
    const data = bytes.subarray(at + 30 + nameLength, at + 30 + nameLength + size);
    expect(crc32(data)).toBe(view.getUint32(at + 14, true));
    entries.push({ name, data });
    at += 30 + nameLength + size;
  }
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  expect(view.getUint16(end + 10, true)).toBe(entries.length);
  expect(view.getUint32(end + 16, true)).toBe(at);
  return entries;
}

describe("the zip writer", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes DOS dates from 1980", () => {
    expect(dosDateTime(new Date(2026, 10, 9, 13, 30, 10))).toEqual({ time: (13 << 11) | (30 << 5) | 5, date: (46 << 9) | (11 << 5) | 9 });
    expect(dosDateTime(new Date(1970, 0, 1)).date >> 9).toBe(0);
  });

  it("stores entries that read back byte for byte, with UTF-8 names", () => {
    const entries = [{ name: "a.txt", data: new TextEncoder().encode("hello") }, { name: "Ésaïe 40.png", data: new Uint8Array([1, 2, 3]) }];
    const read = readZip(joinParts(makeZip(entries)));
    expect(read.map((entry) => entry.name)).toEqual(["a.txt", "Ésaïe 40.png"]);
    expect(decoder.decode(read[0].data)).toBe("hello");
  });

  it("refuses names a zip should never hold", () => {
    for (const name of ["", "/abs.txt", "a\\b.txt"]) expect(() => makeZip([{ name, data: new Uint8Array() }])).toThrow(/entry name/);
    expect(() => makeZip([{ name: "a", data: new Uint8Array() }, { name: "a", data: new Uint8Array() }])).toThrow(/repeated/);
  });
});

describe("the PowerPoint file", () => {
  const verses = [
    { chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want. <tag> & \"quoted\" \u0001", part: 0 },
    { chapter: 23, verse: 2, text: "He makes me lie down in green pastures; He leads me beside quiet waters.", part: 0 },
  ];
  const slides = makeSlides(verses, { bookName: "Psalms", wholeChapters: [true], singleChapterBook: false }, { per: "verse", budget: 150, title: true });
  const measure = canvasMeasure(null);

  it("makes text safe for XML", () => {
    expect(xmlText("a < b & \"c\" 'd' > e\u0000\u000B")).toBe("a &lt; b &amp; &quot;c&quot; &apos;d&apos; &gt; e");
    expect(xmlText("🙏 lone \uD800")).toBe("🙏 lone ");
  });

  for (const layout of LAYOUTS) for (const shape of SHAPES) for (const theme of [THEMES[0], byId(THEMES, "dawn"), byId(THEMES, "clear")]) {
    it(`declares and links every part, all well-formed (${layout.id}, ${shape.id}, ${theme.id})`, () => {
      const font = FONTS[1];
      const layouts = slides.map((slide) => layoutSlide(slide, { layout: layout.id, font, width: shape.width, height: shape.height, size: 78, numbers: true, footer: true }, measure));
      const entries = deckEntries(slides, layouts, { theme, font, shape, numbers: true, title: "Psalm 23" }, new Date(2026, 10, 9));
      expect(entries[0].name).toBe("[Content_Types].xml");
      const types = decoder.decode(entries[0].data);
      for (const entry of entries) {
        const xml = decoder.decode(entry.data);
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        expect(parsed.getElementsByTagName("parsererror"), entry.name).toHaveLength(0);
        if (!entry.name.endsWith(".rels") && entry.name !== "[Content_Types].xml") expect(types).toContain(`PartName="/${entry.name}"`);
      }
      const presentation = decoder.decode(entries.find((entry) => entry.name === "ppt/presentation.xml")!.data);
      expect(presentation).toContain(`<p:sldSz cx="${shape.emuWidth}" cy="${shape.emuHeight}"`);
      expect(presentation.match(/<p:sldId /g)).toHaveLength(3);
      expect(presentation).toContain('id="256"');
      const first = decoder.decode(entries.find((entry) => entry.name === "ppt/slides/slide2.xml")!.data);
      expect(first).toContain("&lt;tag&gt; &amp; &quot;quoted&quot;");
      expect(first).toContain('typeface="Georgia"');
      expect(first).toContain("<a:effectLst/></p:bgPr>");
      expect(first).toContain(">Psalm 23:1</a:t>");
      if (layout.id === "lower-third") expect(first).toContain('name="Band"');
    });
  }

  it("zips the deck with [Content_Types].xml first", () => {
    const layouts = slides.map((slide) => layoutSlide(slide, { layout: "centre", font: FONTS[0], width: 1920, height: 1080, size: 78, numbers: false, footer: true }, measure));
    const read = readZip(joinParts(makeDeck(slides, layouts, { theme: THEMES[0], font: FONTS[0], shape: SHAPES[0], numbers: false, title: "Psalm 23" })));
    expect(read[0].name).toBe("[Content_Types].xml");
    expect(read.filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name))).toHaveLength(3);
  });

  it("refuses a deck with no slides", () => {
    expect(() => deckEntries([], [], { theme: THEMES[0], font: FONTS[0], shape: SHAPES[0], numbers: false, title: "" })).toThrow(/0 slides/);
  });
});
