import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GamesPage from "./GamesPage";
import { BLANK_ART } from "./art";
import { AUDIENCE_LABELS, GAMES, SHELVES, gamesForHub, isLive, shelfOf } from "./registry";

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="/games/*" element={<GamesPage />} /></Routes></MemoryRouter>,
);

describe("games registry", () => {
  it("holds the quiz, the fourteen approved games and the Bible crossword, each at its own address", () => {
    expect(GAMES).toHaveLength(16);
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
    const found = order.findIndex((game) => !isLive(game));
    const firstComingSoon = found < 0 ? order.length : found; // every game live: no coming-soon group
    expect(order.slice(firstComingSoon).some(isLive)).toBe(false);
    const listOrder = (games: readonly typeof GAMES[number][]) => games.map((game) => GAMES.indexOf(game));
    for (const group of [order.slice(0, firstComingSoon), order.slice(firstComingSoon)]) {
      expect(listOrder(group)).toEqual([...listOrder(group)].sort((a, b) => a - b));
    }
  });
});

// The hub lists every shelf until a door is chosen (?shelf=); the per-shelf tests open each on its own.
const USED = SHELVES.filter((shelf) => GAMES.some((game) => shelfOf(game) === shelf.key));

describe("games hub", () => {
  it("shows a card for every game across the shelves; live games link to their address, the rest say coming soon", () => {
    const headings: string[] = []; const links: string[] = []; let groups = 0; let comingSoonFeet = 0;
    for (const shelf of USED) {
      const { unmount } = renderAt(`/games?shelf=${shelf.key}`);
      const list = screen.getByRole("list", { name: shelf.title });
      headings.push(...within(list).getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? ""));
      links.push(...within(list).queryAllByRole("link").map((link) => link.getAttribute("href") ?? ""));
      groups += within(list).queryAllByRole("group").length;
      comingSoonFeet += screen.queryAllByText("Coming soon", { selector: ".gm-card-foot > span" }).length;
      unmount();
    }
    const live = GAMES.filter(isLive);
    expect(headings).toHaveLength(GAMES.length);
    expect(links.sort()).toEqual(live.map((game) => `/games/${game.slug}`).sort());
    expect(groups).toBe(GAMES.length - live.length);
    expect(comingSoonFeet).toBe(GAMES.length - live.length);
  });

  it("lists every shelf by default, then the chosen one alone, live games first on it", () => {
    const all = renderAt("/games");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((shelf) => shelf.title));
    all.unmount();
    for (const shelf of USED) {
      const { unmount } = renderAt(`/games?shelf=${shelf.key}`);
      expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([shelf.title]);
      const titles = within(screen.getByRole("list", { name: shelf.title })).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(titles).toEqual(gamesForHub().filter((game) => shelfOf(game) === shelf.key).map((game) => game.title));
      unmount();
    }
  });

  it("lists every shelf for an unknown one", () => {
    renderAt("/games?shelf=no-such-shelf");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((shelf) => shelf.title));
  });

  it("draws every game's picture with its description for screen readers, and the hero's", () => {
    for (const shelf of USED) {
      const { unmount } = renderAt(`/games?shelf=${shelf.key}`);
      for (const game of GAMES.filter((game) => shelfOf(game) === shelf.key)) expect(screen.getByRole("img", { name: game.art?.alt })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /A games table under a hanging lamp/ })).toBeInTheDocument();
      unmount();
    }
  });

  it("keeps a live card's name to its title, not its picture", () => {
    renderAt("/games");
    expect(screen.getByRole("link", { name: "Map quest" })).toHaveAttribute("href", "/games/map-quest");
  });

  it("has a door for each shelf under the hero, in order, none chosen; choosing one shows that shelf alone, choosing it again shows all", () => {
    renderAt("/games");
    const doors = within(screen.getByRole("navigation", { name: "Kinds of game" })).getAllByRole("link");
    expect(doors.map((door) => door.textContent)).toEqual(USED.map((shelf) => `${shelf.title}${GAMES.filter((game) => shelfOf(game) === shelf.key).length}`));
    expect(doors.map((door) => door.getAttribute("href"))).toEqual(USED.map((shelf) => `/games?shelf=${shelf.key}`));
    for (const door of doors) expect(door).not.toHaveAttribute("aria-current");
    fireEvent.click(doors[2]);
    expect(doors[2]).toHaveAttribute("aria-current", "true");
    expect(doors[2]).toHaveAttribute("href", "/games");
    expect(doors[0]).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([USED[2].title]);
    expect(document.getElementById(doors[2].getAttribute("aria-controls") ?? "")).not.toBeNull();
    fireEvent.click(doors[2]);
    for (const door of doors) expect(door).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(USED.map((shelf) => shelf.title));
  });

  it("links the homepage quiz as the live game", () => {
    renderAt("/games?shelf=solo");
    expect(screen.getByRole("link", { name: "How well do you know the Bible?" })).toHaveAttribute("href", "/games/quiz");
  });

  it("names who each game is for", () => {
    renderAt("/games?shelf=groups");
    const card = screen.getByRole("link", { name: "Bible Jeopardy" });
    const audiences = within(card).getByRole("list", { name: "Who it's for" });
    expect(within(audiences).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Church night", "Youth group"]);
  });

  it("sends the address of a game not built yet, or of no game at all, back to the hub", () => {
    // Once every approved game is live there is no coming-soon address left to try, so an unknown one stands in.
    const comingSoon = GAMES.find((game) => !isLive(game));
    renderAt(`/games/${comingSoon?.slug ?? "no-such-game"}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bible games for");
  });
});
