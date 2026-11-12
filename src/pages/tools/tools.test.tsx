import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

// The hub lists every category until a door is chosen (?category=); the per-category tests open each on its own.
const USED = CATEGORIES.filter((category) => TOOLS.some((tool) => tool.category === category.key));

describe("tools hub", () => {
  it("shows a card for every tool across the categories; live tools link to their address, the rest say coming soon", () => {
    const headings: string[] = []; const links: string[] = []; let groups = 0; let comingSoonFeet = 0;
    for (const category of USED) {
      const { unmount } = renderAt(`/tools?category=${category.key}`);
      const list = screen.getByRole("list", { name: category.title });
      headings.push(...within(list).getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? ""));
      links.push(...within(list).queryAllByRole("link").map((link) => link.getAttribute("href") ?? ""));
      groups += within(list).queryAllByRole("group").length;
      comingSoonFeet += screen.queryAllByText("Coming soon", { selector: ".gm-card-foot > span" }).length;
      unmount();
    }
    const live = TOOLS.filter(isLive);
    expect(headings).toHaveLength(TOOLS.length);
    expect(links.sort()).toEqual(live.map((tool) => tool.path).sort());
    expect(groups).toBe(TOOLS.length - live.length);
    expect(comingSoonFeet).toBe(TOOLS.length - live.length);
  });

  it("lists every category by default, then the chosen one alone, live tools first in it", () => {
    const all = renderAt("/tools");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((category) => category.title));
    all.unmount();
    for (const category of USED) {
      const { unmount } = renderAt(`/tools?category=${category.key}`);
      expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([category.title]);
      const titles = within(screen.getByRole("list", { name: category.title })).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(titles).toEqual(toolsForHub().filter((tool) => tool.category === category.key).map((tool) => tool.title));
      unmount();
    }
  });

  it("lists every category for an unknown one", () => {
    renderAt("/tools?category=no-such-category");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((category) => category.title));
  });

  it("draws every tool's picture with its description for screen readers, and the hero's", () => {
    for (const category of USED) {
      const { unmount } = renderAt(`/tools?category=${category.key}`);
      for (const tool of TOOLS.filter((tool) => tool.category === category.key)) expect(screen.getByRole("img", { name: tool.art.alt })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /A table by a window/ })).toBeInTheDocument();
      unmount();
    }
  });

  it("keeps a live card's name to its title, not its picture", () => {
    renderAt("/tools");
    expect(screen.getByRole("link", { name: "Biblical baby names" })).toHaveAttribute("href", "/baby-names");
  });

  it("has a door for each category under the hero, in order, none chosen; choosing one shows that category alone, choosing it again shows all", () => {
    renderAt("/tools");
    const doors = within(screen.getByRole("navigation", { name: "Kinds of tool" })).getAllByRole("link");
    expect(doors.map((door) => door.textContent)).toEqual(USED.map((category) => `${category.title}${TOOLS.filter((tool) => tool.category === category.key).length}`));
    expect(doors.map((door) => door.getAttribute("href"))).toEqual(USED.map((category) => `/tools?category=${category.key}`));
    for (const door of doors) expect(door).not.toHaveAttribute("aria-current");
    fireEvent.click(doors[2]);
    expect(doors[2]).toHaveAttribute("aria-current", "true");
    expect(doors[2]).toHaveAttribute("href", "/tools");
    expect(doors[0]).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([USED[2].title]);
    expect(document.getElementById(doors[2].getAttribute("aria-controls") ?? "")).not.toBeNull();
    fireEvent.click(doors[2]);
    for (const door of doors) expect(door).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((category) => category.title));
  });

  it("names who each tool is for", () => {
    renderAt("/tools?category=sharing");
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
