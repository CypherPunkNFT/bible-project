import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// A fixed index, so the switch and the links are tested apart from the research files as they change: Moses has a
// rule page and a word page, Peter a mission page, Elijah only a word page; Barnabas a mission page and no word page.
vi.mock("@/data/people-pages/index.json", () => ({
  default: {
    groups: [],
    rulers: [{ id: "moses-exo-2-10", group: "rulers-judges", kind: "leader", realm: "tribes", name: "Moses", title: "Leader of Israel", tagline: "", order: 1, reignText: "", verdictTone: "none", prophets: [], sex: "M" }],
    apostles: [
      { id: "peter-mat-4-18", group: "apostles-1", name: "Peter", otherNames: [], title: "One of the Twelve", tagline: "", order: 1, sex: "M" },
      { id: "barnabas-act-4-36", group: "church-jerusalem", name: "Barnabas", otherNames: [], title: "Apostle", tagline: "", order: 20, sex: "M" },
    ],
    prophets: [
      { id: "moses-exo-2-10", group: "prophets-wilderness-judges", name: "Moses", kind: "prophet", era: "wilderness", order: 1, title: "Prophet", tagline: "", kings: [], books: [], sex: "M" },
      { id: "elijah-1ki-17-1", group: "prophets-north", name: "Elijah", kind: "prophet", era: "divided", order: 2, title: "Prophet", tagline: "", kings: ["ahab-1ki-16-28"], books: [], sex: "M" },
      { id: "eldad-num-11-26", group: "prophets-wilderness-judges", name: "Eldad and Medad", kind: "prophet", era: "wilderness", order: 3, title: "Prophets", tagline: "", kings: [], books: [], sex: "M", personIds: ["medad-num-11-26"] },
      { id: "hananiah-jer-28-1", group: "prophets-jeremiah", name: "Hananiah", kind: "false", era: "divided", order: 30, title: "Not sent", tagline: "", kings: [], books: [], sex: "M" },
    ],
  },
}));

const { prophetFor, prophetHref, prophetsOfEra, specialPagesOf, personPath, isAspect } = await import("@/lib/people-pages-index");
const { AspectSwitch, EntryCard } = await import("./PersonEntry");

describe("prophet pages in the index", () => {
  it("finds a word page by the page's own id or another record of the same people", () => {
    expect(prophetFor("elijah-1ki-17-1")?.name).toBe("Elijah");
    expect(prophetFor("medad-num-11-26")?.id).toBe("eldad-num-11-26");
    expect(prophetFor("abel-gen-4-2")).toBeUndefined();
  });

  it("links a prophet to the word page, else the mission page, else the person page", () => {
    expect(prophetHref("elijah-1ki-17-1")).toBe("/people/elijah-1ki-17-1/word");
    expect(prophetHref("medad-num-11-26")).toBe("/people/eldad-num-11-26/word");
    expect(prophetHref("barnabas-act-4-36")).toBe("/people/barnabas-act-4-36/mission");
    expect(prophetHref("abel-gen-4-2")).toBe("/people/abel-gen-4-2");
  });

  it("knows the word as a page of its own, beside the rule and the mission", () => {
    expect(isAspect("word")).toBe(true);
    expect(isAspect("song")).toBe(false);
    expect(personPath("elijah-1ki-17-1", "word")).toBe("/people/elijah-1ki-17-1/word");
    expect(specialPagesOf("moses-exo-2-10").map((p) => p.aspect)).toEqual(["rule", "word"]);
    expect(specialPagesOf("peter-mat-4-18").map((p) => p.aspect)).toEqual(["mission"]);
    expect(specialPagesOf("abel-gen-4-2")).toEqual([]);
  });

  it("orders an era's prophets by their story order", () => {
    expect(prophetsOfEra("wilderness").map((p) => p.name)).toEqual(["Moses", "Eldad and Medad"]);
    expect(prophetsOfEra("divided").map((p) => p.name)).toEqual(["Elijah", "Hananiah"]);
  });
});

describe("the switch between a person's pages", () => {
  const switchFor = (id: string, name: string, current?: "rule" | "word") => {
    render(<MemoryRouter><AspectSwitch id={id} name={name} current={current} /></MemoryRouter>);
    return screen.getByRole("navigation", { name: `Pages about ${name}` });
  };

  it("shows all three of Moses's pages, the current one marked", () => {
    const nav = switchFor("moses-exo-2-10", "Moses", "word");
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["The person", "As leader", "The word"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/people/moses-exo-2-10", "/people/moses-exo-2-10/rule", "/people/moses-exo-2-10/word"]);
    expect(within(nav).getByRole("link", { name: "The word" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "The person" })).not.toHaveAttribute("aria-current");
  });

  it("shows two halves for a prophet with only a word page, and nothing for someone with none", () => {
    const nav = switchFor("elijah-1ki-17-1", "Elijah");
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["The person", "The word"]);
    expect(within(nav).getByRole("link", { name: "The person" })).toHaveAttribute("aria-current", "page");
    const { container } = render(<MemoryRouter><AspectSwitch id="abel-gen-4-2" name="Abel" /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });

  it("gives a person with two pages one smaller card for each", () => {
    const { container } = render(<MemoryRouter><EntryCard id="moses-exo-2-10" sex="M" /></MemoryRouter>);
    const cards = container.querySelectorAll(".pp-entry[data-compact]");
    expect([...cards].map((a) => a.getAttribute("href"))).toEqual(["/people/moses-exo-2-10/rule", "/people/moses-exo-2-10/word"]);
    expect(cards[1].textContent).toContain("Explore the word");
  });
});

describe("prophet summaries built by scripts/build-people-pages-index.py", () => {
  // The real index.json (read from disk: the import above is the fixed one), whatever prophet files exist at the time.
  const index = JSON.parse(readFileSync(path.resolve(__dirname, "../../data/people-pages/index.json"), "utf-8")) as { prophets?: { id: string; group: string; kind: string; era: string; order: number; kings: string[]; books: string[]; sex: string }[] };
  it("gives every prophet page the fields the switch, the entry card and the arrows use", () => {
    const prophets = index.prophets ?? [];
    for (const p of prophets) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(p.group).toMatch(/^[a-z0-9-]+$/);
      expect(["prophet", "prophetess", "seer", "singer", "false", "nt"]).toContain(p.kind);
      expect(["wilderness", "judges", "united", "divided", "exile", "nt"]).toContain(p.era);
      expect(p.order).toBeGreaterThan(0);
      expect(Array.isArray(p.kings) && Array.isArray(p.books)).toBe(true);
      expect(["M", "F", "G", ""]).toContain(p.sex);
    }
    expect(new Set(prophets.map((p) => p.id)).size, "one word page per person").toBe(prophets.length);
  });
});
