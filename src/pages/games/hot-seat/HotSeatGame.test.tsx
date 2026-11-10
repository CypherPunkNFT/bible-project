// Hot seat on the page (design §11): a whole two-player, one-round game with the fixture bank and fake timers (setup,
// hand-over, count-down, marking by button and by key, Undo, pause hiding the question, the buzzer and the last
// question, a recap fix, the idle close, standings and the final screen); a reload mid-turn offering "Carry on" and
// resuming with the time that was left; and the bank failing to load, then loading on Try again.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HotSeatGame from "./HotSeatGame";
import { fixtureBank } from "./hot-seat.test.fixture";
import { GAME_KEY } from "./storage";

const loadBank = vi.hoisted(() => vi.fn());
vi.mock("@/lib/data", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/data")>(), loadQuestionBank: loadBank }));

const FAKE: NonNullable<Parameters<typeof vi.useFakeTimers>[0]> = {
  toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"],
};
/** Moves the fake clock on in 100 ms steps, letting React render between them. */
const advance = async (ms: number) => { for (let t = 0; t < ms; t += 100) await act(async () => { vi.advanceTimersByTime(Math.min(100, ms - t)); }); };
const renderGame = () => render(<MemoryRouter><HotSeatGame /></MemoryRouter>);
const layer = () => screen.getByRole("dialog", { name: "Hot seat game" });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const question = () => layer().querySelector(".hs-question")?.textContent ?? null;
const score = () => within(layer()).getByText((_, el) => el?.classList.contains("hs-score") ?? false).getAttribute("aria-label");
const secondsLeft = () => Number(within(layer()).getByRole("timer").getAttribute("aria-label")!.split(" ")[0]);

async function openSetup() {
  const view = renderGame();
  await screen.findByRole("button", { name: "Start game" }, { timeout: 5000 });
  expect(screen.getByRole("button", { name: "Start game" })).toBeEnabled();
  return view;
}

async function startTurn() {
  click("Start 60 seconds");
  expect(within(layer()).getByText("3")).toBeInTheDocument();
  await advance(3000);
  expect(question()).toMatch(/fixture/);
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); loadBank.mockReset(); loadBank.mockResolvedValue(fixtureBank()); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("hot seat page", () => {
  it("plays a whole two-player, one-round game", async () => {
    await openSetup();
    expect(document.title).toBe("Hot seat · Games · Bible Guide");
    fireEvent.change(screen.getByRole("textbox", { name: "Name of player 1" }), { target: { value: "Anna" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Name of player 2" }), { target: { value: "Ben" } });
    fireEvent.click(within(screen.getByRole("group", { name: "Rounds" })).getByRole("button", { name: "1" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Sound" })).getByRole("button", { name: "Off" }));
    vi.useFakeTimers(FAKE);
    click("Start game");

    // Anna's turn: nobody has sat yet, so anyone reads.
    expect(within(layer()).getByText("Anna")).toBeInTheDocument();
    expect(within(layer()).getByText("Anyone else can read.")).toBeInTheDocument();
    await startTurn();
    const first = question();
    click("Right");
    expect(score()).toBe("1 point");
    expect(question()).not.toBe(first);
    fireEvent.keyDown(window, { key: "ArrowLeft" }); // ← Wrong
    fireEvent.keyDown(window, { key: "ArrowDown" }); // ↓ Pass
    fireEvent.keyDown(window, { key: "ArrowRight" }); // → Right
    expect(score()).toBe("2 points");
    click("Undo");
    expect(score()).toBe("1 point");

    // A pause hides question and answer; Resume brings them back with the time that was left.
    const before = secondsLeft();
    click("Pause");
    expect(question()).toBeNull();
    expect(within(layer()).queryByText("Answer")).toBeNull();
    await advance(5000);
    click("Resume");
    expect(secondsLeft()).toBe(before);
    expect(question()).not.toBeNull();

    // The buzzer: the question on screen may still be marked, and then the recap opens.
    await advance(60_000);
    expect(within(layer()).getByText("Time! Finish this question.")).toBeInTheDocument();
    click("Right");
    expect(within(layer()).getByText("Save turn", { exact: false })).toBeInTheDocument();
    expect(within(layer()).getByText("2 points")).toBeInTheDocument();
    const marks = layer().querySelectorAll<HTMLButtonElement>(".hs-mark-cycle");
    fireEvent.click(marks[0]); // Right -> Wrong
    expect(within(layer()).getByText("1 point")).toBeInTheDocument();
    expect(within(layer()).getAllByRole("link", { name: /opens in a new tab/ })[0]).toHaveAttribute("target", "_blank");
    click("Save turn");
    expect(within(layer()).getByRole("heading", { name: "Standings" })).toBeInTheDocument();
    click(/Next player/);

    // Ben's turn: Anna, who just sat, is suggested as the reader. He lets the buzzer go and nobody marks the last one.
    expect(within(layer()).getByText("Ben")).toBeInTheDocument();
    expect(layer().querySelector(".hs-reader")?.textContent).toBe("Anna");
    await startTurn();
    await advance(60_000);
    expect(within(layer()).getByText("Time! Finish this question.")).toBeInTheDocument();
    await advance(15_000);
    expect(within(layer()).getByText("Not answered")).toBeInTheDocument();
    click("Save turn");
    click(/Final standings/);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Final standings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "All questions tonight" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play another round/ })).toBeInTheDocument();
  }, 30_000);

  it("offers Carry on after a reload mid-turn and resumes with the time that was left", async () => {
    const view = await openSetup();
    vi.useFakeTimers(FAKE);
    click("Start game");
    await startTurn();
    click("Right");
    await advance(10_000); // the time left is saved every five seconds, and on every mark
    view.unmount();
    expect(JSON.parse(localStorage.getItem(GAME_KEY)!).session.current.leftMs).toBeLessThanOrEqual(50_500);

    vi.useRealTimers();
    renderGame();
    await screen.findByRole("button", { name: "Start game" }, { timeout: 5000 });
    expect(screen.getAllByText("Carry on tonight's game").length).toBeGreaterThan(0);
    vi.useFakeTimers(FAKE);
    click("Carry on tonight's game");
    expect(within(layer()).getByRole("heading", { name: "Paused" })).toBeInTheDocument();
    expect(question()).toBeNull();
    click("Resume");
    expect(secondsLeft()).toBeGreaterThanOrEqual(49);
    expect(secondsLeft()).toBeLessThanOrEqual(51);
    expect(score()).toBe("1 point");
  }, 30_000);

  it("says when the questions could not be loaded, and Try again loads them", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    loadBank.mockReset();
    loadBank.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(fixtureBank());
    renderGame();
    expect(await screen.findByText("The questions could not be loaded.")).toBeInTheDocument();
    click("Try again");
    expect(await screen.findByRole("button", { name: "Start game" })).toBeEnabled();
    expect(screen.queryByText("The questions could not be loaded.")).toBeNull();
  });
});
