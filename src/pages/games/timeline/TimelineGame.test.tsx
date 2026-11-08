// The page itself (design §13): a Daily played with the keyboard to the reveal, the tap-to-move route, Practice, a
// reload mid-round, and sharing that falls back to the copy box.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import scheduleFile from "@/data/timeline/daily.json";
import timelineFile from "@/data/timeline/timeline.json";
import type { TimelineSchedule } from "./daily-rules";
import { trueOrder } from "./order";
import { prepare, type TimelineData } from "./text";
import TimelineGame from "./TimelineGame";

const schedule = scheduleFile as unknown as TimelineSchedule;
const loaded = prepare(timelineFile as unknown as TimelineData);
const N = 3;
const truth = trueOrder(loaded.index, schedule.days[N - 1]);
const idOf = new Map(loaded.data.events.map((event) => [event.label, event.id]));
const [year, month, day] = schedule.epoch.split("-").map(Number);

const renderAt = (path = "/games/timeline") => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="/games/timeline" element={<TimelineGame />} /></Routes></MemoryRouter>,
);
const cards = () => screen.getAllByRole("button", { name: /, position \d of \d/ });
const order = () => cards().map((card) => idOf.get(card.getAttribute("aria-label")!.replace(/, position.*$/, ""))!);
const check = () => screen.getByRole("button", { name: "Check" });

/** Pick card `from` up with Enter (a click), move it with the arrow keys and put it down again. */
function keyboardMove(from: number, to: number) {
  const card = cards()[from];
  fireEvent.click(card);
  for (let i = 0; i < Math.abs(to - from); i++) fireEvent.keyDown(card, { key: to < from ? "ArrowUp" : "ArrowDown" });
  fireEvent.click(card);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(year, month - 1, day + N - 1, 12));
  localStorage.clear();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("timeline sort page", () => {
  it("plays a Daily with the keyboard: marks after a Check, then the reveal and a share that falls back to copying", async () => {
    renderAt();
    fireEvent.click(await screen.findByRole("button", { name: `Play #${N}` }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`Today's timeline #${N}`);
    expect(cards()).toHaveLength(6);
    expect(check()).toBeDisabled(); // the dealt order cannot be checked by accident

    keyboardMove(0, 1);
    expect(screen.getByText(/now position 2 of 6/)).toBeInTheDocument();
    expect(check()).toBeEnabled();
    fireEvent.click(check());
    expect(screen.getByText(/^\d in the right place\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^\d joins?\.$/)).toBeInTheDocument();
    expect(screen.getByText("3 tries left.")).toBeInTheDocument();
    expect(check()).toBeDisabled(); // the same order again would waste a try

    truth.forEach((id, i) => { const from = order().indexOf(id); if (from !== i) keyboardMove(from, i); });
    expect(order()).toEqual(truth);
    fireEvent.click(check());

    const reveal = screen.getByRole("region", { name: /Solved in 2!/ });
    expect(within(reveal).getAllByRole("link").some((link) => link.getAttribute("href")!.startsWith("/read/bsb/"))).toBe(true);
    expect(within(reveal).getByRole("link", { name: "Tell us" })).toHaveAttribute("href", "/contact");
    fireEvent.click(within(reveal).getByRole("button", { name: "Share" }));
    const box = await screen.findByRole("textbox", { name: /Select and copy/ });
    expect((box as HTMLTextAreaElement).value).toMatch(new RegExp(`^Timeline sort #${N} 2/4\\n`));
    expect((box as HTMLTextAreaElement).value).not.toMatch(new RegExp(loaded.byId.get(truth[0])!.label));
  });

  it("moves a card by tapping it and then the card whose place it should take", async () => {
    renderAt("/games/timeline?play=daily");
    await screen.findByRole("heading", { name: new RegExp(`Today's timeline #${N}`) });
    const before = order();
    fireEvent.click(cards()[0]);
    expect(cards()[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(cards()[2]);
    expect(order()).toEqual([before[1], before[2], before[0], ...before.slice(3)]);
    fireEvent.click(cards()[3]);
    fireEvent.click(screen.getByRole("button", { name: /up$/ }));
    expect(order()[2]).toBe(before[3]);
  });

  it("puts a card back where it was when a move is cancelled, by Escape or by the browser cancelling a drag", async () => {
    const { container } = renderAt("/games/timeline?play=daily");
    await screen.findByRole("heading", { name: new RegExp(`Today's timeline #${N}`) });
    const before = order();
    const card = cards()[1];
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "ArrowDown" });
    fireEvent.keyDown(card, { key: "ArrowDown" });
    expect(order()).not.toEqual(before);
    fireEvent.keyDown(card, { key: "Escape" });
    expect(order()).toEqual(before);

    // jsdom has no PointerEvent, and without one the pointer events carry no position: a stand-in for this test only.
    class TestPointerEvent extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 0; this.pointerType = init.pointerType ?? "mouse"; }
    }
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    const drag = (finish: "pointerUp" | "pointerCancel") => {
      fireEvent.pointerDown(container.querySelectorAll(".tl-grip")[0], { pointerId: 1, pointerType: "mouse", button: 0, clientX: 5, clientY: 10 });
      fireEvent.pointerMove(window, { pointerId: 1, pointerType: "mouse", clientX: 5, clientY: 300 });
      fireEvent[finish](window, { pointerId: 1, pointerType: "mouse", clientX: 5, clientY: 300 });
    };
    drag("pointerCancel");
    expect(order()).toEqual(before);
    drag("pointerUp"); // the same drag, dropped, does move the card: so the cancel above was a real drag
    expect(order()).toEqual([...before.slice(1), before[0]]);
  });

  it("brings back the same cards in the same order after a reload", async () => {
    const first = renderAt("/games/timeline?play=daily");
    await screen.findByRole("heading", { name: new RegExp(`Today's timeline #${N}`) });
    keyboardMove(5, 0);
    const moved = order();
    first.unmount();
    renderAt();
    fireEvent.click(await screen.findByRole("button", { name: /Continue your daily timeline/ }));
    expect(order()).toEqual(moved);
  });

  it("plays a Practice round: Check waits for a move, then pairs in order and the next round", async () => {
    renderAt();
    fireEvent.click(await screen.findByRole("button", { name: "Start practice" }));
    expect(cards()).toHaveLength(5);
    expect(check()).toBeDisabled();
    keyboardMove(0, 4);
    fireEvent.click(check());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/of 10 pairs in order/);
    fireEvent.click(screen.getByRole("button", { name: /Next round/ }));
    expect(cards()).toHaveLength(5);
  });
});
