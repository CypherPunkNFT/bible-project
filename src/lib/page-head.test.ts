import { describe, expect, it } from "vitest";
import { HOME_TITLE, isUnnamed, pageHead, shorten } from "./page-head";

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
