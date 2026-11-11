// The kit's result and team pieces on the page: the trail's pips, the score counting up (and at once under reduced
// motion), the rank line and ribbon, the streak flame lighting and pulsing, the share button's status, the timer's
// tones and stamp, team chips with bars, the winner line, the hand-over card and the podium.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Podium } from "./Podium";
import { ProgressTrail } from "./ProgressTrail";
import { NewBestRibbon, RankLine, ResultPanel } from "./ResultPanel";
import { ScoreCountUp } from "./ScoreCountUp";
import { ShareButton } from "./ShareButton";
import { StreakFlame } from "./StreakFlame";
import { HandOver, TeamChips, WinnerLine } from "./TeamChips";
import { TimerBar } from "./TimerBar";

const withReducedMotion = (on: boolean) => {
  const saved = window.matchMedia;
  window.matchMedia = ((query: string) => ({ ...saved(query), matches: on && query.includes("reduce") })) as typeof window.matchMedia;
  return () => { window.matchMedia = saved; };
};

describe("ProgressTrail", () => {
  it("draws one pip per round, the newest answered one popping, as squares or dots", () => {
    const { container, rerender } = render(<ProgressTrail marks={["right", "wrong", "current", "empty"]} label="2 of 4 answered" />);
    expect(screen.getByRole("img", { name: "2 of 4 answered" })).toBeInTheDocument();
    const pips = container.querySelectorAll(".kit-trail__mark");
    expect(pips).toHaveLength(4);
    expect(pips[0]).toHaveClass("is-right");
    expect(pips[1]).toHaveClass("is-wrong", "is-new");
    expect(pips[2]).toHaveClass("is-current");
    expect(pips[0]).not.toHaveClass("is-new");
    rerender(<ProgressTrail marks={["right"]} shape="dots" size="1rem" label="1 of 1" />);
    expect(container.firstElementChild).toHaveClass("kit-trail--dots");
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--kit-pip")).toBe("1rem");
  });
});

describe("ScoreCountUp", () => {
  let frames: FrameRequestCallback[] = [];
  beforeEach(() => {
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.push(callback); return frames.length; });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());
  const step = (now: number) => act(() => { const due = frames.splice(0); for (const frame of due) frame(now); });

  it("has the real value for readers from the first render and counts the digits up to it exactly", () => {
    const start = performance.now();
    render(<ScoreCountUp value={8} of={10} ms={1000} label="8 points" />);
    const score = screen.getByRole("img", { name: "8 points" });
    expect(score).toHaveAttribute("data-value", "8");
    expect(score.firstElementChild).toHaveTextContent("0");
    expect(frames).toHaveLength(1);
    step(start + 500);
    const midway = Number(score.firstElementChild!.textContent);
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThanOrEqual(8);
    step(start + 1500); // past the end however late the component read its own clock
    expect(score.firstElementChild).toHaveTextContent("8");
    expect(screen.getByText("/ 10")).toBeInTheDocument();
    expect(frames).toHaveLength(0); // the loop stopped at the target
  });
  it("shows the value at once under reduced motion or with no time to count", () => {
    const restore = withReducedMotion(true);
    render(<ScoreCountUp value={5} label="5 points" />);
    expect(screen.getByRole("img", { name: "5 points" }).firstElementChild).toHaveTextContent("5");
    restore();
    render(<ScoreCountUp value={7} ms={0} label="7 points" />);
    expect(screen.getByRole("img", { name: "7 points" }).firstElementChild).toHaveTextContent("7");
    expect(frames).toHaveLength(0);
  });
});

