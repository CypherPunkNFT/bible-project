// @vitest-environment-options {"url": "https://bibleproject.io/study/atlas/map"}
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// This file runs as if opened on the live site, so the ticker must stay hidden (owner, 2026-10-07).
// The modules are imported inside the tests, after the saved settings are in place, because the
// host check and the saved settings are read once, when the module loads.
describe("transition ticker on the live site", () => {
  it("decides by host name, or an explicit ?ticker", async () => {
    const { tickerAllowed } = await import("./transition-clock");
    expect(tickerAllowed("127.0.0.1", "")).toBe(true);
    expect(tickerAllowed("localhost", "")).toBe(true);
    expect(tickerAllowed("bibleproject.io", "")).toBe(false);
    expect(tickerAllowed("db56bb65.bible-project-4af.pages.dev", "?place=a15257a")).toBe(false);
    expect(tickerAllowed("bibleproject.io", "?ticker")).toBe(true);
    expect(tickerAllowed("bibleproject.io", "?find=Rome&ticker=1")).toBe(true);
    expect(tickerAllowed("127.0.0.1.example.com", "")).toBe(false);
  });

  it("shows no button and never slows or holds the transitions, even with a panel saved open", async () => {
    localStorage.setItem("atlas-transition-ticker", JSON.stringify({ open: true, speed: 0.05 }));
    const { TICKER_ENABLED, transitionTicker } = await import("./transition-clock");
    const { TransitionTicker } = await import("./TransitionTicker");
    expect(window.location.hostname).toBe("bibleproject.io");
    expect(TICKER_ENABLED).toBe(false);
    expect(transitionTicker.state.open).toBe(false);
    transitionTicker.setOpen(true);
    expect(transitionTicker.state.open).toBe(false);
    const { container } = render(<TransitionTicker />);
    expect(container).toBeEmptyDOMElement();
  });
});
