import { fireEvent, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { renderAt, serveBerean } from "./test-kit";

afterEach(() => vi.unstubAllGlobals());

describe("Bible word counter, offline", () => {
  it("says which books could not be loaded instead of counting them as none", async () => {
    serveBerean({ fail: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderAt("/word-counter?q=love");
    expect(await screen.findByText(/Some books could not be loaded/, {}, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.queryByText(/Not found/)).toBeNull();
    expect(screen.queryByText("Times", { selector: "dt" })).toBeNull();
    serveBerean();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "love" }, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.queryByText(/Some books could not be loaded/)).toBeNull();
  }, 30000);
});