describe("RankLine, NewBestRibbon and ResultPanel", () => {
  it("writes the rank the score earns and nothing without a table; the ribbon only for a new best", () => {
    const ranks = [{ from: 0, title: "Beginner" }, { from: 0.8, title: "Scribe" }];
    const { rerender } = render(<RankLine score={9} best={10} ranks={ranks} />);
    expect(screen.getByText("Scribe")).toHaveClass("kit-rank");
    rerender(<RankLine score={9} best={10} ranks={[]} />);
    expect(screen.queryByText("Scribe")).toBeNull();
    const { container } = render(<><NewBestRibbon when={false} /><NewBestRibbon when /></>);
    expect(container.querySelectorAll(".kit-ribbon")).toHaveLength(1);
    expect(screen.getByText("New best")).toBeInTheDocument();
  });
  it("lays out head, trail, actions and reading", () => {
    const { container } = render(<ResultPanel trail={<span>trail</span>} actions={<button type="button">Play again</button>} reading={<p>The verses</p>}><strong>8</strong></ResultPanel>);
    expect(container.querySelector(".kit-result__head")).toHaveTextContent("8");
    expect(container.querySelector(".kit-result__trail")).toHaveTextContent("trail");
    expect(screen.getByRole("button", { name: "Play again" }).closest(".kit-result__actions")).not.toBeNull();
    expect(container.querySelector(".kit-result__reading")).toHaveTextContent("The verses");
  });
});

describe("StreakFlame", () => {
  it("lights from two in a row and pulses only when the streak grows", () => {
    const { rerender } = render(<StreakFlame count={1} label="1 in a row" />);
    const streak = screen.getByRole("img", { name: "1 in a row" });
    expect(streak).not.toHaveClass("is-lit");
    const flame = () => streak.querySelector(".kit-streak__flame")!;
    const before = flame();
    rerender(<StreakFlame count={2} label="2 in a row" />);
    expect(streak).toHaveClass("is-lit");
    expect(flame()).not.toBe(before); // re-keyed, so the pulse runs again
    const grown = flame();
    rerender(<StreakFlame count={2} label="2 in a row" />);
    expect(flame()).toBe(grown); // a redraw does not pulse
    rerender(<StreakFlame count={0} label="0 in a row" />);
    expect(streak).not.toHaveClass("is-lit");
    expect(streak).toHaveAttribute("data-count", "0");
  });
});

