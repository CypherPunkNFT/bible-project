import { existsSync, readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { takeLanguageAddress } from "./language";
import {
  ADDRESSED_PAGES, addressesOn, addressLanguages, COPY_LIMIT, fromAddress, hreflangOf, LANGUAGE_ADDRESSES_RELEASED, languageAddress, pageLinks,
} from "./language-addresses";
import { SITE_LANGUAGES } from "./site-languages";

// Each language's own address for the main pages (translation system, stage 5 job 18; SiteTranslation/system/HANDOFF.md).

afterEach(() => {
  localStorage.removeItem("bp-language");
  vi.unstubAllGlobals();
});

describe("the language addresses", () => {
  it("are not released: the owner's yes flips this, and this test with it", () => {
    expect(LANGUAGE_ADDRESSES_RELEASED).toBe(false);
    expect(addressesOn("bibleguide.io")).toBe(false);
    expect(addressesOn("127.0.0.1") && addressesOn("localhost")).toBe(true);
    expect(addressesOn("bibleguide.io", true)).toBe(true);
  });

  it("belong to the six released real languages, never English or a made-up one", () => {
    expect(addressLanguages().map((language) => language.folder)).toEqual(["es", "pt", "zh", "ar", "hi", "id"]);
    const pseudo = SITE_LANGUAGES.filter((language) => language.pseudo);
    expect(pseudo.length).toBeGreaterThan(0);
    for (const language of pseudo) expect(fromAddress(`/${language.folder}/study`), language.code).toBeNull();
    // Even one marked released by mistake (the release refuses that too).
    expect(addressLanguages(pseudo.map((language) => ({ ...language, released: true })))).toEqual([]);
  });

  it("stay under the owner's cap of 100 extra files, and every main page has its English ready-made copy", () => {
    expect(ADDRESSED_PAGES.length * addressLanguages().length).toBeLessThanOrEqual(COPY_LIMIT);
    for (const page of ADDRESSED_PAGES) expect(existsSync(`content/seo/pages/${page === "/" ? "index" : page.slice(1).split("/").join("__")}.json`), page).toBe(true);
  });

  it("are named by no page, folder or file of the site itself", () => {
    const routes = [...readFileSync("src/App.tsx", "utf8").matchAll(/path="\/([^/"]*)/g)].map((match) => match[1].toLowerCase());
    const published = readdirSync("public").map((name) => name.toLowerCase().replace(/\.html$/, ""));
    for (const language of addressLanguages()) {
      expect(routes, language.folder!).not.toContain(language.folder);
      expect(published, language.folder!).not.toContain(language.folder);
    }
  });

  it("read a whole first segment in any case, and give the page's own address without it", () => {
    expect(fromAddress("/es/study")).toEqual({ code: "es", folder: "es", path: "/study" });
    expect(fromAddress("/es")).toEqual({ code: "es", folder: "es", path: "/" });
    expect(fromAddress("/es/")?.path).toBe("/");
    expect(fromAddress("/PT/study/atlas")).toEqual({ code: "pt-BR", folder: "pt", path: "/study/atlas" });
    expect(fromAddress("/zh/people/david")?.code).toBe("zh-Hans");
    for (const pathname of ["/", "/essay", "/esp", "/es-x/study", "/en/study", "/study/es", "/xa", "/idea", "/hit"]) expect(fromAddress(pathname), pathname).toBeNull();
  });

  it("never let the page's own address name another site", () => {
    expect(fromAddress("/es//evil.example")?.path).toBe("/evil.example");
    expect(fromAddress("/es/\\\\evil.example")?.path).toBe("/evil.example");
    expect(fromAddress("/es\\evil.example")).toBeNull();
  });

  it("write each page's address and the hreflang of each language", () => {
    expect(languageAddress("/", "es")).toBe("/es");
    expect(languageAddress("/study/atlas/", "hi")).toBe("/hi/study/atlas");
    expect(["en", "es", "pt-BR", "zh-Hans", "ar", "id", "sr-Latn-RS", "es-419"].map(hreflangOf)).toEqual(["en", "es", "pt", "zh-Hans", "ar", "id", "sr-Latn", "es"]);
  });
});

