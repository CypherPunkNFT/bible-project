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
