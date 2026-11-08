// Family charades on the page (design §11): a buttons-only round from Start to the recap, a tilt round driven by
// dispatched orientation events, the iOS permission granted and refused, a device that sends no tilt, the order of the
// Start tap's calls, a team game coming back after a reload, and the hub serving the game at /games/charades.
import { readFileSync } from "node:fs";
import { act, fireEvent, render as renderPlain, screen, within } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import file from "@/data/charades/scenes.json";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import CharadesGame, { TILT_DENIED, TILT_SILENT } from "./CharadesGame";
import type { ScenesFile } from "./deck";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const scenes = (file as unknown as ScenesFile).scenes;
const render = (ui: ReactElement) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>);
const renderGame = () => render(<MemoryRouter><CharadesGame /></MemoryRouter>);
const FAKE = { toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] as const };

/** Moves the fake clock on in 100 ms steps, letting React render between them (each step schedules the next timer). */
const advance = async (ms: number) => { for (let t = 0; t < ms; t += 100) await act(async () => { vi.advanceTimersByTime(Math.min(100, ms - t)); }); };
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const layer = () => screen.getByRole("dialog", { name: "Family charades round" });
const cardTitle = () => within(layer()).getByRole("heading", { level: 2 }).textContent ?? "";

/** jsdom has no orientation events: a stand-in with beta and gamma, and (optionally) iOS's permission prompt. */
class FakeOrientationEvent extends Event {
  beta: number | null; gamma: number | null;
  constructor(type: string, init: { beta?: number | null; gamma?: number | null } = {}) { super(type); this.beta = init.beta ?? null; this.gamma = init.gamma ?? null; }
}
function installOrientation(permission?: () => Promise<string>) {
  const Event = class extends FakeOrientationEvent {};
  if (permission) Object.assign(Event, { requestPermission: permission });
  vi.stubGlobal("DeviceOrientationEvent", Event);
  return Event;
}
const tilt = (beta: number, gamma: number) => window.dispatchEvent(new FakeOrientationEvent("deviceorientation", { beta, gamma }));
/** Readings every 20 ms for `ms`: forehead is (0, 90); a tip down past 40° is (180, 45); a tip up is (0, 45). */
async function hold(beta: number, gamma: number, ms: number) {
  for (let t = 0; t < ms; t += 20) { await act(async () => { tilt(beta, gamma); vi.advanceTimersByTime(20); }); }
}

