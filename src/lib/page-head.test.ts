import { describe, expect, it } from "vitest";
import { HOME_TITLE, PERSON_ASPECTS, ROUTE_TITLES, SECTIONS, isUnnamed, pageHead, shorten } from "./page-head";

describe("pageHead", () => {
  it("names the home page for the site's own name", () => {
    expect(pageHead("/", {}).title).toBe(HOME_TITLE);
    expect(pageHead("/", {}).canonical).toBe("https://bibleguide.io/");
  });
  it("uses the searchable name of a main page, not its heading", () => {
    const head = pageHead("/study/atlas/", { heading: "Real places. An unfolding story.", paragraph: "Find a place. Follow a life. Step into the world of the Bible, then the communities that followed." });
    expect(head.title).toBe("Bible Atlas: Maps of Every Bible Place · Bible Guide");
    expect(head.canonical).toBe("https://bibleguide.io/study/atlas");
    expect(head.description).toMatch(/^Find a place/);
  });
  it("names a chapter with its version", () => {
    expect(pageHead("/read/kjv/GEN/1", { heading: "Genesis 1" }).title).toBe("Genesis 1 (KJV) · Bible Guide");
  });
  it("names other pages from their heading and section", () => {
    expect(pageHead("/people/moses-exo-2-10", { heading: "Moses" }).title).toBe("Moses · People · Bible Guide");
    expect(pageHead("/nowhere", {}).title).toBe("Bible Guide");
  });
  it("names a ruler, prophet or apostle page from its opening line", () => {
    const david = pageHead("/people/david-rut-4-17/rule", { subheading: "David. Seven years in Hebron, thirty-three in Jerusalem.", paragraph: "ON THE WORLD STAGE: The Philistines · Aram · Hamath" });
    expect(david.title).toBe("David: the Reign · Bible Guide");
    expect(david.description).toBe("David. Seven years in Hebron, thirty-three in Jerusalem.");
    expect(pageHead("/people/elijah-1ki-17-1/word", { subheading: "Elijah. The Tishbite who shut the heaven" }).title).toBe("Elijah: the Prophet · Bible Guide");
  });
  it("shortens long descriptions at a word", () => {
    const text = shorten("word ".repeat(60));
    expect(text.length).toBeLessThanOrEqual(156);
    expect(text.endsWith("word…")).toBe(true);
  });
  it("knows the titles nothing has set", () => {
    expect(isUnnamed("Bible Guide")).toBe(true);
    expect(isUnnamed("Moses · Bible Guide")).toBe(false);
  });
});

// In a translated language (stage 5 job 15) every fixed text goes through the language's phrase list. A made-up
// translation marks each text it is asked for, so English that skipped the lookup is left outside the marks.
describe("pageHead in a translated language", () => {
  const mark = (english: string) => `⟦${english}⟧`;
  // Marks nest where a value fills a line ("⟦⟦Name⟧, on Bible Guide: …⟧"), and a long one is cut ("…" with no "⟧").
  const english = (text: string) => {
    let rest = text;
    while (/⟦[^⟦⟧]*⟧/.test(rest)) rest = rest.replace(/⟦[^⟦⟧]*⟧/g, "");
    return rest.replace(/⟦.*$/, "").match(/[A-Za-z]{2,}/g) ?? [];
  };
  const shown = { heading: "⟦heading⟧", subheading: "⟦Name⟧. ⟦line⟧", paragraph: "" };

  it("looks up every fixed text: each main page, section, person page, the home page and the fallbacks", () => {
    const paths = [
      "/", "/nowhere", "/nowhere/below",
      ...Object.keys(ROUTE_TITLES),
      ...Object.keys(SECTIONS).map((section) => `/${section}/some-page`),
      ...Object.keys(PERSON_ASPECTS).map((aspect) => `/people/someone/${aspect}`),
    ];
    for (const path of paths) {
      for (const page of [shown, {}]) {
        const head = pageHead(path, page, mark);
        expect(english(head.title), `${path} title`).toEqual([]);
        expect(english(head.description), `${path} description`).toEqual([]);
      }
    }
    expect(pageHead("/study/atlas", shown, mark).title).toBe("⟦Bible Atlas: Maps of Every Bible Place⟧ · ⟦Bible Guide⟧");
    expect(pageHead("/people/moses-exo-2-10", { heading: "Moisés" }, mark).title).toBe("Moisés · ⟦People⟧ · ⟦Bible Guide⟧");
  });

  it("gives a main page with no translation yet its own heading, already in the language, rather than English", () => {
    const none = (text: string) => (text === "Bible Atlas: Maps of Every Bible Place" ? null : mark(text));
    expect(pageHead("/study/atlas", { heading: "Lugares reales" }, none).title).toBe("Lugares reales · ⟦Bible Guide⟧");
  });

  it("puts a person's name into the whole line, or after the language's words while the line has no translation", () => {
    const line = (text: string) => (text === "{n}: the Reign" ? "{n} 在位期间" : text === "the Reign" ? "在位" : null);
    expect(pageHead("/people/david-rut-4-17/rule", { subheading: "大卫。在希伯伦七年。" }, line).title).toBe("大卫 在位期间 · Bible Guide");
    const word = (text: string) => (text === "the Reign" ? "राज्य" : null);
    expect(pageHead("/people/david-rut-4-17/rule", { subheading: "दाऊद। हेब्रोन में सात वर्ष।" }, word).title).toBe("दाऊद: राज्य · Bible Guide");
  });

  it("never uses a line whose translation lost the place for the value, and writes a name exactly as given", () => {
    const lost = (text: string) => (text.includes("{n}") ? "sin lugar" : text === "{n}: the Reign" ? null : `es:${text}`);
    expect(pageHead("/nowhere", { heading: "Un nombre" }, lost).description).toBe("es:" + pageHead("/", {}).description);
    expect(pageHead("/people/david-rut-4-17/rule", { subheading: "David. Siete años." }, lost).title).toBe("David: es:the Reign · es:Bible Guide");
    const line = (text: string) => (text.startsWith("{n}, on") ? "{n}, en Bible Guide." : null);
    expect(pageHead("/nowhere", { heading: "Un nombre" }, line).description).toBe("Un nombre, en Bible Guide.");
    expect(pageHead("/nowhere", { heading: "A $& name" }).description).toBe("A $& name, on Bible Guide: the whole Bible free, with studies, an atlas and topics.");
  });

  it("cuts a description without spaces at the limit", () => {
    const text = shorten("经".repeat(200));
    expect(text.length).toBe(155);
    expect(text.endsWith("经…")).toBe(true);
  });
});
