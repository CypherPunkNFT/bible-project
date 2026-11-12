import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { QuestionBank } from "@/lib/data";
import { DEFAULT_SETTINGS, type HostView, type PlayerView } from "@/lib/live-quiz/protocol";
import { groupedCode } from "./leader";
import { LeaderboardScreen, Lobby, PodiumScreen } from "./LeaderScreens";
import { PlayerLayer, PlayerScreen } from "./PlayerScreens";
import { Setup } from "./Setup";

vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,AAAA")) } }));

const base = {
  t: "state" as const, roomId: "room1", code: "482913", serverNow: Date.now(), index: 2, total: 15, paused: false,
  opensAt: Date.now(), closesAt: Date.now() + 20_000, remaining: null, leaderOnline: true,
};

const phone = (patch: Partial<PlayerView>): PlayerView => ({
  ...base, role: "player", phase: "lobby", settings: { timer: 20, phoneText: true },
  question: { text: "Who built the ark?", leadIn: null, options: ["Moses", "Noah", "Abraham", "David"] }, correct: null,
  you: { id: "p1", name: "Gentle Dove", score: 1850, streak: 2, rank: 4, tied: false, choice: null, result: null, gapAbove: 120, aboveName: "Sam" },
  verses: null, ...patch,
});

const draw = (view: PlayerView, onAnswer = vi.fn()) =>
  render(<MemoryRouter><PlayerScreen view={view} offset={0} pending={null} onAnswer={onAnswer} /></MemoryRouter>);

