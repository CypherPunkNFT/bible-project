// Memory card match with team phones (docs/features/team-play/design.md, section 4 and Review 9-12): what phones are
// shown, what they may send, the names a room accepts, and the board taking taps from phones only on their turn.
import { act, cleanup, render } from "@testing-library/react";
import { useRef, useState } from "react";
import rawData from "@/data/memory-match/pairs.json";
import { Board, FLIP_MS, type RemoteFlip } from "./Board";
import type { Card, PairsFile } from "./deal";
import { cardText, newGame, type GameState } from "./game";
import { DEFAULT_SETTINGS } from "./storage";
import { phoneView, readInput } from "./team";
import MemoryTeamPhone from "./TeamPhone";
import { distinctNames, turnPlace } from "./useTeams";
import { versionOf } from "./versions";

const data = rawData as unknown as PairsFile;
const [p1, p2, p3] = data.pairs.slice(0, 3).map((pair) => pair.id);
// Positions: 0 who1, 1 story2, 2 story1, 3 who2, 4 who3, 5 story3
const CARDS: Card[] = [
  { pair: p1, kind: "who" }, { pair: p2, kind: "story" }, { pair: p1, kind: "story" },
  { pair: p2, kind: "who" }, { pair: p3, kind: "who" }, { pair: p3, kind: "story" },
];
const teams = () => newGame(data.stamp, "mixed", "easy", 3, CARDS, ["Lions", "Eagles"], false);

afterEach(cleanup);

describe("what a team phone is shown", () => {
  it("shows face-down cards without words, face-up and found ones with them, and whose turn it is", () => {
    const game: GameState = { ...teams(), up: [4], matched: [1, null, 1, null, null, null], found: [p1], turn: 1 };
    const view = phoneView(game, data, "play", 3);
    expect(view.cards[1]).toEqual({ s: "d", k: "story" }); // Easy: the back shows the kind anyway
    expect(view.cards[4]).toEqual({ s: "u", k: "who", text: cardText(data, CARDS[4]) });
    expect(view.cards[0]).toEqual({ s: "f", k: "who", text: cardText(data, CARDS[0]), partner: cardText(data, CARDS[2]), by: 1 });
    expect(view).toMatchObject({ turn: "t2", round: 3, columns: 3, scores: [0, 1], phase: "play", result: null, version: "people", difficulty: "easy" });
    expect(JSON.stringify(view).length).toBeLessThan(4000);
  });

  it("never tells a phone a face-down card's pair, colour or words, nor its kind on Hard (design 10.5)", () => {
    const hard: GameState = { ...teams(), difficulty: "hard", up: [4] };
    const view = phoneView(hard, data, "play", 1);
    for (const n of [0, 1, 2, 3, 5]) expect(view.cards[n]).toEqual({ s: "d" });
    const text = JSON.stringify(view);
    for (const pair of [p1, p2, p3]) expect(text).not.toContain(pair);
    for (const card of view.cards) expect(Object.keys(card).sort()).not.toContain("t");
  });

  it("names no turn in the lobby or study, and gives the result once every pair is found", () => {
    expect(phoneView(teams(), data, "study", 1).turn).toBeNull();
    const done: GameState = { ...teams(), matched: [0, 1, 0, 1, 1, 1], found: [p1, p2, p3] };
    expect(phoneView(done, data, "play", 1)).toMatchObject({ phase: "done", turn: null, result: "Eagles wins with 2 pairs" });
  });

  it("reads only well-formed taps", () => {
    expect(readInput({ flip: 4, round: 2 })).toEqual({ flip: 4, round: 2 });
    for (const bad of [null, 5, { flip: -1, round: 1 }, { flip: 1.5, round: 1 }, { flip: 2 }, { flip: "2", round: 1 }]) expect(readInput(bad)).toBeNull();
  });

  it("plays a turn on this screen only for a team with no phone, or while this screen is offline", () => {
    const status = (state: "open" | "held" | "away") => [{ id: "t1", name: "Lions", state }, { id: "t2", name: "Eagles", state: "held" as const }];
    expect(turnPlace(status("open"), true, 0)).toBe("here");
    expect(turnPlace(status("held"), true, 0)).toBe("phone");
    expect(turnPlace(status("away"), true, 0)).toBe("away"); // a phone asleep keeps its team's turn
    expect(turnPlace(status("held"), false, 0)).toBe("here");
  });

  it("makes team names the room accepts: distinct, filled in and short enough", () => {
    expect(distinctNames(["Lions", "lions", "", "A very long team name indeed"])).toEqual(["Lions", "lions 2", "Team 3", "A very long team nam"]);
  });
});

