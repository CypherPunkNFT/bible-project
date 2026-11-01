import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

describe("the page translator and a Bible's words", () => {
  it("translates page text but never a word of Scripture, even one that matches a label", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ Of: "De", Called: "Llamado" }) })));
    document.body.innerHTML = `
      <p id="page">of</p>
      <div class="scripture" lang="en"><span id="reader">of</span> <span id="reader-2">called</span></div>
      <span lang="en" id="marked">of</span>`;
    await chooseSiteLanguage("es");
    expect(document.getElementById("page")!.textContent).toBe("de");
    expect(document.getElementById("reader")!.textContent).toBe("of");
    expect(document.getElementById("reader-2")!.textContent).toBe("called");
    expect(document.getElementById("marked")!.textContent).toBe("of");
  });
});