describe("live quiz on the phone", () => {
  it("waits in the lobby with the player's name", () => {
    draw(phone({ phase: "lobby" }));
    expect(screen.getByText("You're in!")).toBeInTheDocument();
    expect(screen.getByText("Gentle Dove")).toBeInTheDocument();
    expect(screen.getByText("Look for your name on the screen.")).toBeInTheDocument();
  });

  it("shows the question number and, when the leader allows it, the question while reading", () => {
    draw(phone({ phase: "read", question: { text: "Who built the ark?", leadIn: null, options: null } }));
    expect(screen.getByText("Question 3 of 15")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Who built the ark?" })).toBeInTheDocument();
    expect(screen.queryByText("Read it on the screen")).toBeNull(); // the question is right there on the phone
    expect(screen.getByText("Get ready")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers four big buttons with letter and text, and sends the choice", () => {
    const onAnswer = vi.fn();
    draw(phone({ phase: "answer" }), onAnswer);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[1]).toHaveTextContent("BNoah");
    fireEvent.click(buttons[1]);
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("shows 'locked in' once an answer is in", () => {
    draw(phone({ phase: "answer", you: { ...phone({}).you, choice: 2 } }));
    expect(screen.getByText("Answer locked in")).toBeInTheDocument();
    expect(screen.getByText("Waiting for the others…")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows the result, the points, the streak and the gap after the reveal", () => {
    draw(phone({ phase: "reveal", correct: 1, you: { ...phone({}).you, choice: 1, result: { right: true, points: 850 }, streak: 3 } }));
    expect(screen.getByText("Right!")).toBeInTheDocument();
    expect(screen.getByLabelText("+850")).toBeInTheDocument();
    expect(screen.getByText("3 in a row")).toBeInTheDocument();
    expect(screen.getByText("4th")).toBeInTheDocument();
    expect(screen.getByText("120 points behind")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("tells a wrong answer which one was right, in its colour, shape and letter", () => {
    draw(phone({ phase: "reveal", correct: 1, you: { ...phone({}).you, choice: 2, result: { right: false, points: 0 }, streak: 0 } }));
    expect(screen.getByText("Not this time")).toBeInTheDocument();
    expect(screen.getByText("It was")).toBeInTheDocument();
    const tile = screen.getByText("Noah").closest(".lq-option");
    expect(tile).toHaveAttribute("data-i", "1");
    expect(tile).toHaveTextContent("BNoah");
  });

  it("floods the phone red for a wrong answer and with the chosen colour while locked in", () => {
    const wrong = phone({ phase: "reveal", correct: 1, you: { ...phone({}).you, choice: 2, result: { right: false, points: 0 } } });
    const { container, unmount } = render(<MemoryRouter><PlayerLayer view={wrong} offset={0} pending={null} onAnswer={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector(".lq-layer")).toHaveAttribute("data-flood", "true");
    expect((container.querySelector(".lq-layer") as HTMLElement).style.getPropertyValue("--lq-flood")).toBe("var(--lq-wrong)");
    unmount();
    const locked = phone({ phase: "answer", you: { ...phone({}).you, choice: 3 } });
    const again = render(<MemoryRouter><PlayerLayer view={locked} offset={0} pending={null} onAnswer={vi.fn()} /></MemoryRouter>);
    expect((again.container.querySelector(".lq-layer") as HTMLElement).style.getPropertyValue("--lq-flood")).toBe("var(--lq-d)");
  });

  it("ends with the final place and links to the night's verses", () => {
    draw(phone({ phase: "podium", verses: [{ reference: "Gen 6:14", link: { book: "GEN", chapter: 6, verse: 14 } }, { reference: null, link: null }] }));
    expect(screen.getByText("Thanks for playing!")).toBeInTheDocument();
    expect(screen.getByText("4th")).toBeInTheDocument();
    expect(screen.getByLabelText("1,850 points")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gen 6:14" })).toHaveAttribute("href", "/read/bsb/GEN/6?v=14"); // no catalog here: the bank's words
  });

  it("gives the first three places a medal", () => {
    const { container } = draw(phone({ phase: "podium", verses: [], you: { ...phone({}).you, rank: 1 } }));
    expect(container.querySelector(".lq-final")).toHaveAttribute("data-medal", "1");
    expect(container.querySelector(".lq-medal")).not.toBeNull();
  });

  it("says when the leader's screen is away", () => {
    draw(phone({ phase: "leaderboard", leaderOnline: false }));
    expect(screen.getByText("Waiting for the leader…")).toBeInTheDocument();
  });
});

const hostView = (patch: Partial<HostView> = {}): HostView => ({
  ...base, role: "host", phase: "lobby", index: -1, settings: DEFAULT_SETTINGS, locked: false, question: null, correct: null,
  players: [{ id: "p1", name: "Sam", score: 0, streak: 0, rank: 1, tied: true, connected: true, answered: false, move: null },
    { id: "p2", name: "Ann", score: 0, streak: 0, rank: 1, tied: true, connected: false, answered: false, move: null }],
  answered: { count: 0, of: 2 }, counts: null, autoAt: null, usedIds: [], ...patch,
});

describe("live quiz leader", () => {
  it("shows the join code large, grouped 3+3, with the QR code and the players", async () => {
    const onKick = vi.fn();
    render(<Lobby view={hostView()} onKick={onKick} />);
    expect(groupedCode("482913")).toBe("482 913");
    expect(screen.getByLabelText("Game code 482913")).toHaveTextContent("482 913");
    expect(await screen.findByAltText(/QR code that opens .*\/play\/482913/)).toHaveAttribute("src", "data:image/png;base64,AAAA");
    expect(screen.getByText("2 players")).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("list", { name: "Players" })).getByRole("button", { name: "Ann" }));
    expect(onKick).toHaveBeenCalledWith(expect.objectContaining({ id: "p2" }));
  });

  it("lists the lobby's names in the order they joined, each with its symbol, and offers the projector", () => {
    const seen = new Map([["p2", 0], ["p1", 1]]);
    const onProjector = vi.fn();
    render(<Lobby view={hostView()} onKick={vi.fn()} seen={seen} onProjector={onProjector} />);
    const names = within(screen.getByRole("list", { name: "Players" })).getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Ann", "Sam"]);
    expect(screen.getByRole("list", { name: "Players" }).querySelectorAll(".lq-badge")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Show on projector" }));
    expect(onProjector).toHaveBeenCalled();
  });

  it("draws the leaderboard as bars that grow from the last scores, with the mover's slide", () => {
    const players = [
      { id: "p1", name: "Sam", score: 2000, streak: 3, rank: 1, tied: false, connected: true, answered: true, move: 1 },
      { id: "p2", name: "Ann", score: 1000, streak: 0, rank: 2, tied: false, connected: true, answered: true, move: -1 },
    ];
    const { container } = render(<LeaderboardScreen view={hostView({ phase: "leaderboard", index: 4, players })} fromScores={new Map([["p1", 1000], ["p2", 1000]])} />);
    const rows = container.querySelectorAll<HTMLElement>(".lq-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].style.getPropertyValue("--lq-share")).toBe("1");
    expect(rows[0].style.getPropertyValue("--lq-from")).toBe("0.5");
    expect(rows[0].style.getPropertyValue("--lq-slide")).toBe("1");
    expect(rows[1].style.getPropertyValue("--lq-slide")).toBe("-1");
    expect(screen.getByLabelText("Up 1")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "3 in a row" })).toBeInTheDocument();
  });

  it("raises the podium third, second, first, and shows the full list only when more than three played", () => {
    vi.useFakeTimers();
    const three = [
      { id: "p1", name: "Sam", score: 3000, streak: 0, rank: 1, tied: false, connected: true, answered: true, move: null },
      { id: "p2", name: "Ann", score: 2000, streak: 0, rank: 2, tied: false, connected: true, answered: true, move: null },
      { id: "p3", name: "Eve", score: 1000, streak: 0, rank: 3, tied: false, connected: true, answered: true, move: null },
    ];
    const { container, rerender } = render(<PodiumScreen view={hostView({ phase: "podium", players: three })} />);
    const podium = container.querySelector(".lq-podium")!;
    expect(podium).toHaveAttribute("data-shown", "0");
    act(() => { vi.advanceTimersByTime(1300); });
    expect(podium).toHaveAttribute("data-shown", "1");
    act(() => { vi.advanceTimersByTime(1300 * 3); });
    expect(podium).toHaveAttribute("data-shown", "3");
    expect(screen.queryByRole("list", { name: "Full results" })).toBeNull();
    const four = [...three, { id: "p4", name: "Dan", score: 500, streak: 0, rank: 4, tied: false, connected: true, answered: true, move: null }];
    rerender(<PodiumScreen view={hostView({ phase: "podium", players: four })} />);
    expect(screen.getByRole("list", { name: "Full results" })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("counts the matching questions and needs at least three to create a room", () => {
    const question = (i: number, kind: string) => ({
      question: `Question ${i}?`, answer: "A", answer_choice: "A", options: ["A", "B", "C", "D"], reference: null, kind, tradition: null, collection: "c",
      lesson: null, books: ["GEN"], testament: "OT" as const, topic: null, link: null, standalone: true, level: "easy" as const, children: true,
    });
    const bank = { kinds: {}, topics: [], books: [{ code: "GEN", name: "Genesis", short: "Gen", section: "law", testament: "OT" }], collections: [],
      questions: [question(1, "trivia"), question(2, "trivia"), question(3, "catechism")] } as QuestionBank;
    render(<Setup bank={bank} onCreated={vi.fn()} />);
    expect(screen.getByText("2 questions")).toBeInTheDocument(); // catechism is opt-in
    expect(screen.getByRole("button", { name: "Create room" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Catechism" }));
    expect(screen.getByText("3 questions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create room" })).toBeEnabled();
  });
});