/** The board inside a parent that keeps the game, as MemoryMatchGame does. */
function Harness({ start, remote, localTaps = true }: { start: GameState; remote: { current: RemoteFlip | null }; localTaps?: boolean }) {
  const [game, setGame] = useState(start);
  const ref = useRef<RemoteFlip | null>(null);
  remote.current = (player, index) => ref.current?.(player, index);
  return <Board data={data} version={versionOf("people")} game={game} settings={DEFAULT_SETTINGS} onChange={setGame} onSettings={() => undefined}
    onFinish={setGame} onRestart={() => undefined} onQuit={() => undefined} remote={ref} localTaps={localTaps} />;
}

const faceUp = (container: HTMLElement) => container.querySelectorAll(".mm-grid .mm-card:not([data-face='down'])").length;

describe("the board taking taps from phones", () => {
  it("applies two taps sent together, in order, for the team whose turn it is, and ignores the other team", () => {
    vi.useFakeTimers();
    try {
      const remote: { current: RemoteFlip | null } = { current: null };
      const { container } = render(<Harness start={teams()} remote={remote} />);
      const before = faceUp(container);
      act(() => { remote.current!(1, 0); }); // not Eagles' turn
      expect(faceUp(container)).toBe(before);
      act(() => { remote.current!(0, 0); remote.current!(0, 2); }); // Lions: card 0 then card 2, a pair
      act(() => { vi.advanceTimersByTime(FLIP_MS + 50); });
      const live = container.querySelector("[aria-live='polite']")!.textContent ?? "";
      expect(live).toMatch(/A pair/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores this screen's clicks and keys while the team plays on its phone, and still takes the phone's taps", () => {
    vi.useFakeTimers();
    try {
      const remote: { current: RemoteFlip | null } = { current: null };
      const { container } = render(<Harness start={teams()} remote={remote} localTaps={false} />);
      const before = faceUp(container);
      const first = container.querySelector<HTMLButtonElement>(".mm-grid .mm-card")!;
      act(() => { first.click(); });
      act(() => { first.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
      act(() => { first.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })); });
      expect(faceUp(container)).toBe(before);
      act(() => { remote.current!(0, 0); });
      act(() => { vi.advanceTimersByTime(FLIP_MS + 50); });
      expect(faceUp(container)).toBe(before + 1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the turned cards read above a phone's board", () => {
  const view = (change: Partial<GameState>) => phoneView({ ...teams(), ...change }, data, "play", 1);
  const slots = (container: HTMLElement) => [...container.querySelectorAll(".mmp-turned li")].map((li) => li.querySelector(".mmp-turned__text")?.textContent ?? "");
  const panelState = (container: HTMLElement) => container.querySelector(".mmp-turned")!.className;
  const marks = (container: HTMLElement) => [...container.querySelectorAll(".mm-grid .mm-slot")].map((slot) => slot.querySelector(".mm-card__mark")?.textContent ?? "");
  const words = (n: number) => cardText(data, CARDS[n]);
  const show = (node: ReturnType<typeof render>, change: Partial<GameState>) =>
    act(() => { node.rerender(<MemoryTeamPhone view={view(change)} team="t1" send={() => undefined} />); });

  it("numbers the cards in the order they were tapped, on the card and in the panel, and marks a non-pair", () => {
    const node = render(<MemoryTeamPhone view={view({ up: [5] })} team="t1" send={() => undefined} />);
    expect(slots(node.container)).toEqual([words(5), ""]);
    show(node, { up: [2, 5] }); // the later tap has the lower place on the board
    expect(slots(node.container)).toEqual([words(5), words(2)]);
    expect(marks(node.container)).toEqual(["", "", "2", "", "", "1"]);
    expect(panelState(node.container)).toContain("is-miss");
  });

  it("keeps a found pair's words for a moment, then clears, and never brings back an earlier miss", () => {
    vi.useFakeTimers();
    try {
      const node = render(<MemoryTeamPhone view={view({ up: [0, 1] })} team="t1" send={() => undefined} />);
      show(node, { up: [] }); // the miss turns back: its words stay
      expect(slots(node.container)).toEqual([words(0), words(1)]);
      act(() => { vi.advanceTimersByTime(100); });
      show(node, { up: [4] }); // a fast tap, while the miss is still turning back
      expect(slots(node.container)).toEqual([words(4), ""]);
      show(node, { up: [], matched: [null, null, null, null, 0, 0], found: [p3] });
      expect(slots(node.container)).toEqual([words(4), words(5)]);
      expect(panelState(node.container)).toContain("is-pair");
      act(() => { vi.advanceTimersByTime(2000); });
      expect(slots(node.container)).toEqual(["", ""]);
      expect(node.container.querySelectorAll(".mm-card.is-closing")).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
