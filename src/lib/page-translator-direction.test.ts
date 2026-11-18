import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage, englishOf } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

const STRINGS: Record<string, string> = {
  "Read {n}": "اقرأ {n}",
  "2 Timothy": "تيموثاوس الثانية",
  "Open {n} Timothy {n}": "افتح {n} Timothy {n}",
  "{n} km ({n} mi) away, {n} points": "على بعد {n} km ({n} mi)، {n} نقطة",
  "{n}–{n} BC": "{n}–{n} ق.م",
  "Ages {n}–{n}": "الأعمار {n}–{n}",
  "Time -{n} points": "الوقت -{n} نقطة",
  "Write to {n}": "اكتب إلى {n}",
  "Not Modalism (one person)": "ليست أحادية (Modalism)",
};

const [open, close] = [String.fromCodePoint(0x2066), String.fromCodePoint(0x2069)];
const held = (run: string) => `${open}${run}${close}`;

describe("the page translator on a right-to-left page", () => {
  it("holds English left in English together, and the left-to-right runs inside a translated line", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => STRINGS })));
    document.body.replaceChildren();
    const add = (id: string, text: string, parent: Element = document.body) =>
      Object.assign(parent.appendChild(document.createElement("p")), { id, textContent: text });
    const text = (id: string) => document.getElementById(id)!.textContent;
    add("question", "Is your person a woman?");
    add("spaced", "  Jesse.  ");
    add("count", "0 / 7");
    add("dot", "·");
    add("read", "Read 2 Timothy 3");
    add("open", "Open 2 Timothy 3");
    add("distance", "27 km (17 mi) away, 756 points");
    add("years", "2140–1627 BC");
    add("ages", "Ages 8–12");
    add("penalty", "Time -21 points");
    add("mail", "Write to Q&A Box 2 · BSB");
    add("bracket", "Not Modalism (one person)");
    const label = add("label", "");
    label.setAttribute("aria-label", "Is your person a woman?");
    const kept = document.body.appendChild(Object.assign(document.createElement("div"), { translate: false }));
    add("kept", "WORD", kept);

    await chooseSiteLanguage("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(text("question")).toBe(held("Is your person a woman?"));
    expect(text("spaced")).toBe(`  ${held("Jesse.")}  `);
    expect(text("count")).toBe(held("0 / 7"));
    expect(text("dot")).toBe("·");
    expect(text("read")).toBe("اقرأ تيموثاوس الثانية 3");
    expect(text("open")).toBe(`افتح ${held("2 Timothy 3")}`);
    expect(text("distance")).toBe(`على بعد ${held("27 km (17 mi)")}، 756 نقطة`);
    expect(text("years")).toBe(`${held("2140–1627")} ق.م`);
    expect(text("ages")).toBe(`الأعمار ${held("8–12")}`);
    expect(text("penalty")).toBe(`الوقت ${held("-21")} نقطة`);
    expect(text("mail")).toBe(`اكتب إلى ${held("Q&A Box 2 · BSB")}`);
    expect(text("bracket")).toBe(`ليست أحادية (${held("Modalism")})`);
    expect(label.getAttribute("aria-label")).toBe("Is your person a woman?");
    expect(text("kept")).toBe("WORD");
    expect(englishOf(text("question")!)).toBe("Is your person a woman?");

    await chooseSiteLanguage("en");
    expect([text("question"), text("spaced"), text("read"), text("years")]).toEqual(["Is your person a woman?", "  Jesse.  ", "Read 2 Timothy 3", "2140–1627 BC"]);
  });
});
