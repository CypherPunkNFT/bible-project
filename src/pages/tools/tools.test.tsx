import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ToolsPage from "./ToolsPage";
import { AUDIENCE_LABELS, CATEGORIES, TOOLS, isLive, toolsForHub } from "./registry";

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="/tools/*" element={<ToolsPage />} /></Routes></MemoryRouter>,
);

describe("tools registry", () => {
  it("holds the ten approved tools, each with its own name", () => {
    // Tools added later (sequence 41's study tools) join these ten, so the test names the ten rather than counting.
    const approved = ["baby-names", "birthday-verses", "life-events", "sympathy", "when-youre", "occasion-prayers",
      "home-blessings", "verse-cards", "countdowns", "verse-widget"];
    const slugs = TOOLS.map((tool) => tool.slug);
    expect(slugs).toEqual(expect.arrayContaining(approved));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every tool a title, a one-line description, who it is for and a category", () => {
    const categories = new Set(CATEGORIES.map((category) => category.key));
    for (const tool of TOOLS) {
      expect(tool.title.trim()).not.toBe("");
      expect(tool.description).not.toMatch(/\n/);
      expect(tool.description.length).toBeLessThanOrEqual(140);
      expect(tool.audiences.length).toBeGreaterThan(0);
      for (const audience of tool.audiences) expect(AUDIENCE_LABELS[audience]).toBeDefined();
      expect(categories.has(tool.category)).toBe(true);
    }
  });

  it("gives every tool its own picture in a book colour, described for screen readers", () => {
    const tones = new Set(["history", "poetry", "prophets", "gospels", "acts", "epistles", "revelation"]);
    for (const tool of TOOLS) {
      expect(tones.has(tool.art.tone)).toBe(true);
      expect(tool.art.alt.trim().length).toBeGreaterThan(10);
    }
    expect(new Set(TOOLS.map((tool) => tool.art.Scene)).size).toBe(TOOLS.length);
  });

  it("gives tools side by side in a category different colours", () => {
    for (const category of CATEGORIES) {
      const tones = TOOLS.filter((tool) => tool.category === category.key).map((tool) => tool.art.tone);
      expect(new Set(tones).size).toBe(tones.length);
    }
  });

  it("links every live tool to an address the site routes (src/App.tsx)", () => {
    const routes = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8").split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("//"))
      .flatMap((line) => [...line.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1].replace(/\/\*$/, "")));
    const live = TOOLS.filter(isLive);
    expect(live.length).toBeGreaterThan(0);
    for (const tool of live) {
      expect(tool.path).toMatch(/^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/);
      expect(routes, `${tool.slug}: no <Route path="${tool.path}"> in src/App.tsx`).toContain(tool.path);
    }
  });

  it("puts live tools first, keeping list order within each group", () => {
    const order = toolsForHub();
    expect(order).toHaveLength(TOOLS.length);
    // Every tool can be live (birthday verses, the last one coming soon, went live in sequence 32 step 19).
    const firstComingSoon = order.some((tool) => !isLive(tool)) ? order.findIndex((tool) => !isLive(tool)) : order.length;
    expect(order.slice(firstComingSoon).some(isLive)).toBe(false);
    const listOrder = (tools: readonly typeof TOOLS[number][]) => tools.map((tool) => TOOLS.indexOf(tool));
    for (const group of [order.slice(0, firstComingSoon), order.slice(firstComingSoon)]) {
      expect(listOrder(group)).toEqual([...listOrder(group)].sort((a, b) => a - b));
    }
  });
});

describe("tools hub", () => {
  it("shows a card for every tool; live tools link to their address, the rest say coming soon", () => {
    renderAt("/tools");
    const lists = CATEGORIES.map((category) => screen.queryByRole("list", { name: category.title })).filter((list) => list !== null);
    const inLists = (role: string) => lists.flatMap((list) => within(list).queryAllByRole(role));
    const live = TOOLS.filter(isLive);
    const comingSoon = TOOLS.length - live.length;
    expect(inLists("heading")).toHaveLength(TOOLS.length);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(TOOLS.length);
    expect(inLists("link").map((link) => link.getAttribute("href")).sort()).toEqual(live.map((tool) => tool.path).sort());
    expect(inLists("group")).toHaveLength(comingSoon);
    expect(screen.queryAllByText("Coming soon", { selector: ".gm-card-foot > span" })).toHaveLength(comingSoon);
  });

  it("lays the tools out in their categories in order, live tools first in each, and skips an empty category", () => {
    renderAt("/tools");
    const used = CATEGORIES.filter((category) => TOOLS.some((tool) => tool.category === category.key));
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(used.map((category) => category.title));
    for (const category of used) {
      const titles = within(screen.getByRole("list", { name: category.title })).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      const expected = toolsForHub().filter((tool) => tool.category === category.key).map((tool) => tool.title);
      expect(titles).toEqual(expected);
    }
  });

  it("draws every tool's picture with its description for screen readers, and the hero's", () => {
    renderAt("/tools");
    for (const tool of TOOLS) expect(screen.getByRole("img", { name: tool.art.alt })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /A table by a window/ })).toBeInTheDocument();
  });

  it("keeps a live card's name to its title, not its picture", () => {
    renderAt("/tools");
    expect(screen.getByRole("link", { name: "Biblical baby names" })).toHaveAttribute("href", "/baby-names");
  });

  it("jumps from the hero to each category", () => {
    renderAt("/tools");
    const jumps = within(screen.getByRole("navigation", { name: "Kinds of tool" })).getAllByRole("link");
    expect(jumps).toHaveLength(CATEGORIES.length);
    for (const jump of jumps) expect(document.querySelector(jump.getAttribute("href") ?? "")).not.toBeNull();
  });

  it("names who each tool is for", () => {
    renderAt("/tools");
    // A live tool's card is a link (the verse widget went live in sequence 32 step 13).
    const card = screen.getByRole("link", { name: "Verse of the day for churches" });
    const audiences = within(card).getByRole("list", { name: "Who it's for" });
    expect(within(audiences).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Churches and pastors"]);
  });

  it("sends any other address under /tools back to the hub", () => {
    renderAt("/tools/birthday-verses");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bible tools for");
  });
});
