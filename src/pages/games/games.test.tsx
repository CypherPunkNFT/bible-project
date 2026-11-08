import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GamesPage from "./GamesPage";
import { BLANK_ART } from "./art";
import { AUDIENCE_LABELS, GAMES, SHELVES, gamesForHub, isLive, shelfOf } from "./registry";

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="/games/*" element={<GamesPage />} /></Routes></MemoryRouter>,
);

describe("games registry", () => {
  it("holds the quiz and the fourteen approved games, each at its own address", () => {
    expect(GAMES).toHaveLength(15);
    const slugs = GAMES.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every game a title, a one-line description and who it is for", () => {
    for (const game of GAMES) {
      expect(game.title.trim()).not.toBe("");
      expect(game.description).not.toMatch(/\n/);
      expect(game.description.length).toBeLessThanOrEqual(140);
      expect(game.audiences.length).toBeGreaterThan(0);
      for (const audience of game.audiences) expect(AUDIENCE_LABELS[audience]).toBeDefined();
    }
  });

  it("gives every game its own picture and a shelf (README.md: how to draw one)", () => {
    const tones = new Set(["history", "poetry", "prophets", "gospels", "acts", "epistles", "revelation"]);
    for (const game of GAMES) {
      expect(game.art, `${game.slug} needs art: GAME_ART.<name> (see README.md)`).toBeDefined();
      expect(game.shelf, `${game.slug} needs a shelf (see README.md)`).toBeDefined();
      expect(game.art).not.toBe(BLANK_ART);
      expect(tones.has(game.art?.tone ?? "")).toBe(true);
      expect(game.art?.alt.trim().length).toBeGreaterThan(10);
    }
    const scenes = GAMES.map((game) => game.art?.Scene);
    expect(new Set(scenes).size).toBe(GAMES.length);
  });

  it("puts a game with no shelf on its first audience's shelf", () => {
    const base = { slug: "new-game", status: "coming-soon", title: "New", description: "New." } as const;
    expect(shelfOf({ ...base, audiences: ["church-night", "solo"] })).toBe("groups");
    expect(shelfOf({ ...base, audiences: ["family"] })).toBe("family");
    expect(shelfOf({ ...base, audiences: ["family"], shelf: "daily" })).toBe("daily");
  });

  it("puts live games first, keeping list order within each group", () => {
    const order = gamesForHub();
    expect(order).toHaveLength(GAMES.length);
    const firstComingSoon = order.findIndex((game) => !isLive(game));
    expect(order.slice(firstComingSoon).some(isLive)).toBe(false);
    const listOrder = (games: readonly typeof GAMES[number][]) => games.map((game) => GAMES.indexOf(game));
    for (const group of [order.slice(0, firstComingSoon), order.slice(firstComingSoon)]) {
      expect(listOrder(group)).toEqual([...listOrder(group)].sort((a, b) => a - b));
    }
  });
});

describe("games hub", () => {
  it("shows a card for every game; live games link to their address, the rest say coming soon", () => {
    renderAt("/games");
    const lists = SHELVES.map((shelf) => screen.queryByRole("list", { name: shelf.title })).filter((list) => list !== null);
    const inLists = (role: string) => lists.flatMap((list) => within(list).queryAllByRole(role));
    const live = GAMES.filter(isLive);
    const comingSoon = GAMES.length - live.length;
    expect(inLists("heading")).toHaveLength(GAMES.length);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(GAMES.length);
    expect(inLists("link").map((link) => link.getAttribute("href")).sort()).toEqual(live.map((game) => `/games/${game.slug}`).sort());
    expect(inLists("group")).toHaveLength(comingSoon);
    expect(screen.getAllByText("Coming soon", { selector: ".gm-card-foot > span" })).toHaveLength(comingSoon);
  });

  it("lays the games out on the shelves in order, live games first on each, and skips an empty shelf", () => {
    renderAt("/games");
    const used = SHELVES.filter((shelf) => GAMES.some((game) => shelfOf(game) === shelf.key));
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(used.map((shelf) => shelf.title));
    for (const shelf of used) {
      const titles = within(screen.getByRole("list", { name: shelf.title })).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      const expected = gamesForHub().filter((game) => shelfOf(game) === shelf.key).map((game) => game.title);
      expect(titles).toEqual(expected);
    }
  });

  it("draws every game's picture with its description for screen readers, and the hero's", () => {
    renderAt("/games");
    for (const game of GAMES) expect(screen.getByRole("img", { name: game.art?.alt })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /A games table under a hanging lamp/ })).toBeInTheDocument();
  });

  it("keeps a live card's name to its title, not its picture", () => {
    renderAt("/games");
    expect(screen.getByRole("link", { name: "Odd one out" })).toHaveAttribute("href", "/games/odd-one-out");
  });

  it("jumps from the hero to each shelf", () => {
    renderAt("/games");
    const jumps = within(screen.getByRole("navigation", { name: "Kinds of game" })).getAllByRole("link");
    for (const jump of jumps) expect(document.querySelector(jump.getAttribute("href") ?? "")).not.toBeNull();
  });

  it("links the homepage quiz as the live game", () => {
    renderAt("/games");
    expect(screen.getByRole("link", { name: "How well do you know the Bible?" })).toHaveAttribute("href", "/games/quiz");
  });

  it("names who each game is for", () => {
    renderAt("/games");
    const card = screen.getByRole("group", { name: "Bible Jeopardy" });
    const audiences = within(card).getByRole("list", { name: "Who it's for" });
    expect(within(audiences).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Church night", "Youth group"]);
  });

  it("sends the address of a game not built yet back to the hub", () => {
    renderAt("/games/timeline");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bible games for");
  });
});
