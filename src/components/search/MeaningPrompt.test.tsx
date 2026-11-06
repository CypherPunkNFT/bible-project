import { readFileSync } from "node:fs";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { setSiteLanguage } from "@/lib/language";
import { chooseSiteLanguage } from "@/lib/page-translator";
import { SITE_LANGUAGES } from "@/lib/site-languages";
import { MeaningPrompt } from "./MeaningPrompt";

// Meaning search's model reads English only, so in every other site language each place that offers it says so, in the
// reader's language (translation system, stage 5 job 16). The notice's wording in each language is the hand-written
// seed (content/translation/seed/<folder>.json), which apply.py puts into that language's phrase list.
const NOTICE = "Meaning search understands English only for now. Questions in other languages are searched by their own words.";
const seed = (folder: string) => JSON.parse(readFileSync(`content/translation/seed/${folder}.json`, "utf8")) as Record<string, string>;
const show = () => render(<MemoryRouter><MeaningPrompt query="¿Por qué sufrimos?" /></MemoryRouter>);

afterEach(() => {
  vi.unstubAllGlobals();
  setSiteLanguage("en");
  cleanup();
});

describe.each(SITE_LANGUAGES.filter((language) => language.folder && !language.pseudo).map((language) => [language.code, language.folder!]))("meaning search in %s", (code, folder) => {
  it("says plainly, in the language, that it reads English only", async () => {
    const translated = seed(folder)[NOTICE];
    expect(translated, `seed/${folder}.json has no wording of the notice`).toBeTruthy();
    expect(translated).not.toBe(NOTICE);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => (url === `/data/i18n/${folder}/ui.json` ? { [NOTICE]: translated } : {}) })));
    await chooseSiteLanguage(code);
    const { container } = show();
    await waitFor(() => expect(container.textContent).toContain(translated));
  });
});

describe("meaning search in English", () => {
  it("does not show the notice", () => {
    const { container } = show();
    expect(container.textContent).not.toContain(NOTICE);
  });
});
