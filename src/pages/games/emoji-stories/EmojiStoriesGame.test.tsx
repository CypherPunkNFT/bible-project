// Emoji stories on the page: the start screen, a Daily won by typing and one lost with choices, a Practice round to
// its score, the room's one-clue-at-a-time row, the name shown under an emoji the device cannot draw, and the hub
// serving the game at /games/emoji-stories.
import { readFileSync } from "node:fs";
import { fireEvent, render as renderPlain, screen, within, type RenderOptions } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import scheduleFile from "@/data/emoji-stories/daily.json";
import storyFile from "@/data/emoji-stories/stories.json";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { dealRound, sharePerson } from "./deal";
import { resetEmojiSupport } from "./emoji-support";
import EmojiStoriesGame from "./EmojiStoriesGame";
import { DEVICE_KEY, ROUND_KEY, type Round } from "./storage";
import type { DailySchedule, StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const byId = new Map(stories.map((story) => [story.id, story]));
const schedule = scheduleFile as DailySchedule;
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);
const renderGame = (path = "/games/emoji-stories") => render(<MemoryRouter initialEntries={[path]}><EmojiStoriesGame /></MemoryRouter>);

// Puzzle #4: three days after the epoch, at noon, local time.
const [year, month, day] = schedule.epoch.split("-").map(Number);
const answer = byId.get(schedule.days[3])!;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(year, month - 1, day + 3, 12));
  localStorage.clear();
  sessionStorage.clear();
  resetEmojiSupport();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const round = () => JSON.parse(sessionStorage.getItem(ROUND_KEY)!) as Round;

