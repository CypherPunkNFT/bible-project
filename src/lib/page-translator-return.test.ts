import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

const STRINGS: Record<string, Record<string, string>> = {
  zh: { "Holy Bible": "圣经", Bible: "圣经", Witness: "见证", "the {n}": "第 {n}" },
  ar: { "Holy Bible": "الكتاب المقدس", Bible: "الكتاب المقدس", Witness: "شهادة" },
};

describe("the page translator going back", () => {
  it("returns every text to its own English, not to another string that shares its translation or to capitals", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => STRINGS[url.split("/")[3]] })));
    const add = (tag: string, id: string, text: string) => Object.assign(document.body.appendChild(document.createElement(tag)), { id, textContent: text });
    add("a", "link", "Bible").title = "Witness";
    add("h2", "title", "Holy Bible");
    add("span", "caps", "WITNESS");
    add("b", "own", "圣经").setAttribute("translate", "no");
    add("i", "number", "6");
    await chooseSiteLanguage("zh-Hans");
    expect(document.getElementById("link")!.textContent).toBe("圣经");
    expect(document.getElementById("number")!.textContent).toBe("6");
    await chooseSiteLanguage("ar");
    expect(document.getElementById("title")!.textContent).toBe("الكتاب المقدس");
    expect(document.getElementById("link")!.title).toBe("شهادة");
    await chooseSiteLanguage("en");
    expect(document.getElementById("link")!.textContent).toBe("Bible");
    expect(document.getElementById("title")!.textContent).toBe("Holy Bible");
    expect(document.getElementById("caps")!.textContent).toBe("WITNESS");
    expect(document.getElementById("link")!.title).toBe("Witness");
    expect(document.getElementById("own")!.textContent).toBe("圣经");
  });
});
