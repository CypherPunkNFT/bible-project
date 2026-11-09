// The holy days page (design, "What the visitor sees" and "Review"): the year from the address, the year control, the
// filter, coming up, and a day's Berean passages loaded when it is opened. The failure test runs first, before any
// Berean book is in the site's file cache, so its Retry really reaches the (stand-in) network.
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { resolveRange } from "@/lib/verses";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import { HOLY_DAYS } from "./days";
import HolyDaysPage from "./HolyDaysPage";

let address = "";
function Address() {
  const location = useLocation();
  address = location.pathname + location.search;
  return null;
}

function renderAt(path: string) {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <Address />
        <Routes><Route path="/holy-days" element={<HolyDaysPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const dayButton = (name: string) => screen.getByRole("button", { name: new RegExp(name.replace(/[()]/g, "\\$&")) });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 12));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the holy days page", () => {
  it("offers Retry when the passages cannot load, and shows them once they can", async () => {
    serveBerean({ fail: true });
    renderAt("/holy-days?year=2026");
    fireEvent.click(dayButton("Purim"));
    expect(await screen.findByRole("alert")).toHaveTextContent("The passages could not be loaded.");
    serveBerean();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText(/Days of feasting and joy/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Esther 9:20–22" })).toHaveAttribute("href", "/read/bsb/EST/9?hl=20-22");
  });

  it("shows the year in the address, in date order under month headings", () => {
    serveBerean();
    renderAt("/holy-days?year=2027");
    expect(screen.getByRole("heading", { level: 1, name: "Holy days calendar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Holy days in 2027" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("2027");
    const easter = dayButton("Easter Sunday");
    expect(easter).toHaveTextContent("Sunday, March 28");
    expect(dayButton("Pascha")).toHaveTextContent("Sunday, May 2");
    const months = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(months[0]).toBe("January");
    expect(months.at(-1)).toBe("December");
    expect(dayButton("Feast of Dedication")).toHaveTextContent("Lasts 8 days, until Saturday, January 1, 2028");
  });

  it("opens one day at a time, with its explanation, how its date is set and its passages", async () => {
    serveBerean();
    renderAt("/holy-days?year=2026");
    const passover = dayButton("Passover and Unleavened Bread");
    expect(passover).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(passover);
    expect(passover).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(passover.getAttribute("aria-controls")!)!;
    expect(panel).toHaveTextContent(HOLY_DAYS.passover.reckoning);
    expect(panel).toHaveTextContent("it begins at sunset the evening before");
    expect(await within(panel).findByText(/when I see the blood, I will pass over you/)).toBeInTheDocument();
    fireEvent.click(dayButton("Good Friday"));
    expect(passover).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
  });

  it("filters by tradition and never hides all three", () => {
    serveBerean();
    renderAt("/holy-days?year=2026");
    const western = screen.getByRole("button", { name: "Western churches" });
    const orthodox = screen.getByRole("button", { name: "Orthodox churches" });
    const feasts = screen.getByRole("button", { name: "Biblical feasts" });
    expect(screen.getByText(/^Showing 22 of 22$/)).toBeInTheDocument();
    fireEvent.click(western);
    fireEvent.click(orthodox);
    expect(western).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: /Easter Sunday/ })).toBeNull();
    expect(screen.getByText(/^Showing 8 of 22$/)).toBeInTheDocument();
    expect(feasts).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(feasts);
    expect(feasts).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to this year for a year it cannot show, and cleans the address", () => {
    serveBerean();
    for (const bad of ["1582", "2027abc", "0x7EB", "10000"]) {
      const { unmount } = renderAt(`/holy-days?year=${bad}`);
      expect(screen.getByRole("heading", { level: 2, name: "Holy days in 2026" })).toBeInTheDocument();
      expect(address).toBe("/holy-days");
      unmount();
    }
  });

  it("moves by year with the arrows, takes a typed year on Enter, and keeps to 1583–9999", () => {
    serveBerean();
    renderAt("/holy-days?year=1584");
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(address).toBe("/holy-days?year=1583");
    expect(screen.getByRole("button", { name: "Previous year" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(address).toBe("/holy-days?year=1583");
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "20" } });
    expect(address).toBe("/holy-days?year=1583");
    fireEvent.change(box, { target: { value: "2030" } });
    fireEvent.submit(box);
    expect(address).toBe("/holy-days?year=2030");
    fireEvent.change(box, { target: { value: "12" } });
    fireEvent.blur(box);
    expect(address).toBe("/holy-days?year=1583");
    expect(screen.getByText("Choose a year from 1583 to 9999.")).toHaveClass("hd-hint");
    fireEvent.click(screen.getByRole("button", { name: "This year" }));
    expect(address).toBe("/holy-days");
    expect(screen.queryByRole("button", { name: "This year" })).toBeNull();
  });

  it("says what is coming up from today", () => {
    serveBerean();
    renderAt("/holy-days");
    expect(screen.getByText(/^Next comes First Sunday of Advent, on Sunday, November 29, in 20 days$/)).toBeInTheDocument();
  });

  it("names a feast under way", () => {
    vi.setSystemTime(new Date(2026, 3, 4, 12));
    serveBerean();
    renderAt("/holy-days");
    expect(screen.getByText(/^Under way now: Passover and Unleavened Bread, day 3 of 7$/)).toBeInTheDocument();
  });
});

describe("the key passages", () => {
  it("every passage is in the Berean, with words for every verse", async () => {
    serveBerean();
    const missing: string[] = [];
    for (const [key, day] of Object.entries(HOLY_DAYS)) {
      for (const passage of day.passages) {
        const { verses } = await act(() => resolveRange(catalog, passage.from, passage.to ?? passage.from, "bsb"));
        if (!verses.length || verses.some((verse) => !verse.text)) missing.push(`${key}: ${passage.from}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("names every book the way the catalogue does", () => {
    const books = JSON.parse(readFileSync("data/catalog.json", "utf8")).books as { num: number }[];
    const numbers = new Set(books.map((book) => book.num));
    for (const day of Object.values(HOLY_DAYS)) for (const passage of day.passages) expect(numbers.has(Math.floor(passage.from / 1_000_000))).toBe(true);
  });
});
