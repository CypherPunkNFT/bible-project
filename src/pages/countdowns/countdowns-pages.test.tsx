// The countdown pages with a fixed clock (design 8.3 "Pages", "Which run is shown"): the hub, an occasion page, a day page,
// read marks, redirects for mistyped links, the not-found page, a personal date, and midnight while a page is open.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OCCASIONS, type CountdownDay, type Occasion } from "@/data/countdowns";
import { p } from "@/data/countdowns/types";
import { CatalogContext } from "@/lib/catalog";
import { catalog, removeFonts, serveBerean } from "@/pages/life-events/test-kit";
import { VisitProbe } from "@/pages/sympathy/visit-probe";
import CountdownsPage from "./CountdownsPage";
import { STORAGE_KEY } from "./storage";

const visits: { address: string; how: string }[] = [];
function renderAt(path: string) {
  visits.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <VisitProbe onVisit={(visit) => visits.push(visit)} />
        <Routes><Route path="/countdowns/*" element={<CountdownsPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

beforeEach(() => {
  removeFonts();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 11, 12, 10));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });

describe("countdowns: the hub", () => {
  it("lists Advent, Lent and Holy Week", () => {
    serveBerean();
    renderAt("/countdowns");
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toEqual(expect.arrayContaining(["/countdowns/advent", "/countdowns/lent", "/countdowns/holy-week"]));
    expect(screen.getByText(/Under way: 13 days until Christmas/)).toBeInTheDocument();
  });
});

describe("countdowns: an occasion page", () => {
  it("shows the heading, the introduction first, today's status, every day of the run and today marked", async () => {
    serveBerean();
    const { container } = renderAt("/countdowns/advent");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Advent Reading Plan: A Daily Devotional to Christmas");
    const firstLong = [...container.querySelectorAll("main p, article p")].find((item) => (item.textContent ?? "").length >= 60);
    expect(firstLong?.textContent).toBe(OCCASIONS[0].intro);
    expect(container.querySelector(".cd-status")?.textContent).toContain("13 days until Christmas");
    // 2026: Advent Sunday is November 29, so the run is November 29 to December 25.
    expect(container.querySelectorAll(".cd-plan-rows > li")).toHaveLength(27);
    const today = container.querySelector('[aria-current="date"]');
    expect(today?.getAttribute("href")).toBe("/countdowns/advent/dec-12");
    expect(screen.getByRole("heading", { level: 2, name: "For your church" })).toBeInTheDocument();
    expect(await screen.findByText(/13 days until Christmas/, { selector: ".cd-card-line" })).toBeInTheDocument();
  });

  it("shows the candle panel on an Advent Sunday", async () => {
    serveBerean();
    vi.setSystemTime(new Date(2026, 11, 13, 10));
    renderAt("/countdowns/advent");
    expect(screen.getByRole("complementary", { name: /candle of joy/i })).toBeInTheDocument();
  });

  it("shows a door still to come with its opening date and a Read it now link", () => {
    serveBerean();
    renderAt("/countdowns/advent");
    fireEvent.click(screen.getByRole("button", { name: /^December 20,/ }));
    const peek = screen.getByText(/This one opens on/);
    expect(within(peek).getByRole("link", { name: "Read it now" }).getAttribute("href")).toBe("/countdowns/advent/dec-20");
  });

  it("moves the today mark at midnight while the page is open", () => {
    serveBerean();
    const { container } = renderAt("/countdowns/advent");
    expect(container.querySelector('[aria-current="date"]')?.getAttribute("href")).toBe("/countdowns/advent/dec-12");
    vi.setSystemTime(new Date(2026, 11, 13, 7));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(container.querySelector('[aria-current="date"]')?.getAttribute("href")).toBe("/countdowns/advent/dec-13");
  });

  it("shows Lent coming up in December with next year's Ash Wednesday", () => {
    serveBerean();
    const { container } = renderAt("/countdowns/lent");
    expect(container.querySelector(".cd-status")?.textContent).toMatch(/^Lent 2027 begins on .*February 10/);
  });
});

