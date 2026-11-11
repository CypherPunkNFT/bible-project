import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

describe("the page translator and a Bible's words", () => {
  it("translates page text but never a word of Scripture, even one that matches a label", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ Of: "De", Called: "Llamado" }) })));
    const text = (tag: string, id: string, value: string) => { const element = document.createElement(tag); element.id = id; element.textContent = value; return element; };
    const scripture = document.createElement("div"); scripture.className = "scripture"; scripture.lang = "en";
    scripture.append(text("span", "reader", "of"), document.createTextNode(" "), text("span", "reader-2", "called"));
    const marked = text("span", "marked", "of"); marked.lang = "en";
    document.body.replaceChildren(text("p", "page", "of"), scripture, marked);
    await chooseSiteLanguage("es");
    expect(document.getElementById("page")!.textContent).toBe("de");
    expect(document.getElementById("reader")!.textContent).toBe("of");
    expect(document.getElementById("reader-2")!.textContent).toBe("called");
    expect(document.getElementById("marked")!.textContent).toBe("of");
  });
});
