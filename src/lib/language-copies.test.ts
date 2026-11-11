import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readyMade, type Capture } from "../../scripts/seo/shell";
import { languageCaptureFile, languageCopy, languageCopyFile, plannedCopies, writeLanguageCopies } from "../../scripts/seo/language-copies";
import { addressLanguages, ADDRESSED_PAGES } from "./language-addresses";
import { SITE_LANGUAGES } from "./site-languages";

// The main pages' ready-made copies in each language for search engines (translation system, stage 5 job 18).
const SHELL = readFileSync("index.html", "utf8");
const spanish = SITE_LANGUAGES.find((language) => language.code === "es")!;
const arabic = SITE_LANGUAGES.find((language) => language.code === "ar")!;
const capture = (page: string, code: string): Capture => ({
  path: page, capturedAt: "2026-11-06T00:00:00Z", base: "http://127.0.0.1:8931", language: code, build: "index-x.js",
  title: `Atlas <b> & "${code}" · Bible Guide`, heading: "Atlas", paragraph: "", description: `Mapas ${code} <script>`,
  blocks: [{ tag: "h1", text: "Atlas bíblico" }, { tag: "p", text: "Encuentra un lugar." }],
  links: [{ path: "/study/people", text: "Personas" }, { path: "/people/david-rut-4-17", text: "David" }],
});

const temporary: string[] = [];
afterEach(() => { for (const folder of temporary.splice(0)) rmSync(folder, { recursive: true, force: true }); });

describe("a language copy", () => {
  it("is the page in its language at its own address, naming every version", () => {
    const html = languageCopy(SHELL, capture("/study/atlas", "es"), spanish);
    expect(html).toContain('<html lang="es" dir="ltr">');
    expect(html).toContain("<title>Atlas &lt;b&gt; &amp; &quot;es&quot; · Bible Guide</title>");
    expect(html).toContain('<meta name="description" content="Mapas es &lt;script&gt;" />');
    expect(html).toContain('<link rel="canonical" href="https://bibleguide.io/es/study/atlas" />');
    expect(html).toContain('<meta property="og:url" content="https://bibleguide.io/es/study/atlas" />');
    expect(html.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+" \/>/g)).toEqual([
      "en study/atlas", "es es/study/atlas", "pt pt/study/atlas", "zh-Hans zh/study/atlas", "ar ar/study/atlas", "hi hi/study/atlas", "id id/study/atlas", "x-default study/atlas",
    ].map((pair) => { const [hreflang, address] = pair.split(" "); return `<link rel="alternate" hreflang="${hreflang}" href="https://bibleguide.io/${address}" />`; }));
    // Its links to other main pages stay in the language; other pages keep their one address.
    expect(html).toContain('<a href="/es/study/people">Personas</a>');
    expect(html).toContain('<a href="/people/david-rut-4-17">David</a>');
    expect(html).toContain("<h1>Atlas bíblico</h1>");
    // The release stamps the phrase lists into every page carrying exactly one marker (job 17).
    expect(html.split("/*phrase-stamp*/").length - 1).toBe(1);
    expect(languageCopy(SHELL, capture("/", "ar"), arabic)).toContain('<html lang="ar" dir="rtl">');
  });

  it("refuses a capture without the page's own description", () => {
    expect(() => languageCopy(SHELL, { ...capture("/study", "es"), description: undefined }, spanish)).toThrow(/no description/);
  });

  it("is served from es.html for the home page and es/<page>.html otherwise", () => {
    expect(languageCopyFile("site", "/es")).toBe(path.join("site", "es.html"));
    expect(languageCopyFile("site", "/es/study/atlas")).toBe(path.join("site", "es", "study", "atlas.html"));
  });
});

describe("the English copies", () => {
  const english: Capture = { ...capture("/study/atlas", "en"), language: undefined, title: "Bible Atlas · Bible Guide" };
  it("name the language versions only once the addresses are released", () => {
    expect(readyMade(SHELL, english, false)).not.toContain("hreflang");
    expect(readyMade(SHELL, english, false)).toContain('<link rel="canonical" href="https://bibleguide.io/study/atlas" />\n  </head>');
    const released = readyMade(SHELL, english, true);
    expect(released.match(/hreflang=/g)).toHaveLength(8);
    expect(released).toContain('<link rel="alternate" hreflang="x-default" href="https://bibleguide.io/study/atlas" />');
    expect(released).toContain('<html lang="en">');
  });
});

// These write every page's copy in every language to disk (about 200 files a test): about a second alone, past vitest's
// default 5 s when the whole suite runs at once on a busy Windows disk (seen 2026-11-07).
describe("writing the language copies", { timeout: 30_000 }, () => {
  const site = () => {
    const root = mkdtempSync(path.join(tmpdir(), "language-copies-"));
    temporary.push(root);
    mkdirSync(path.join(root, "site"));
    writeFileSync(path.join(root, "site", "index.html"), SHELL);
    return root;
  };
  const captureAll = (root: string, skip?: string) => {
    for (const { language, page } of plannedCopies()) {
      if (`${language.folder}${page}` === skip) continue;
      const file = languageCaptureFile(root, language.folder!, page);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(capture(page, language.code)));
    }
  };

  it("adds one file per main page and language, under the owner's cap of 100", () => {
    const root = site();
    captureAll(root);
    const { written, missing } = writeLanguageCopies(path.join(root, "site"), root, true);
    expect(missing).toEqual([]);
    expect(written).toHaveLength(ADDRESSED_PAGES.length * addressLanguages().length);
    expect(written.length).toBeLessThan(100);
    expect(written).toContain("es.html");
    expect(written).toContain("zh/study/atlas.html");
    expect(existsSync(path.join(root, "site", "id", "testimonies.html"))).toBe(true);
  });

  it("for a release, stops on a missing capture; for the preview, writes the rest", () => {
    const root = site();
    captureAll(root, "hi/topics");
    expect(() => writeLanguageCopies(path.join(root, "site"), root, true)).toThrow(/hi\/topics \(not captured\)/);
    rmSync(path.join(root, "site", "es.html"));
    const preview = writeLanguageCopies(path.join(root, "site"), root, false);
    expect(preview.missing).toEqual(["/hi/topics (not captured)"]);
    expect(preview.written).toHaveLength(ADDRESSED_PAGES.length * addressLanguages().length - 1);
  });

  it("refuses a capture filed under the wrong page or language", () => {
    const root = site();
    captureAll(root);
    writeFileSync(languageCaptureFile(root, "es", "/study"), JSON.stringify(capture("/study", "pt-BR")));
    expect(() => writeLanguageCopies(path.join(root, "site"), root, false)).toThrow(/expected \/study in es/);
  });

  it("stops past the owner's cap", () => {
    const pages = Array.from({ length: 17 }, (_, index) => `/page-${index}`);
    expect(() => plannedCopies(addressLanguages(), pages)).toThrow(/102 files, over the owner's cap of 99/);
  });
});