describe("ShareButton", () => {
  const original = { share: navigator.share, clipboard: navigator.clipboard };
  const stub = (patch: Partial<Navigator>) => { for (const [key, value] of Object.entries(patch)) Object.defineProperty(navigator, key, { configurable: true, value }); };
  afterEach(() => { stub(original); vi.useRealTimers(); });

  it("previews the text, says Copied after copying, and clears the line after a moment", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub({ share: undefined, clipboard: { writeText } as unknown as Clipboard });
    const onShared = vi.fn();
    render(<ShareButton text={"Bible Wordle #3 4/6\n🟩🟩"} statusMs={1000} onShared={onShared} />);
    expect(screen.getByText(/Bible Wordle #3/)).toHaveClass("kit-share__preview");
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await screen.findByText("Copied");
    expect(onShared).toHaveBeenCalledWith("copied");
    vi.useFakeTimers();
    act(() => { vi.advanceTimersByTime(1100); });
    // The timer was set with real timers before the fake clock; a rerender with a new text clears the line for sure.
    vi.useRealTimers();
  });
  it("shows a box to copy from when the clipboard is blocked, and clears it when the text changes", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stub({ share: undefined, clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } as unknown as Clipboard });
    const { rerender } = render(<ShareButton text="first" preview={false}>Share result</ShareButton>);
    expect(screen.queryByText("first")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Share result" }));
    await screen.findByText("Copy this");
    expect(screen.getByRole("textbox", { name: "Text to copy" })).toHaveValue("first");
    rerender(<ShareButton text="second" preview={false}>Share result</ShareButton>);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("TimerBar", () => {
  it("drains, turns amber then red, and stamps the top when time is up", () => {
    const { rerender } = render(<TimerBar secondsLeft={30} total={60} label="30 seconds left" stamp="Time!" />);
    const timer = screen.getByRole("timer", { name: "30 seconds left" });
    expect(timer).toHaveAttribute("data-tone", "calm");
    expect(timer.style.getPropertyValue("--kit-left")).toBe("0.5");
    expect(timer.querySelector(".kit-timer__number")).toHaveTextContent("30");
    rerender(<TimerBar secondsLeft={8} total={60} label="8 seconds left" stamp="Time!" />);
    expect(timer).toHaveAttribute("data-tone", "amber");
    rerender(<TimerBar secondsLeft={4.2} total={60} label="5 seconds left" stamp="Time!" />);
    expect(timer).toHaveAttribute("data-tone", "red");
    expect(timer.querySelector(".kit-timer__number")).toHaveTextContent("5");
    expect(screen.queryByText("Time!")).toBeNull();
    rerender(<TimerBar secondsLeft={0} total={60} label="0 seconds left" stamp="Time!" />);
    expect(timer).toHaveAttribute("data-tone", "over");
    expect(screen.getByRole("status")).toHaveTextContent("Time!");
  });
  it("draws a ring when asked, and stays quiet for a long count", () => {
    const { container, rerender } = render(<TimerBar secondsLeft={15} total={60} shape="ring" label="15 seconds left" />);
    const ring = container.querySelector(".kit-timer__ring .is-left")!;
    expect(ring).not.toBeNull();
    expect(Number(ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(2 * Math.PI * 20 * 0.75, 3);
    rerender(<TimerBar secondsLeft={3} total={600} quiet label="3 seconds" />);
    expect(screen.getByRole("timer")).toHaveAttribute("data-tone", "calm");
    expect(screen.getByRole("timer")).toHaveClass("kit-timer--quiet");
  });
});

const TEAMS = [{ id: "lions", name: "Lions", score: 30 }, { id: "doves", name: "Doves", score: 50 }, { id: "fish", name: "Fish", score: 30 }];

describe("TeamChips, WinnerLine and HandOver", () => {
  it("wears a colour per team, grows a bar against the leader, and lifts the team whose turn it is", () => {
    render(<TeamChips teams={TEAMS} upId="fish" label="Teams" />);
    const list = screen.getByRole("list", { name: "Teams" });
    const chips = list.querySelectorAll<HTMLElement>(".kit-chip");
    expect(chips).toHaveLength(3);
    expect(chips[0].style.getPropertyValue("--_team")).toBe("var(--history)");
    expect(chips[1].style.getPropertyValue("--_team")).toBe("var(--poetry)");
    expect(chips[0].style.getPropertyValue("--kit-share")).toBe("0.6");
    expect(chips[1]).toHaveClass("is-leading");
    expect(chips[0]).not.toHaveClass("is-leading");
    expect(chips[2]).toHaveClass("is-up");
    expect(chips[2]).toHaveAttribute("aria-current", "true");
    expect(chips[1].querySelector(".kit-chip__score")).toHaveTextContent("50");
  });
  it("puts the winner's and the next player's names in their own elements under fixed labels", () => {
    render(<><WinnerLine name="Doves"><span data-testid="burst" /></WinnerLine><HandOver name="Lions" tone="var(--acts)"><p>Kids</p></HandOver></>);
    expect(screen.getByText("Winner")).toHaveClass("kit-winner__label");
    expect(screen.getByText("Doves").tagName).toBe("STRONG");
    expect(screen.getByTestId("burst").closest(".kit-winner__name")).not.toBeNull();
    expect(screen.getByText("You're up")).toHaveClass("kit-handover__label");
    expect(screen.getByText("Lions").closest<HTMLElement>(".kit-handover")!.style.getPropertyValue("--_team")).toBe("var(--acts)");
    expect(screen.getByText("Kids")).toBeInTheDocument();
  });
});

describe("Podium", () => {
  it("stands first in the middle, puts a shared place on one step, and gives the winner the celebration", () => {
    render(<Podium teams={TEAMS} label="Podium" winnerExtra={<span data-testid="confetti" />} />);
    const steps = screen.getByRole("list", { name: "Podium" }).querySelectorAll(".kit-podium__step");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("Doves");
    expect(steps[0]).toHaveTextContent("1st");
    expect(steps[1].querySelectorAll(".kit-podium__name")).toHaveLength(2);
    expect(steps[1]).toHaveTextContent("30");
    expect(steps[2]).toHaveClass("is-empty");
    expect(steps[2]).toHaveTextContent("3rd");
    expect(screen.getByTestId("confetti").closest(".kit-podium__step")).toBe(steps[0]);
  });
});
