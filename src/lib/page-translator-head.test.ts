import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage, englishOf, setOwnTitle } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

// The tab title goes through the same lookup as the page body (translation system, stage 5 job 15).
const STRINGS: Record<string, Record<string, string>> = {
  es: { "The farming year · Bible Guide": "El año agrícola · Bible Guide", Hymns: "Himnos", Study: "Estudio", "{n} · Apostles · Bible Guide": "{n} · Apóstoles · Bible Guide" },
  ar: { "The farming year · Bible Guide": "السنة الزراعية · Bible Guide", Hymns: "الترانيم", Study: "دراسة" },
  xb: { "Bible Guide": "⟦يذبسج کقذثج ~⟧", Hymns: "⟦ٹغجق ~⟧" },
};
const settled = () => new Promise((done) => setTimeout(done));

describe("the page translator and the tab title", () => {
  it("swaps a title a page writes itself, follows every change of language and comes back to English", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => STRINGS[url.split("/")[3]] ?? {} })));
    document.title = "The farming year · Bible Guide";
    await chooseSiteLanguage("es");
    expect(document.title).toBe("El año agrícola · Bible Guide");

    // A page that names itself later, in pieces the phrase list knows one by one, or around a value.
    document.title = "Hymns · Study · Bible Guide";
    await settled();
    expect(document.title).toBe("Himnos · Estudio · Bible Guide");
    document.title = "Pablo · Apostles · Bible Guide";
    await settled();
    expect(document.title).toBe("Pablo · Apóstoles · Bible Guide");

    await chooseSiteLanguage("ar");
    expect(document.title).toBe("Pablo · Apostles · Bible Guide"); // no Arabic for that line yet: its English, never Spanish
    document.title = "The farming year · Bible Guide";
    await settled();
    expect(document.title).toBe("السنة الزراعية · Bible Guide");

    await chooseSiteLanguage("en");
    expect(document.title).toBe("The farming year · Bible Guide");
  });

  it("leaves alone the title usePageHead wrote in the reader's language, and knows the site's own name in any language", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => STRINGS[url.split("/")[3]] ?? {} })));
    await chooseSiteLanguage("es");
    setOwnTitle("Hymns · Bible Guide");
    await settled();
    expect(document.title).toBe("Hymns · Bible Guide");

    await chooseSiteLanguage("ar-XB");
    document.title = "Bible Guide"; // what a page puts back when it closes
    await settled();
    expect(document.title).toBe("⟦يذبسج کقذثج ~⟧");
    expect(englishOf(document.title)).toBe("Bible Guide");
    await chooseSiteLanguage("en");
  });
});
