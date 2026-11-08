import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { QuestionBank } from "@/lib/data";
import { DEFAULT_SETTINGS, type HostView, type PlayerView } from "@/lib/live-quiz/protocol";
import { groupedCode } from "./leader";
import { Lobby } from "./LeaderScreens";
import { PlayerScreen } from "./PlayerScreens";
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
    expect(screen.getByText("You're in, Gentle Dove! Look for your name on the screen.")).toBeInTheDocument();
  });

  it("shows the question number and, when the leader allows it, the question while reading", () => {
    draw(phone({ phase: "read", question: { text: "Who built the ark?", leadIn: null, options: null } }));
    expect(screen.getByText("Question 3 of 15")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Who built the ark?" })).toBeInTheDocument();
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
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows the result, the points, the streak and the gap after the reveal", () => {
    draw(phone({ phase: "reveal", correct: 1, you: { ...phone({}).you, choice: 1, result: { right: true, points: 850 }, streak: 3 } }));
    expect(screen.getByText("Right!")).toBeInTheDocument();
    expect(screen.getByText("+850")).toBeInTheDocument();
    expect(screen.getByText("3 in a row")).toBeInTheDocument();
    expect(screen.getByText("You're 4th")).toBeInTheDocument();
    expect(screen.getByText("120 points behind Sam")).toBeInTheDocument();
  });

  it("ends with the final place and links to the night's verses", () => {
    draw(phone({ phase: "podium", verses: [{ reference: "Genesis 6:14", link: { book: "GEN", chapter: 6, verse: 14 } }, { reference: null, link: null }] }));
    expect(screen.getByText("You finished 4th with 1,850 points.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Genesis 6:14" })).toHaveAttribute("href", "/read/bsb/GEN/6?v=14");
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
