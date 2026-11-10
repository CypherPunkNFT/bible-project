// Bible Jeopardy's keys (design 9.10, 13).
import { keyCommand, moved, teamOfCode, type KeyContext, type KeyPress } from "./keys";
import type { Screen } from "./rules";

const press = (key: string, over: Partial<KeyPress> = {}): KeyPress => ({ key, code: "", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...over });
const on = (screen: Screen, over: Partial<KeyContext> = {}): KeyContext => ({ screen, fullscreen: false, typing: false, ...over });

describe("keyCommand", () => {
  it("moves round the board with the arrows and opens with Enter, Space or a clicker's Page Down", () => {
    expect(keyCommand(press("ArrowRight"), on("board"))).toEqual({ type: "move", dx: 1, dy: 0 });
    expect(keyCommand(press("ArrowUp"), on("board"))).toEqual({ type: "move", dx: 0, dy: -1 });
    for (const key of ["Enter", " ", "PageDown"]) expect(keyCommand(press(key), on("board"))).toEqual({ type: "open" });
    expect(keyCommand(press("Backspace"), on("board"))).toBeNull();
  });

  it("on the clue: Space or Page Down shows the answer; Backspace or Page Up goes back; Enter does nothing", () => {
    expect(keyCommand(press(" "), on("clue"))).toEqual({ type: "reveal" });
    expect(keyCommand(press("PageDown"), on("clue"))).toEqual({ type: "reveal" });
    expect(keyCommand(press("Backspace"), on("clue"))).toEqual({ type: "back" });
    expect(keyCommand(press("PageUp"), on("clue"))).toEqual({ type: "back" });
    expect(keyCommand(press("Enter"), on("clue"))).toBeNull();
  });

  it("on the answer: Enter, Space, Backspace and both clicker keys go back to the board", () => {
    for (const key of ["Enter", " ", "Backspace", "PageDown", "PageUp"]) expect(keyCommand(press(key), on("answer"))).toEqual({ type: "back" });
  });

  it("1–6 mark a team right and Shift + 1–6 wrong, by key position, on the clue and the answer", () => {
    expect(keyCommand(press("1", { code: "Digit1" }), on("clue"))).toEqual({ type: "mark", team: 0, right: true });
    expect(keyCommand(press("!", { code: "Digit1", shiftKey: true }), on("clue"))).toEqual({ type: "mark", team: 0, right: false });
    expect(keyCommand(press("&", { code: "Digit1" }), on("answer"))).toEqual({ type: "mark", team: 0, right: true });
    expect(keyCommand(press("6", { code: "Numpad6" }), on("tie-clue"))).toEqual({ type: "mark", team: 5, right: true });
    expect(keyCommand(press("7", { code: "Digit7" }), on("clue"))).toBeNull();
    expect(keyCommand(press("1", { code: "Digit1" }), on("board"))).toBeNull();
    expect(teamOfCode("Digit3")).toBe(2);
    expect(teamOfCode("KeyA")).toBeNull();
  });

  it("Esc goes back only outside full screen, where the browser keeps it", () => {
    expect(keyCommand(press("Escape"), on("clue"))).toEqual({ type: "back" });
    expect(keyCommand(press("Escape"), on("answer"))).toEqual({ type: "back" });
    expect(keyCommand(press("Escape"), on("clue", { fullscreen: true }))).toBeNull();
    expect(keyCommand(press("Escape"), on("board"))).toBeNull();
  });

  it("Z undoes and F toggles full screen on every stage screen", () => {
    for (const screen of ["board", "clue", "answer", "final-answer"] as Screen[]) {
      expect(keyCommand(press("z", { code: "KeyZ" }), on(screen))).toEqual({ type: "undo" });
      expect(keyCommand(press("F", { code: "KeyF", shiftKey: true }), on(screen))).toEqual({ type: "fullscreen" });
    }
  });

  it("ignores keys with Ctrl, Alt or Meta, and every key while typing in a box", () => {
    expect(keyCommand(press("z", { code: "KeyZ", ctrlKey: true }), on("board"))).toBeNull();
    expect(keyCommand(press("f", { code: "KeyF", metaKey: true }), on("board"))).toBeNull();
    expect(keyCommand(press("1", { code: "Digit1", altKey: true }), on("clue"))).toBeNull();
    expect(keyCommand(press(" "), on("clue", { typing: true }))).toBeNull();
    expect(keyCommand(press("z", { code: "KeyZ" }), on("board", { typing: true }))).toBeNull();
  });
});

describe("moved", () => {
  it("stays inside the grid", () => {
    expect(moved({ col: 0, row: 0 }, -1, 0, 5, 5)).toEqual({ col: 0, row: 0 });
    expect(moved({ col: 4, row: 4 }, 1, 1, 5, 5)).toEqual({ col: 4, row: 4 });
    expect(moved({ col: 2, row: 1 }, 1, 1, 5, 5)).toEqual({ col: 3, row: 2 });
  });
});