async function openSetup() {
  const view = renderGame();
  expect(await screen.findByRole("heading", { level: 1, name: "Family charades" })).toBeInTheDocument();
  return view;
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("family charades page", () => {
  it("plays a buttons-only round from Start to the recap, where a mark can be fixed", async () => {
    await openSetup();
    expect(screen.queryByRole("group", { name: "Controls" })).not.toBeInTheDocument(); // no orientation events here: no tilt option
    vi.useFakeTimers(FAKE);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await flush();
    expect(within(layer()).getByText(/Hold the phone on your forehead, or give it to a helper/)).toBeInTheDocument();
    fireEvent.click(within(layer()).getByRole("button", { name: "Start round" }));
    expect(within(layer()).getByText("3")).toBeInTheDocument();
    await advance(3600);
    const first = cardTitle();
    expect(scenes.some((s) => s.title === first)).toBe(true);
    fireEvent.click(within(layer()).getByRole("button", { name: "Got it" }));
    expect(within(layer()).getByText("✓ Correct!")).toBeInTheDocument();
    await advance(700);
    const second = cardTitle();
    expect(second).not.toBe(first);
    fireEvent.keyDown(window, { key: "ArrowLeft" }); // ← passes
    expect(within(layer()).getByText("↷ Pass")).toBeInTheDocument();
    await advance(700);
    const third = cardTitle();
    await advance(59_000); // 1.4 s of the minute has gone on two answers; the buzzer comes inside this step
    expect(within(layer()).getByText("Time's up!")).toBeInTheDocument();
    await advance(1200);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "1 correct" })).toBeInTheDocument();
    expect(screen.getByText("1 passed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Not played: ${third}. Tap to change.` })).toBeInTheDocument();
    const firstScene = scenes.find((s) => s.title === first)!;
    const row = screen.getByRole("button", { name: `Correct: ${first}. Tap to change.` }).closest("li")!;
    expect(within(row).getByRole("link", { name: "Read the story" }).getAttribute("href")).toMatch(new RegExp(`^/read/bsb/${firstScene.ref.slice(0, 3)}/`));
    fireEvent.click(screen.getByRole("button", { name: `Passed: ${second}. Tap to change.` }));
    expect(screen.getByRole("heading", { level: 1, name: "2 correct" })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("bp-charades")!);
    expect(saved.best["60"]).toBe(2);
    expect(saved.recent).toEqual(expect.arrayContaining([firstScene.id]));
    expect(saved.recent).not.toContain(scenes.find((s) => s.title === third)!.id); // left on screen at the buzzer: not seen
  });

  it("plays by tilt: upright starts the countdown, tip down is Correct, tip up is Pass", async () => {
    const permission = vi.fn(() => Promise.resolve("granted"));
    installOrientation(permission);
    await openSetup();
    vi.useFakeTimers(FAKE);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(permission).toHaveBeenCalledTimes(1);
    await flush();
    await hold(0, 90, 100); // the one-second check gets a reading
    await flush();
    expect(within(layer()).getByText("Hold the phone to your forehead, screen facing out.")).toBeInTheDocument();
    await hold(0, 90, 400); // upright: armed, the countdown starts by itself
    expect(within(layer()).getByText(/^[321]$/)).toBeInTheDocument();
    await hold(0, 90, 3600);
    const first = cardTitle();
    await hold(180, 45, 200); // tip down
    expect(within(layer()).getByText("✓ Correct!")).toBeInTheDocument();
    await hold(180, 45, 1000); // still tipped: the next scene waits for upright
    expect(within(layer()).queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    await hold(0, 90, 400);
    const second = cardTitle();
    expect(second).not.toBe(first);
    await hold(0, 45, 200); // tip up
    expect(within(layer()).getByText("↷ Pass")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await hold(0, 90, 100);
    expect(within(layer()).getByRole("heading", { level: 2, name: "Paused" })).toBeInTheDocument();
    fireEvent.click(within(layer()).getByRole("button", { name: "End round now" }));
    expect(screen.getByRole("heading", { level: 1, name: "1 correct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Passed: ${second}. Tap to change.` })).toBeInTheDocument();
  });

  it("falls back to buttons with the reason when iOS motion access is refused", async () => {
    installOrientation(() => Promise.resolve("denied"));
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(await within(await screen.findByRole("dialog")).findByText(TILT_DENIED)).toBeInTheDocument();
    expect(within(layer()).getByRole("button", { name: "Start round" })).toBeInTheDocument();
    expect(within(layer()).getByText(/Tap Got it or Pass/)).toBeInTheDocument();
  });

  it("falls back to buttons after a second with no readings, and starts on Buttons only next time", async () => {
    installOrientation();
    const view = await openSetup();
    vi.useFakeTimers(FAKE);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await flush();
    await advance(1000);
    await flush();
    expect(within(layer()).getByText(TILT_SILENT)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bp-charades")!).tiltFailed).toBe(true);
    vi.useRealTimers();
    view.unmount();
    await openSetup();
    const controls = screen.getAllByRole("group").find((g) => g.querySelector("legend")?.textContent === "Controls")!;
    expect(within(controls).getByRole("button", { name: "Buttons only" })).toHaveAttribute("aria-pressed", "true");
  });

  it("starts sound, the wake lock and the motion prompt in the Start tap itself, before waiting for anything", async () => {
    const calls: string[] = [];
    installOrientation(() => { calls.push("permission"); return new Promise(() => {}); });
    vi.stubGlobal("AudioContext", class { state = "running"; constructor() { calls.push("audio"); } });
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: () => { calls.push("wake-lock"); return new Promise(() => {}); } } });
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(calls).toEqual(["audio", "wake-lock", "permission"]); // all made synchronously inside the click
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("brings a team game back after a reload, at the hand-over for the team on turn", async () => {
    sessionStorage.setItem("bp-charades-game", JSON.stringify({ version: 1, teams: ["Lions", "Eagles"], turnsEach: 2, totals: [5, 0], turn: 1, lastScore: 5 }));
    renderGame();
    expect(await screen.findByRole("heading", { level: 1, name: "Pass the phone to your next guesser" })).toBeInTheDocument();
    expect(screen.getByText("Eagles", { selector: ".ch-handover-team" })).toBeInTheDocument();
    expect(screen.getByText("Turn 1 of 2")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["1Lions5", "2Eagles0"]);
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/charades"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "Family charades" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