describe("countdowns: a day page", () => {
  it("shows the reading inside .scripture with lang=en, the reflection, the prayer and the question", async () => {
    serveBerean();
    const day = (OCCASIONS[0].days as CountdownDay[]).find((item) => item.key === "dec-12")!;
    const { container } = renderAt("/countdowns/advent/dec-12");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(`Advent, December 12: ${day.title}`);
    await waitFor(() => expect(container.querySelector(".cd-text")).not.toBeNull());
    const text = container.querySelector(".cd-text")!;
    expect(text.classList.contains("scripture")).toBe(true);
    expect(text.getAttribute("lang")).toBe("en");
    expect(text.textContent).toContain("stump of Jesse");
    expect(screen.getByText(day.reflection)).toBeInTheDocument();
    expect(screen.getByText(day.prayer)).toBeInTheDocument();
    if (day.question) expect(screen.getByText(day.question)).toBeInTheDocument();
    const firstLong = [...container.querySelectorAll("article p")].find((item) => (item.textContent ?? "").length >= 60);
    expect(firstLong?.textContent).toBe(day.reflection);
    expect(container.querySelector(".cd-status")?.textContent).toContain("Today");
  });

  it("marks a day read and clears it again, in this browser's storage", () => {
    serveBerean();
    renderAt("/countdowns/advent/dec-12");
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).runs["advent:2026-12-25"].read).toEqual(["dec-12"]);
    fireEvent.click(screen.getByRole("button", { name: "Read ✓" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).runs["advent:2026-12-25"].read).toEqual([]);
  });

  it("redirects a mistyped day to the occasion page, replacing the address, with a gentle line", () => {
    serveBerean();
    renderAt("/countdowns/advent/dec-1");
    expect(visits.at(-1)).toEqual({ address: "/countdowns/advent", how: "REPLACE" });
    expect(screen.getByText("We couldn't find that day; here is today's reading.")).toBeInTheDocument();
  });

  it("sends a Holy Week day to Lent's day page", () => {
    serveBerean();
    renderAt("/countdowns/holy-week/day-39");
    expect(visits.at(-1)).toEqual({ address: "/countdowns/lent/day-39", how: "REPLACE" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^Good Friday: /);
  });

  it("shows the site's own not-found page for an unknown occasion", () => {
    serveBerean();
    renderAt("/countdowns/hanukkah");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nothing is written here.");
  });
});

// A personal occasion added as data only, to prove the pages need no code for it (design 3.2).
const reading = p("PSA 27:14", "reading", "Wait for the Lord.");
const testDay = (key: string, before: number): CountdownDay => ({ key, at: { before }, title: `Title ${key}`, readings: [reading], card: { ...reading, role: "card" }, reflection: "x", prayer: "Amen." });
const WEDDING: Occasion = {
  slug: "test-wedding", name: "Wedding", heading: "Test Wedding Countdown", summary: "Test", intro: "A test.", targetName: "the wedding",
  target: { kind: "chosen" }, start: { kind: "before", days: 30 }, afterDays: 3, calendar: "doors", style: "plain", closing: "Done.",
  days: [...Array.from({ length: 30 }, (_, index) => testDay(`d-${30 - index}`, 30 - index)), testDay("the-day", 0)], topics: [], related: [],
};

describe("countdowns: a personal date", () => {
  beforeEach(() => { OCCASIONS.push(WEDDING); });
  afterEach(() => { OCCASIONS.splice(OCCASIONS.indexOf(WEDDING), 1); });

  it("shows the date form with the reason for an impossible date", () => {
    serveBerean();
    renderAt("/countdowns/test-wedding?date=2027-02-30");
    expect(screen.getByRole("form", { name: "Choose your date" })).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toMatch(/That date doesn't exist/);
  });

  it("refuses a date more than two years ahead", () => {
    serveBerean();
    renderAt("/countdowns/test-wedding?date=2029-06-12");
    expect(screen.getByRole("alert").textContent).toBe("Choose a date within the next two years.");
  });

  it("counts down to a date from the link, starting partway through, and keeps ticks with a saved countdown", () => {
    serveBerean();
    const { container } = renderAt("/countdowns/test-wedding?date=2026-12-22");
    expect(container.querySelector(".cd-status")?.textContent).toContain("10 days until the wedding");
    expect(screen.getByText(/You started partway through/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!).mine;
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ occasion: "test-wedding", date: "2026-12-22", read: ["d-10"], name: "" });
  });
});
