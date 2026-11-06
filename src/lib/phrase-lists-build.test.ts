import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { filesShowing, liveCode, phrasePieces, readableCode } from "../../scripts/phrase-lists-match.mjs";
import { GROUP_BYTES, OWN_GROUP_BYTES, phraseStamp, planGroups, preparePhraseLists, writePhraseLists, writeStamp } from "../../scripts/phrase-lists.mjs";

// Splitting each language's phrase list by the built code (translation system, stage 5 job 17; scripts/phrase-lists.mjs).
const ENTRY = "index-AAAAAAAA.js";
const CODE: Record<string, string> = {
  [ENTRY]: `import("./PageA-BBBBBBBB.js");import("./PageB-CCCCCCCC.js");const h="Every subject. Every verse.";`,
  "PageA-BBBBBBBB.js": `const a="The miracles of Jesus",b=\`Open the profile of \${n}\`,c="Don\\u2019t miss the parables of the kingdom";`,
  "PageB-CCCCCCCC.js": `const d="Kings of Israel and Judah",e="The miracles of Jesusness";`,
  "Orphan-DDDDDDDD.js": `const x="Kings of Israel and Judah";`, // no page loads it
};
const HTML = `<html><script>const stamp = /*phrase-stamp*/"";</script><script type="module" crossorigin src="/assets/${ENTRY}"></script></html>`;
const SPANISH: Record<string, string> = {
  "Every subject. Every verse.": "Cada tema. Cada versículo.",
  "The miracles of Jesus": "Los milagros de Jesús",
  "Open the profile of {n}": "Abrir el perfil de {n}",
  "Don’t miss the parables of the kingdom": "No te pierdas las parábolas del reino",
  "Kings of Israel and Judah": "Reyes de Israel y Judá",
  "A sentence written only in a data file": "Una frase escrita solo en un archivo de datos",
  Close: "Cerrar",
  'plural:["{n} book","{n} books"]': '{"one":"{n} libro","other":"{n} libros"}',
  "Untranslated phrase in page code": "Untranslated phrase in page code",
  "Read the kings of Israel": "Reyes de Israel y Judá", // shares its translation with another phrase
};

let temporary: string[] = [];
function site(): { root: string; assets: string; i18n: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "phrase-lists-"));
  temporary.push(root);
  const assets = path.join(root, "assets"), i18n = path.join(root, "data", "i18n");
  fs.mkdirSync(assets, { recursive: true });
  for (const [name, code] of Object.entries(CODE)) fs.writeFileSync(path.join(assets, name), code);
  fs.writeFileSync(path.join(root, "index.html"), HTML);
  const hindi = Object.fromEntries(Object.entries(SPANISH).map(([key, value]) => [key, `hi:${value}`]));
  for (const [folder, list] of [["es", SPANISH], ["hi", hindi]] as const) {
    fs.mkdirSync(path.join(i18n, folder), { recursive: true });
    fs.writeFileSync(path.join(i18n, folder, "ui.json"), JSON.stringify(list));
  }
  return { root, assets, i18n };
}
const read = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));
afterEach(() => {
  temporary.forEach((root) => fs.rmSync(root, { recursive: true, force: true }));
  temporary = [];
});

describe("finding the code that shows a phrase", () => {
  it("reads the code's escapes, ignores case, a closing stop and slots, and wants whole words", () => {
    expect(readableCode("Don\\u2019t\\nmiss  \\x41")).toBe("don’t miss a");
    expect(phrasePieces("Open the profile of {n}.")).toEqual(["open the profile of"]);
    expect(phrasePieces('plural:["{n} book","{n} books"]')).toEqual(["book", "books"]);
    const code = new Map(Object.entries(CODE));
    const showing = filesShowing(["The miracles of Jesus", "Don’t miss the parables of the kingdom", "Open the profile of {n}", "Kings of Israel and Judah"], code);
    expect(showing.get("The miracles of Jesus")).toEqual(["PageA-BBBBBBBB.js"]); // not PageB's "Jesusness"
    expect(showing.get("Don’t miss the parables of the kingdom")).toEqual(["PageA-BBBBBBBB.js"]);
    expect(showing.get("Open the profile of {n}")).toEqual(["PageA-BBBBBBBB.js"]);
    expect(showing.get("Kings of Israel and Judah")).toEqual(["Orphan-DDDDDDDD.js", "PageB-CCCCCCCC.js"]);
  });

  it("follows the code a page can load from index.html, and nothing else", () => {
    const { assets } = site();
    const live = liveCode(HTML, assets);
    expect(live.entry).toBe(ENTRY);
    expect([...live.code.keys()].sort()).toEqual(["PageA-BBBBBBBB.js", "PageB-CCCCCCCC.js", ENTRY]);
    expect(() => liveCode("<html></html>", assets)).toThrow(/no entry script/);
  });

  it("gives a heavy code file a list of its own and lets light ones share", () => {
    const heavy = Array.from({ length: Math.ceil(OWN_GROUP_BYTES / 40) }, (_, index) => `A phrase of some length, number ${index}`);
    const light = (count: number) => Array.from({ length: count }, (_, index) => `Light ${index}`);
    const groups = planGroups(new Map([["Big.js", heavy], ["Small1.js", light(3)], ["Small2.js", light(3)], ["Small3.js", light(Math.ceil(GROUP_BYTES / 20))]]));
    expect(groups.get("Big.js")).toBe("g01");
    expect(groups.get("Small1.js")).toBe(groups.get("Small2.js"));
    expect(groups.get("Small3.js")).not.toBe(groups.get("Small1.js"));
  });
});

