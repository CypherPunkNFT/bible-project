// The puzzle maker when a file cannot be read (design §10): it says so and offers Try again, never "not enough words".
// A file of its own, because every file read stays read for the rest of a test file (src/lib/data.ts).
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { PUZZLE_MAKER_PATH } from "./PuzzleMakerPage";
import { renderAt, serveBerean } from "./test-kit";

afterEach(() => vi.unstubAllGlobals());

describe("Puzzle maker, offline", () => {
  it("names a passage that could not be loaded, and makes the puzzle on Try again", async () => {
    serveBerean({ fail: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderAt(`${PUZZLE_MAKER_PATH}?kind=search&ref=Psalm+23&seed=4`);
    expect(await screen.findByText(/The passage could not be loaded/, {}, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.queryByText(/not enough words/)).toBeNull();
    expect(screen.queryByRole("region", { name: "Your puzzle" })).toBeNull();
    serveBerean();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(document.querySelector(".pm-preview .pm-search")).not.toBeNull(), { timeout: 15000 });
    expect(screen.queryByText(/could not be loaded/)).toBeNull();
  }, 30000);
});
