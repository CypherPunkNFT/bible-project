// Bible Jeopardy's keys (design 9.10): which key does what on the board, the clue and the answer. Team keys go by the
// key's position (event.code), so Shift + 1 marks team 1 wrong whatever character the layout types. In full screen the
// browser keeps Esc for itself, so Backspace and a clicker's Page Up are the "back" keys that always work.
import type { Screen } from "./rules";

export type KeyCommand =
  | { type: "move"; dx: number; dy: number }
  | { type: "open" }
  | { type: "reveal" }
  | { type: "back" }
  | { type: "mark"; team: number; right: boolean }
  | { type: "undo" }
  | { type: "fullscreen" };

export interface KeyPress { key: string; code: string; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean }

export interface KeyContext {
  screen: Screen;
  /** The stage is in the browser's full-screen mode. */
  fullscreen: boolean;
  /** A text box, select or button with its own typing has focus: every game key is ignored. */
  typing: boolean;
}

const MOVES: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The team a key stands for, 0–5, from its position on the top row or the number pad. */
export function teamOfCode(code: string): number | null {
  const match = /^(?:Digit|Numpad)([1-6])$/.exec(code);
  return match ? Number(match[1]) - 1 : null;
}

const CLUE_SCREENS: readonly Screen[] = ["clue", "tie-clue"];
const ANSWER_SCREENS: readonly Screen[] = ["answer", "tie-answer"];

/** The command a key press asks for, or null when the game leaves it to the browser. */
export function keyCommand(press: KeyPress, context: KeyContext): KeyCommand | null {
  if (press.ctrlKey || press.altKey || press.metaKey || context.typing) return null;
  const { screen } = context;
  const key = press.key;
  if (key === "z" || key === "Z" || press.code === "KeyZ") return { type: "undo" };
  if (key === "f" || key === "F" || press.code === "KeyF") return { type: "fullscreen" };
  const clue = CLUE_SCREENS.includes(screen);
  const answer = ANSWER_SCREENS.includes(screen);
  const team = teamOfCode(press.code);
  if (team !== null) return clue || answer ? { type: "mark", team, right: !press.shiftKey } : null;
  if (screen === "board") {
    const move = MOVES[key];
    if (move) return { type: "move", dx: move[0], dy: move[1] };
    if (key === "Enter" || key === " " || key === "PageDown") return { type: "open" };
    return null;
  }
  const escape = key === "Escape" && !context.fullscreen;
  if (clue) {
    if (key === " " || key === "PageDown") return { type: "reveal" };
    if (key === "Backspace" || key === "PageUp" || escape) return { type: "back" };
    return null;
  }
  if (answer) {
    if (key === "Enter" || key === " " || key === "PageDown" || key === "Backspace" || key === "PageUp" || escape) return { type: "back" };
    return null;
  }
  return null;
}

/** The next tile the arrows reach on a grid of columns × rows, staying inside it. */
export function moved(spot: { col: number; row: number }, dx: number, dy: number, columns: number, rows: number) {
  return { col: Math.min(columns - 1, Math.max(0, spot.col + dx)), row: Math.min(rows - 1, Math.max(0, spot.row + dy)) };
}
