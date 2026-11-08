import { afterEach, describe, expect, it, vi } from "vitest";
import { setSiteLanguage } from "@/lib/language";
import { inSiteLanguage } from "./translated-data";
import { orderOf, withEnglishLabels, type Person } from "./whos-older/pairing";

const english = { stamp: "a1", rules: { woman: { odd: "is the only man" } } };
const spanish = { stamp: "a1", rules: { woman: { odd: "es el único hombre" } } };

function serve(body: unknown, status = 200) {
  const fetch = vi.fn(async (url: string) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": url.endsWith(".json") ? "application/json" : "text/html" } }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  setSiteLanguage("en");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a game's data in the site's language", () => {
  it("reads nothing in English", async () => {
    const fetch = serve(spanish);
    expect(await inSiteLanguage("odd-one-out/sets.json", english)).toBe(english);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the translated copy made from the same build of the English", async () => {
    setSiteLanguage("es");
    const fetch = serve(spanish);
    expect(await inSiteLanguage("odd-one-out/sets.json", english)).toEqual(spanish);
    expect(fetch.mock.calls.map(([url]) => url)).toContain("/data/i18n/es/odd-one-out/sets.json");
  });

  it("keeps the English when the copy is stale, missing or not JSON", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setSiteLanguage("es");
    serve({ ...spanish, stamp: "old" });
    expect(await inSiteLanguage("odd-one-out/sets.json", english)).toBe(english);
    serve({}, 404);
    expect(await inSiteLanguage("odd-one-out/sets.json", english)).toBe(english);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!doctype html>", { headers: { "content-type": "text/html" } })));
    expect(await inSiteLanguage("odd-one-out/sets.json", english)).toBe(english);
  });
});

describe("who's older in another language", () => {
  const person = (id: string, label: string): Person => ({ id, label, tier: 1, lo: -1000, hi: -990, shown: true });
  const index = { facts: new Map(), blocked: new Set<string>() };

  it("asks the same pairs: the clash rule reads the English labels", () => {
    const englishData = { characters: [person("james-mat-4-21", "James"), person("james-gal-1-19", "James brother of Jesus")] };
    const englishOnly = { characters: [person("james-gal-1-19", "James brother of Jesus")] };
    englishData.characters[1].lo = -900; englishData.characters[1].hi = -890;
    expect(orderOf(englishData.characters[0], englishData.characters[1], index)).toBeNull(); // same first word, one unqualified
    const translated = { characters: [person("james-mat-4-21", "雅各"), { ...englishData.characters[1], label: "耶稣的兄弟雅各" }] };
    const shown = withEnglishLabels(translated, englishData);
    expect(shown.characters.map((p) => p.label)).toEqual(["雅各", "耶稣的兄弟雅各"]);
    expect(orderOf(shown.characters[0], shown.characters[1], index)).toBeNull();
    expect(withEnglishLabels(englishOnly, englishOnly)).toBe(englishOnly);
  });
});