describe("emoji stories page", () => {
  it("opens on the start screen with Noah's example, today's number and the three ways to play", async () => {
    renderGame();
    expect(await screen.findByRole("heading", { level: 1, name: "Emoji stories" })).toBeInTheDocument();
    expect(screen.getByText(`= ${byId.get("noah-flood")!.title}`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Today's puzzle #4" })).toBeInTheDocument();
    for (const name of ["Play today's puzzle", "Start practice", "Start a room round"]) expect(screen.getByRole("button", { name })).toBeEnabled();
  });

  it("solves the Daily by typing: suggestions from the list, one guess, the reveal and the record kept", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play today's puzzle" }));
    expect(screen.getByRole("heading", { level: 2, name: "Today's puzzle #4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Typing" })).toHaveAttribute("aria-pressed", "true");
    const box = screen.getByRole("combobox", { name: "Which story is it?" });
    fireEvent.change(box, { target: { value: answer.title } });
    fireEvent.click(within(screen.getByRole("listbox", { name: "Stories" })).getByRole("option", { name: answer.title }));
    fireEvent.click(screen.getByRole("button", { name: "Guess" }));
    expect(await screen.findByRole("heading", { level: 2, name: answer.title })).toHaveFocus();
    expect(screen.getByText("Right!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read the story" })).toHaveAttribute("href", expect.stringMatching(/^\/read\/bsb\//));
    const device = JSON.parse(localStorage.getItem(DEVICE_KEY)!);
    expect(device.daily).toMatchObject({ n: 4, won: true, over: true, guesses: [answer.id] });
    expect(device.stats).toMatchObject({ played: 1, solved: 1, streak: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Back to the start" }));
    expect(screen.getByText(/^Solved in 1\./)).toBeInTheDocument();
  });

  it("loses the Daily with choices after two misses, each opening a hint, and shows the answer", async () => {
    renderGame("/games/emoji-stories?play=daily");
    fireEvent.click(await screen.findByRole("button", { name: "Choices" }));
    const wrong = () => within(screen.getByRole("group", { name: "Choose the story" })).getAllByRole("button")
      .find((button) => button.textContent?.includes(answer.title) === false && !(button as HTMLButtonElement).disabled)!;
    fireEvent.click(wrong());
    expect(screen.getByText("Guess 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Where:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Typing" })).toBeDisabled();
    fireEvent.click(wrong());
    expect(await screen.findByRole("heading", { level: 2, name: answer.title })).toHaveFocus();
    expect(screen.getByText("The pictures:")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEVICE_KEY)!).stats).toMatchObject({ played: 1, solved: 0, streak: 0 });
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("plays a Practice round of ten to its score, a hint costing a point, and keeps the best", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Choices" }));
    fireEvent.click(screen.getByRole("button", { name: "Start practice" }));
    for (let n = 1; n <= 10; n++) {
      const title = byId.get(round().puzzles[n - 1].id)!.title;
      expect(screen.getByRole("heading", { level: 2, name: `${n} of 10 · Score ${n === 1 ? 0 : 3 * (n - 1) - 1}` })).toBeInTheDocument();
      if (n === 1) fireEvent.click(screen.getByRole("button", { name: "Hint (−1 point)" }));
      fireEvent.click(within(screen.getByRole("group", { name: "Choose the story" })).getByRole("button", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }));
      expect(await screen.findByRole("heading", { level: 2, name: title })).toHaveFocus();
      expect(screen.getByText(n === 1 ? "2 points" : "3 points")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: n === 10 ? "See your score" : "Next puzzle" }));
    }
    expect(screen.getByRole("heading", { level: 2, name: "You scored 29 out of 30" })).toBeInTheDocument();
    expect(screen.getAllByText("✓ Right")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Back to the start" }));
    expect(screen.getByText("Best with these settings: 29 of 30")).toBeInTheDocument();
  });

  it("shows a room one clue at a time until the leader reveals the answer, storing nothing of the round", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderGame("/games/emoji-stories?play=room");
    expect(await screen.findByRole("heading", { level: 2, name: "Story 1 of 10" })).toBeInTheDocument();
    expect(sessionStorage.getItem(ROUND_KEY)).toBeNull();
    const story = byId.get(dealRound(stories, { difficulty: "mixed", testament: "both" }, [], Date.now() >>> 0)[0])!;
    const tiles = () => within(screen.getAllByRole("group", { name: /^Clues:/ })[0]).getAllByRole("img");
    expect(tiles()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Next clue" }));
    expect(tiles()).toHaveLength(2);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(tiles()).toHaveLength(Math.min(3, story.emoji.length));
    fireEvent.click(screen.getByRole("button", { name: "Show choices" }));
    expect(screen.getByText(story.title, { selector: ".es-room-choices li" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(await screen.findByRole("heading", { level: 2, name: story.title })).toHaveFocus();
    expect(tiles()).toHaveLength(story.emoji.length);
    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(screen.getByRole("heading", { level: 2, name: "Story 2 of 10" })).toBeInTheDocument();
  });

  it("names under its picture an emoji this device draws as a blank box, once the control emoji draws in colour", async () => {
    const noah = byId.get("noah-flood")!;
    const blank = noah.emoji[1][0];
    let drawn = "";
    const context = {
      textBaseline: "", fillStyle: "", font: "",
      clearRect: () => undefined,
      fillText: (text: string) => { drawn = text; },
      getImageData: () => ({ data: drawn === blank ? new Uint8ClampedArray([0, 0, 0, 255]) : new Uint8ClampedArray([200, 40, 40, 255]) }),
    };
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D);
    renderGame();
    await screen.findByRole("heading", { level: 1, name: "Emoji stories" });
    const missing = [...document.querySelectorAll(".es-example .es-missing")].map((note) => note.textContent);
    expect(missing).toHaveLength(1);
    expect(document.querySelectorAll(".es-example .es-glyph-empty")).toHaveLength(1);
    expect(document.querySelector(".es-example .es-glyph-empty")?.textContent).toBe("");
    expect(missing[0]).toBe(within(document.querySelector(".es-example")! as HTMLElement).getAllByRole("img")[1].getAttribute("aria-label"));
  });

  it("opens every Daily on Typing even after Practice chose Choices; a switch before the first guess keeps the day's hints", async () => {
    localStorage.setItem(DEVICE_KEY, JSON.stringify({ answer: "choices" }));
    renderGame("/games/emoji-stories?play=daily");
    expect(await screen.findByRole("button", { name: "Typing" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hint (shows on your share)" }));
    fireEvent.click(screen.getByRole("button", { name: "Choices" }));
    expect(screen.getByRole("button", { name: "Choices" })).toHaveAttribute("aria-pressed", "true");
    const device = JSON.parse(localStorage.getItem(DEVICE_KEY)!);
    expect(device.answer).toBe("choices");
    expect(device.daily).toMatchObject({ n: 4, mode: "choices", guesses: [], asked: 1, over: false });
    expect(device.stats).toMatchObject({ played: 0 });
    expect(within(screen.getByRole("list", { name: "Your guesses" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("solves a Daily by typing on the second guess after a close first guess, shown in words in the guess slots", async () => {
    const n = schedule.days.findIndex((id) => stories.some((story) => story.id !== id && sharePerson(byId.get(id)!, story))) + 1;
    vi.setSystemTime(new Date(year, month - 1, day + n - 1, 12));
    const target = byId.get(schedule.days[n - 1])!;
    const close = stories.find((story) => story.id !== target.id && sharePerson(target, story))!;
    renderGame("/games/emoji-stories?play=daily");
    const guess = async (title: string) => {
      fireEvent.change(await screen.findByRole("combobox", { name: "Which story is it?" }), { target: { value: title } });
      fireEvent.click(within(screen.getByRole("listbox", { name: "Stories" })).getByRole("option", { name: title }));
      fireEvent.click(screen.getByRole("button", { name: "Guess" }));
    };
    await guess(close.title);
    expect(screen.getByText("Right person, different story.")).toHaveClass("is-close");
    const slots = within(screen.getByRole("list", { name: "Your guesses" })).getAllByRole("listitem");
    expect(slots).toHaveLength(3);
    expect(slots[0]).toHaveTextContent(`${close.title} Right person, different story`);
    expect(slots[1]).toHaveAttribute("aria-label", "Not used yet");
    expect(screen.getByText("Guess 2 of 3")).toBeInTheDocument();
    await guess(target.title);
    expect(await screen.findByRole("heading", { level: 2, name: target.title })).toHaveFocus();
    expect(screen.getByText("Right!")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEVICE_KEY)!).stats.spread).toEqual([0, 1, 0]);
  });

  it("calls a Daily lost on a close last pick 'Not this time', naming the pick as the right person in a different story", async () => {
    const n = schedule.days.findIndex((id) => stories.some((story) => story.id !== id && sharePerson(byId.get(id)!, story))) + 1;
    vi.setSystemTime(new Date(year, month - 1, day + n - 1, 12));
    const target = byId.get(schedule.days[n - 1])!;
    const close = stories.find((story) => story.id !== target.id && sharePerson(target, story))!;
    const others = stories.filter((story) => story.id !== target.id && !sharePerson(target, story)).slice(0, 2);
    localStorage.setItem(DEVICE_KEY, JSON.stringify({ daily: { n, mode: "typing", guesses: [others[0].id, others[1].id, close.id], asked: 0, over: true, won: false } }));
    renderGame("/games/emoji-stories?play=daily");
    expect(await screen.findByRole("heading", { level: 2, name: target.title })).toBeInTheDocument();
    expect(screen.getByText("Not this time")).toBeInTheDocument();
    expect(screen.getByText(close.title, { selector: ".es-picked em" })).toBeInTheDocument();
    expect(screen.getByText(": right person, different story")).toBeInTheDocument();
  });

  it("says nothing for stop words alone, and that a name is not in the game for real words", async () => {
    renderGame("/games/emoji-stories?play=daily");
    const box = await screen.findByRole("combobox", { name: "Which story is it?" });
    fireEvent.change(box, { target: { value: "the of" } });
    expect(screen.queryByText(/No story by that name/)).toBeNull();
    fireEvent.change(box, { target: { value: "qqxz" } });
    expect(screen.getByText(/No story by that name/)).toBeInTheDocument();
  });

  it("says on the start screen and the Daily when this device cannot remember scores", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    renderGame();
    const line = "Your scores and streak cannot be remembered on this device.";
    expect(await screen.findByText(line)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play today's puzzle" }));
    expect(screen.getByText(line)).toBeInTheDocument();
  });

  it("hands focus back to the room after a mouse click, so Enter reveals rather than pressing the button again", async () => {
    renderGame("/games/emoji-stories?play=room");
    const hint = await screen.findByRole("button", { name: "Hint" });
    hint.focus();
    fireEvent.click(hint, { detail: 1 });
    expect(screen.getByRole("region", { name: "Story 1 of 10" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    expect(screen.getByText("The answer", { selector: ".es-verdict" })).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Next story" });
    next.focus();
    fireEvent.click(next, { detail: 0 });
    expect(screen.getByRole("button", { name: "Next clue" })).toBeInTheDocument();
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/emoji-stories"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "Emoji stories" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
