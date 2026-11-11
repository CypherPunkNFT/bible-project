import { fireEvent, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { renderAt, serveChapters } from "./test-kit";

// Every file read in a test file stays read for the rest of it (src/lib/data.ts), so offline tests have a file of their own.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Random Bible verse, offline", () => {
  it("keeps the reference when its words cannot be loaded, and tries again", async () => {
    serveChapters({ fail: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt("/random-verse?v=PSA.23.1");
    expect(await screen.findByText(/This verse could not be loaded/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Psalm 23:1" })).toHaveAttribute("href", "/read/bsb/PSA/23?hl=1");
    serveChapters();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(/The LORD is my shepherd/)).toBeInTheDocument();
  });

  it("says so when no verse can be drawn", async () => {
    serveChapters({ fail: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    renderAt("/random-verse?from=JUD");
    expect(await screen.findByText("A verse could not be loaded. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Another verse" })).toBeEnabled();
  });
});
