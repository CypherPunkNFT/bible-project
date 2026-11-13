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
import { distinctNames } from "./useTeams";
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
    expect(view.cards[1]).toEqual({ s: "d" });
    expect(view.cards[4]).toEqual({ s: "u", text: cardText(data, CARDS[4]) });
    expect(view.cards[0]).toEqual({ s: "f", text: cardText(data, CARDS[0]), by: 1 });
    expect(view).toMatchObject({ turn: "t2", round: 3, columns: 3, scores: [0, 1], phase: "play", result: null });
    expect(JSON.stringify(view).length).toBeLessThan(4000);
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

  it("makes team names the room accepts: distinct, filled in and short enough", () => {
    expect(distinctNames(["Lions", "lions", "", "A very long team name indeed"])).toEqual(["Lions", "lions 2", "Team 3", "A very long team nam"]);
  });
});

/** The board inside a parent that keeps the game, as MemoryMatchGame does. */
function Harness({ start, remote }: { start: GameState; remote: { current: RemoteFlip | null } }) {
  const [game, setGame] = useState(start);
  const ref = useRef<RemoteFlip | null>(null);
  remote.current = (player, index) => ref.current?.(player, index);
  return <Board data={data} version={versionOf("people")} game={game} settings={DEFAULT_SETTINGS} onChange={setGame} onSettings={() => undefined}
    onFinish={setGame} onRestart={() => undefined} onQuit={() => undefined} remote={ref} />;
}

const faceUp = (container: HTMLElement) => container.querySelectorAll(".mm-grid > *:not([data-face='down'])").length;

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
});
