import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage } from "./page-translator";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
  document.body.innerHTML = "";
});

const FILES: Record<string, Record<string, string>> = {
  "/data/i18n/es/ui.json": { Study: "Estudio" },
  "/data/i18n/es/ui-study.json": { "Who wrote this down, and how far did it reach?": "¿Quién escribió esto, y hasta dónde llegó?" },
};

describe("the page translator's study strings", () => {
  it("reads ui-study.json on a study page only", async () => {
    const asked: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      asked.push(url);
      return { ok: true, json: async () => FILES[url] };
    }));
    const text = document.body.appendChild(document.createElement("p"));
    text.textContent = "Who wrote this down, and how far did it reach?";

    window.history.pushState({}, "", "/topics");
    await chooseSiteLanguage("es");
    expect(asked).not.toContain("/data/i18n/es/ui-study.json");
    expect(text.textContent).toBe("Who wrote this down, and how far did it reach?");

    window.history.pushState({}, "", "/study/the-medieval-church");
    await chooseSiteLanguage("es");
    expect(text.textContent).toBe("¿Quién escribió esto, y hasta dónde llegó?");
  });
});