describe("writing the lists", () => {
  it("puts every translated phrase in the core list or a part, never both, and the same parts in every language", () => {
    const { root, assets, i18n } = site();
    const report = writePhraseLists({ html: HTML, assetsDir: assets, i18nDir: i18n });
    expect(report.build).toBe(ENTRY);
    expect(Object.keys(report.folders)).toEqual(["es", "hi"]);
    const core = read(path.join(i18n, "es", "phrases", "core.json"));
    expect(core.build).toBe(ENTRY);
    expect(Object.keys(core.groups).sort()).toEqual(["PageA-BBBBBBBB.js", "PageB-CCCCCCCC.js"]);
    // Core: the entry's own text, data text, short labels, plural messages, and phrases sharing a translation.
    expect(Object.keys(core.phrases).sort()).toEqual(["A sentence written only in a data file", "Close", "Every subject. Every verse.", "Kings of Israel and Judah", "Read the kings of Israel", 'plural:["{n} book","{n} books"]']);
    const parts = Object.assign({}, ...[...new Set(Object.values(core.groups) as string[])].map((name) => read(path.join(i18n, "es", "phrases", `${name}.json`)).phrases));
    expect(Object.keys(parts).sort()).toEqual(["Don’t miss the parables of the kingdom", "Open the profile of {n}", "The miracles of Jesus"]);
    const translated = Object.keys(SPANISH).filter((key) => SPANISH[key] !== key);
    expect([...Object.keys(core.phrases), ...Object.keys(parts)].sort()).toEqual(translated.sort()); // nothing lost, nothing twice
    expect(fs.readdirSync(path.join(i18n, "hi", "phrases")).sort()).toEqual(fs.readdirSync(path.join(i18n, "es", "phrases")).sort());
    expect(read(path.join(i18n, "hi", "phrases", "core.json")).groups).toEqual(core.groups);
    expect(fs.existsSync(path.join(root, "index.html"))).toBe(true);
  });

  it("removes lists left from an earlier split, and only those", () => {
    const { assets, i18n } = site();
    const lists = path.join(i18n, "es", "phrases");
    fs.mkdirSync(lists, { recursive: true });
    for (const name of ["g09.json", "core.json.123.tmp", "notes.txt"]) fs.writeFileSync(path.join(lists, name), "{}");
    writePhraseLists({ html: HTML, assetsDir: assets, i18nDir: i18n });
    const left = fs.readdirSync(lists);
    expect(left).toContain("notes.txt");
    expect(left).not.toContain("g09.json");
    expect(left.some((name) => name.endsWith(".tmp"))).toBe(false);
  });

  it("refuses a list that is not {English: translation}", () => {
    const { assets, i18n } = site();
    fs.writeFileSync(path.join(i18n, "es", "ui.json"), "[1,2]");
    expect(() => writePhraseLists({ html: HTML, assetsDir: assets, i18nDir: i18n })).toThrow(/not a JSON object/);
    fs.writeFileSync(path.join(i18n, "es", "ui.json"), "{");
    expect(() => writePhraseLists({ html: HTML, assetsDir: assets, i18nDir: i18n })).toThrow(/could not read/);
  });
});

describe("the release's stamp", () => {
  it("changes whenever any list does, and is written into every page carrying the marker", () => {
    const { root, assets, i18n } = site();
    fs.writeFileSync(path.join(root, "other.html"), "<html>no language script</html>");
    fs.mkdirSync(path.join(root, "study"));
    fs.writeFileSync(path.join(root, "study", "index.html"), HTML);
    const first = preparePhraseLists(root);
    expect(first.stamp).toMatch(/^[0-9a-f]{12}$/);
    expect(first.stampedPages).toBe(2);
    expect(fs.readFileSync(path.join(root, "index.html"), "utf8")).toContain(`/*phrase-stamp*/"${first.stamp}"`);
    expect(fs.readFileSync(path.join(root, "study", "index.html"), "utf8")).toContain(`/*phrase-stamp*/"${first.stamp}"`);
    expect(fs.readFileSync(path.join(root, "other.html"), "utf8")).toBe("<html>no language script</html>");

    expect(phraseStamp(i18n)).toBe(first.stamp);
    fs.writeFileSync(path.join(i18n, "hi", "ui.json"), JSON.stringify({ ...SPANISH, "The miracles of Jesus": "यीशु के चमत्कार" }));
    writePhraseLists({ html: HTML, assetsDir: assets, i18nDir: i18n });
    const second = preparePhraseLists(root); // a page stamped before is stamped again
    expect(second.stamp).not.toBe(first.stamp);
    expect(fs.readFileSync(path.join(root, "index.html"), "utf8")).toContain(`/*phrase-stamp*/"${second.stamp}"`);
  });

  it("refuses a stamp that is not 12 hex letters, and a page without exactly one marker", () => {
    const { root } = site();
    const page = path.join(root, "index.html");
    expect(() => writeStamp(page, '"};alert(1);//')).toThrow(/12 hex/);
    fs.writeFileSync(page, HTML + HTML);
    expect(() => writeStamp(page, "0123456789ab")).toThrow(/found 2/);
  });
});
