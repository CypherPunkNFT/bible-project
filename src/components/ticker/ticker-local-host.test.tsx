import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TICKER_ENABLED } from "./transition-clock";
import { TransitionTicker } from "./TransitionTicker";

// The test page's address is localhost, like the local preview, so the ticker shows (its counterpart,
// ticker-live-host.test.tsx, runs as the live site and checks that it is hidden there).
describe("transition ticker on the local preview", () => {
  it("shows its button", () => {
    expect(window.location.hostname).toBe("localhost");
    expect(TICKER_ENABLED).toBe(true);
    render(<TransitionTicker />);
    expect(screen.getByRole("button", { name: /Ticker/ })).toBeInTheDocument();
  });
});
