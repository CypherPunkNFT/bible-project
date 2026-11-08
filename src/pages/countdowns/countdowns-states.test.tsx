// The page states and church tools the code review checked against the design (6.2, 6.3, 7.4, 7.6): the printed sheet is
// drawn before the print opens, blocked storage never breaks a page, the church panel leads before the season, Holy Week
// links to today's Lent reading, the "afterwards" days give next year's date, and sharing waits for the verse.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { catalog, removeFonts, serveBerean } from "@/pages/life-events/test-kit";
import CountdownsPage from "./CountdownsPage";

function renderAt(path: string) {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/countdowns/*" element={<CountdownsPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const storage = Object.getOwnPropertyDescriptor(window, "localStorage")!;
const portalText = () => document.querySelector(".print-sheet-portal")?.textContent ?? "";

beforeEach(() => {
  removeFonts();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 11, 12, 10));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "localStorage", storage);
  localStorage.clear();
});

describe("countdowns: printing a church sheet", () => {
  it("has the sheet drawn when the print opens, the first time and after switching sheets", () => {
    serveBerean();
    const printed: string[] = [];
    vi.stubGlobal("print", vi.fn(() => printed.push(portalText())));
    renderAt("/countdowns/advent");
    fireEvent.click(screen.getByRole("button", { name: "Print the reading plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Print bulletin inserts" }));
    expect(printed).toHaveLength(2);
    expect(printed[0]).toContain("Advent Reading Plan");
    expect(printed[1]).toContain("Read along with us this Advent");
  });
});

describe("countdowns: a browser that blocks site storage", () => {
  it("still shows the page and lets a day be marked, for this visit only", () => {
    serveBerean();
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt("/countdowns/advent");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Advent Reading Plan");
    fireEvent.click(screen.getAllByRole("button", { name: "Mark as read" })[0]);
    expect(screen.getByText("Your ticks won't be kept after you close this window.")).toBeInTheDocument();
  });
});

describe("countdowns: the states of a season", () => {
  it("puts the church panel before the plan while Advent is still coming up", () => {
    serveBerean();
    vi.setSystemTime(new Date(2026, 10, 7, 10));
    renderAt("/countdowns/advent");
    const church = screen.getByRole("heading", { level: 2, name: "For your church" });
    const plan = screen.getByRole("heading", { level: 2, name: "Every day" });
    expect(church.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("links the Holy Week page to today's Lent reading while Lent is under way", () => {
    serveBerean();
    vi.setSystemTime(new Date(2027, 2, 10, 10));
    renderAt("/countdowns/holy-week");
    const link = screen.getByRole("link", { name: /^today's reading, / });
    expect(link.closest("p")?.textContent).toMatch(/^Lent is under way/);
    expect(link.getAttribute("href")).toMatch(/^\/countdowns\/lent\/day-\d+$/);
  });

  it("gives next year's start date in Advent's afterwards days", () => {
    serveBerean();
    vi.setSystemTime(new Date(2026, 11, 30, 10));
    const { container } = renderAt("/countdowns/advent");
    expect(container.querySelector(".cd-onward")?.textContent).toBe("Advent 2027 begins on Sunday, November 28, 2027.");
  });

  it("labels the Holy Week row of the Lent calendar", () => {
    serveBerean();
    vi.setSystemTime(new Date(2027, 2, 10, 10));
    const { container } = renderAt("/countdowns/lent");
    const label = container.querySelector(".cd-row-label");
    expect(label?.textContent).toBe("Holy Week");
    expect(label?.nextElementSibling?.querySelector("[aria-label]")?.getAttribute("aria-label")).toContain("Palm Sunday, Holy Week begins");
  });
});

describe("countdowns: a day page", () => {
  it("offers no sharing until the verse has loaded", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    renderAt("/countdowns/advent/dec-12");
    expect(screen.getByText("Sharing waits until the verse loads.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
  });

  it("treats a built-in name in the address as an unknown day", async () => {
    serveBerean();
    renderAt("/countdowns/advent/constructor");
    await waitFor(() => expect(screen.getByText("We couldn't find that day; here is today's reading.")).toBeInTheDocument());
  });
});
