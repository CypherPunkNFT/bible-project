// The shared result (design §7): number, score and squares, never a letter of the answer.
import { evaluate } from "./evaluate";
import { SHARE_ADDRESS, shareResult, shareText } from "./share";

const rowsFor = (guesses: string[], answer: string) => guesses.map((guess) => evaluate(guess, answer));

describe("bible wordle share text", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("gives the number, the score and a row of squares per guess", () => {
    const text = shareText({ n: 12, rows: rowsFor(["bread", "faith"], "faith"), won: true, hard: false, hint: false, dark: false, contrast: false });
    expect(text).toBe(`Bible Wordle #12 2/6\n⬜⬜⬜🟨⬜\n🟩🟩🟩🟩🟩\n${SHARE_ADDRESS}`);
  });

  it("marks a loss with X, hard mode with a star and a hint with a bulb", () => {
    const rows = rowsFor(["bread", "water", "stone", "grace", "peace", "light"], "faith");
    expect(shareText({ n: 3, rows, won: false, hard: true, hint: true, dark: false, contrast: false }).split("\n")[0]).toBe("Bible Wordle #3 X/6* 💡");
  });

  it("uses black squares in the dark theme and orange and blue in high contrast", () => {
    const text = shareText({ n: 1, rows: rowsFor(["bread"], "dream"), won: false, hard: false, hint: false, dark: true, contrast: true });
    expect(text.split("\n")[1]).toBe("⬛🟧🟧🟧🟦");
    expect(shareText({ n: 1, rows: rowsFor(["dream"], "dream"), won: true, hard: false, hint: false, dark: true, contrast: true }).split("\n")[1]).toBe("🟧🟧🟧🟧🟧");
  });

  it("never holds a letter of the answer", () => {
    const text = shareText({ n: 9, rows: rowsFor(["sheol", "jesus"], "jesus"), won: true, hard: false, hint: false, dark: false, contrast: false });
    expect(text.replace("Bible Wordle", "").replace(SHARE_ADDRESS, "")).not.toMatch(/[a-z]/i);
  });
});

describe("bible wordle sharing", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("uses the phone's share sheet where there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });
    expect(await shareResult("hello")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "hello" });
  });

  it("treats a closed share sheet as cancelled, not as a failure", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new DOMException("closed", "AbortError")), clipboard: { writeText: vi.fn() } });
    expect(await shareResult("hello")).toBe("cancelled");
  });

  it("copies instead where there is no share sheet, and asks for a manual copy when the clipboard is blocked", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareResult("hello")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hello");
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    expect(await shareResult("hello")).toBe("manual");
  });
});