describe("pageLinks: the official address and the versions in other languages", () => {
  it("off: every page names its one English address and no versions, as before", () => {
    expect(pageLinks("/study", "es", false)).toEqual({ canonical: "https://bibleguide.io/study", alternates: [] });
    expect(pageLinks("/", "hi", false).canonical).toBe("https://bibleguide.io/");
  });

  it("on: each main page in each language names itself, and every version lists the same set", () => {
    for (const page of ADDRESSED_PAGES) {
      const english = pageLinks(page, "en", true);
      expect(english.canonical, page).toBe(`https://bibleguide.io${page}`);
      expect(english.alternates.map((alternate) => alternate.hreflang), page).toEqual(["en", "es", "pt", "zh-Hans", "ar", "hi", "id", "x-default"]);
      expect(english.alternates.at(-1)!.href, page).toBe(english.canonical);
      for (const language of addressLanguages()) {
        const links = pageLinks(page, language.code, true);
        expect(links.alternates, `${page} ${language.code}`).toEqual(english.alternates);
        expect(links.alternates.find((alternate) => alternate.hreflang === hreflangOf(language.code))!.href).toBe(links.canonical);
        expect(links.canonical).toBe(`https://bibleguide.io${languageAddress(page, language.folder!)}`);
      }
    }
    expect(pageLinks("/", "es", true).canonical).toBe("https://bibleguide.io/es");
    expect(pageLinks("/", "en", true).alternates[0].href).toBe("https://bibleguide.io/");
  });

  it("on: a page without addresses, or a made-up language, keeps the English address", () => {
    expect(pageLinks("/people/david-rut-4-17", "es", true)).toEqual({ canonical: "https://bibleguide.io/people/david-rut-4-17", alternates: [] });
    expect(pageLinks("/study", "en-XA", true).canonical).toBe("https://bibleguide.io/study");
  });
});

describe("takeLanguageAddress: the app's start-up at a language address", () => {
  const history = () => ({ state: { idx: 3 }, calls: [] as unknown[][], replaceState(...args: unknown[]) { this.calls.push(args); } });

  it("drops the prefix, keeping the query, the fragment and the history state, and keeps the language", () => {
    const h = history();
    expect(takeLanguageAddress({ hostname: "127.0.0.1", pathname: "/es/study", search: "?q=1", hash: "#top" }, h)).toBe("es");
    expect(h.calls).toEqual([[{ idx: 3 }, "", "/study?q=1#top"]]);
    expect(localStorage.getItem("bp-language")).toBe("es");
    const home = history();
    expect(takeLanguageAddress({ hostname: "localhost", pathname: "/ar", search: "", hash: "" }, home)).toBe("ar");
    expect(home.calls[0][2]).toBe("/");
  });

  it("changes nothing for an address with no language, or on the live site while the addresses are not released", () => {
    const h = history();
    expect(takeLanguageAddress({ hostname: "127.0.0.1", pathname: "/essay", search: "", hash: "" }, h)).toBeNull();
    expect(takeLanguageAddress({ hostname: "bibleguide.io", pathname: "/es/study", search: "", hash: "" }, h)).toBeNull();
    expect(h.calls).toEqual([]);
    expect(localStorage.getItem("bp-language")).toBeNull();
  });

  it("runs as the site starts: the address wins over the stored language, and the router sees the plain address", async () => {
    localStorage.setItem("bp-language", "ar");
    window.history.pushState(null, "", "/es/study/atlas?x=1");
    vi.resetModules();
    const fresh = await import("./language");
    expect(fresh.siteLanguage()).toBe("es");
    expect(window.location.pathname + window.location.search).toBe("/study/atlas?x=1");
    expect(localStorage.getItem("bp-language")).toBe("es");
    window.history.pushState(null, "", "/");
  });

  it("still sets the language when the address bar or storage refuses", () => {
    const refusing = { state: null, replaceState() { throw new DOMException("refused", "SecurityError"); } };
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("localStorage", { setItem: () => { throw new Error("denied"); }, getItem: () => null, removeItem: () => undefined });
    expect(takeLanguageAddress({ hostname: "127.0.0.1", pathname: "/hi/topics", search: "", hash: "" }, refusing)).toBe("hi");
  });
});
