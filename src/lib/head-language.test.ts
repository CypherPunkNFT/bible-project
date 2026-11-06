import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MARKER, headLanguages, withHeadLanguages } from "../../scripts/site-languages-vite";
import { SITE_LANGUAGES } from "./site-languages";

// The page's language before first paint (translation system, stage 5 job 15): index.html's language script, as the
// build fills it from src/lib/site-languages.json, sets <html lang> and dir before any of the site's code has loaded.
const FILE = "src/lib/site-languages.json";
const built = withHeadLanguages(readFileSync("index.html", "utf8"), headLanguages(JSON.parse(readFileSync(FILE, "utf8")).languages, FILE));
const languageScript = [...built.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((code) => code.includes("bp-language"))!;

/** index.html's language script run as the browser runs it, with `stored` as the reader's saved choice, on `host`. */
function arrive(stored: string | null, host = "127.0.0.1", pathname = "/"): HTMLElement {
  const root = document.documentElement;
  root.removeAttribute("lang");
  root.removeAttribute("dir");
  delete root.dataset.languageLoading;
  delete window.__bgEarly;
  if (stored === null) localStorage.removeItem("bp-language");
  else localStorage.setItem("bp-language", stored);
  new Function("location", languageScript)({ hostname: host, pathname });
  return root;
}

afterEach(() => {
  localStorage.removeItem("bp-language");
  vi.unstubAllGlobals();
});

describe("index.html's language script, as built", () => {
  it("is filled with every translated language from the one file, and only them", () => {
    const filled = JSON.parse(/const languages = (\{.*?\});/.exec(languageScript)![1]) as Record<string, { folder: string; dir: string; released: boolean }>;
    const translated = SITE_LANGUAGES.filter((language) => language.folder !== null);
    expect(Object.keys(filled).sort()).toEqual(translated.map((language) => language.code).sort());
    for (const language of translated) expect(filled[language.code], language.code).toEqual({ folder: language.folder, dir: language.dir, released: language.released });
  });

  it("sets lang and dir before the site's code runs: right to left for Arabic and the made-up ar-XB, left to right otherwise", () => {
    for (const language of SITE_LANGUAGES.filter((entry) => entry.folder !== null)) {
      const root = arrive(language.code);
      expect(root.lang, language.code).toBe(language.code);
      expect(root.dir, language.code).toBe(language.dir);
      expect(root.dataset.languageLoading, language.code).toBe("true");
    }
    expect(arrive("ar").dir).toBe("rtl");
    expect(arrive("ar-XB").dir).toBe("rtl");
  });

  it("on the live site, ignores a language chosen on the preview that is not released", () => {
    const unreleased = SITE_LANGUAGES.filter((language) => language.folder !== null && !language.released);
    expect(unreleased.length).toBeGreaterThan(0);
    for (const language of unreleased) expect(arrive(language.code, "bibleguide.io").getAttribute("dir"), language.code).toBeNull();
    expect(arrive("ar", "bibleguide.io").dir).toBe("rtl");
  });

  it("starts fetching the language's core phrase list at once, and a study or people page's own list (job 17)", async () => {
    const fetched: Array<[string, RequestCache | undefined]> = [];
    vi.stubGlobal("fetch", (address: string, init?: RequestInit) => {
      fetched.push([address, init?.cache]);
      return Promise.resolve(new Response(address.endsWith("ui-study.json") ? "nope" : JSON.stringify({ build: "x" }), { status: address.endsWith("ui-study.json") ? 404 : 200 }));
    });
    arrive("hi", "127.0.0.1", "/study/the-farming-year");
    expect(fetched).toEqual([["/data/i18n/hi/phrases/core.json", "no-cache"], ["/data/i18n/hi/ui-study.json", "no-cache"]]);
    expect(window.__bgStamp).toBe("");
    // The answers wait for the site's code: JSON, the HTTP status of a failure, or null when nothing answered.
    expect(await window.__bgEarly!["/data/i18n/hi/phrases/core.json"]).toEqual({ build: "x" });
    expect(await window.__bgEarly!["/data/i18n/hi/ui-study.json"]).toBe(404);
    fetched.length = 0;
    arrive("pt-BR", "127.0.0.1", "/people/david-rut-4-17");
    expect(fetched.map(([address]) => address)).toEqual(["/data/i18n/pt/phrases/core.json", "/data/i18n/pt/ui-people.json"]);
    fetched.length = 0;
    vi.stubGlobal("fetch", (address: string) => (fetched.push([address, undefined]), Promise.reject(new TypeError("offline"))));
    arrive("es", "127.0.0.1", "/studying");
    expect(fetched.map(([address]) => address)).toEqual(["/data/i18n/es/phrases/core.json"]);
    expect(await window.__bgEarly!["/data/i18n/es/phrases/core.json"]).toBeNull();
    fetched.length = 0;
    arrive("en");
    arrive("en-XA", "bibleguide.io");
    expect(fetched).toEqual([]);
  });

  it("asks for the stamped core list, which a browser may keep, once a release has written its stamp", () => {
    const fetched: Array<[string, RequestCache | undefined]> = [];
    vi.stubGlobal("fetch", (address: string, init?: RequestInit) => (fetched.push([address, init?.cache]), Promise.resolve(new Response("{}"))));
    const stamped = languageScript.replace('/*phrase-stamp*/""', '/*phrase-stamp*/"0123456789ab"');
    localStorage.setItem("bp-language", "es");
    new Function("location", stamped)({ hostname: "bibleguide.io", pathname: "/teachers" });
    expect(fetched).toEqual([["/data/i18n/es/phrases/core.json?v=0123456789ab", "default"], ["/data/i18n/es/ui-study.json", "no-cache"]]);
    expect(window.__bgStamp).toBe("0123456789ab");
  });

  it("leaves the page as written for English, nothing stored, or a stored value the file does not hold", () => {
    for (const stored of [null, "en", "xx", "__proto__", "constructor", "</script>"]) {
      const root = arrive(stored);
      expect(root.getAttribute("lang"), String(stored)).toBeNull();
      expect(root.getAttribute("dir"), String(stored)).toBeNull();
      expect(root.dataset.languageLoading, String(stored)).toBeUndefined();
    }
  });
});

describe("the build's language writer (scripts/site-languages-vite.ts)", () => {
  const html = `<script>const languages = ${MARKER};</script>`;
  it("refuses a page with no marker or two, and an entry that is not a plain code and direction", () => {
    expect(() => withHeadLanguages("<script></script>", {})).toThrow(/expected one/);
    expect(() => withHeadLanguages(html + html, {})).toThrow(/found 2/);
    const entry = { code: "es", folder: "es", dir: "ltr", released: true };
    expect(() => headLanguages({}, FILE)).toThrow(/no "languages" list/);
    expect(() => headLanguages([{ ...entry, code: "es\"};alert(1);//" }], FILE)).toThrow(/is not/);
    expect(() => headLanguages([{ ...entry, dir: "down" }], FILE)).toThrow(/is not/);
    expect(() => headLanguages([{ ...entry, released: "yes" }], FILE)).toThrow(/is not/);
    expect(() => headLanguages([{ ...entry, folder: "../x" }], FILE)).toThrow(/folder/);
    expect(() => headLanguages([{ ...entry, folder: 7 }], FILE)).toThrow(/folder/);
    expect(headLanguages([{ ...entry, code: "en", folder: null }], FILE)).toEqual({});
  });
  it("writes nothing that can close the script", () => {
    expect(withHeadLanguages(html, { "a</script>": { folder: "es", dir: "ltr", released: true } })).not.toContain("</script>\"");
  });
});
