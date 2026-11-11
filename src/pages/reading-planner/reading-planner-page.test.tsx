// The planner page (design 1, 4–7 and 10): the default plan, both ways of planning, choosing books, errors, the calendar
// file, the printed sheet, ticks kept in this browser only, and the windowed day list.
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import ReadingPlannerPage from "./ReadingPlannerPage";
import { STORAGE_KEY } from "./storage";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

function renderPage() {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={["/reading-planner"]}>
        <Routes><Route path="/reading-planner" element={<ReadingPlannerPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const fact = (label: string) => screen.getByText(label, { selector: ".rp-facts dt" }).nextElementSibling?.textContent;
const dayRows = () => within(screen.getByRole("list", { name: "Reading days" })).getAllByRole("listitem");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2027, 0, 1, 9, 0, 0));
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("the reading planner page", () => {
  it("opens on the whole Bible in a year from today, with the times each day and for the whole plan", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bible reading planner");
    expect([...document.querySelectorAll("p")].some((p) => (p.textContent ?? "").length >= 60)).toBe(true);
    expect(fact("Reading days")).toBe("365");
    expect(fact("Finishes")).toBe("Friday, December 31, 2027");
    expect(fact("The whole plan")).toMatch(/hours/);
    const first = dayRows()[0];
    expect(within(first).getByRole("link")).toHaveAttribute("href", "/read/bsb/GEN/1");
    expect(first).toHaveTextContent(/Genesis 1–\d/);
    expect(first).toHaveTextContent("Today");
    expect(first.querySelector(".rp-day-time")?.textContent).toMatch(/\d+ min/);
  });

  it("draws a window of the day list, not every day", () => {
    renderPage();
    expect(dayRows().length).toBeLessThan(365);
    expect(dayRows()[0]).toHaveAttribute("aria-setsize", "365");
  });

  it("works out the days from a pace in chapters, minutes or pages", () => {
    renderPage();
    fireEvent.click(screen.getByLabelText("Read at my own pace"));
    expect(fact("Reading days")).toBe("397");
    fireEvent.change(screen.getByLabelText("Measured in"), { target: { value: "minutes" } });
    fireEvent.change(screen.getByLabelText("Pace"), { target: { value: "15" } });
    expect(fact("Reading days")).toBe(String(Math.ceil(726040 / 3000)));
    fireEvent.change(screen.getByLabelText("Reading speed"), { target: { value: "150" } });
    expect(fact("Reading days")).toBe(String(Math.ceil(726040 / 2250)));
    expect(screen.getByText("Some days run longer than your pace, because a chapter is never split.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Measured in"), { target: { value: "pages" } });
    expect(screen.getByText(/A page here is about 500 words/)).toBeInTheDocument();
  });

  it("plans only the chosen books, and says plainly what is wrong", () => {
    renderPage();
    fireEvent.click(screen.getByLabelText("Choose books"));
    for (const button of screen.getAllByRole("button", { name: "Clear" })) fireEvent.click(button);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose at least one book to read.");
    fireEvent.click(screen.getByLabelText("Ruth"));
    expect(fact("Reading days")).toBe("4");
    expect(screen.getByText(/more reading days than chapters/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Read at my own pace"));
    fireEvent.change(screen.getByLabelText("Pace"), { target: { value: "2.5" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a pace as a whole number from 1 to 999.");
  });

  it("downloads a calendar file with one entry per reading day", async () => {
    const blobs: Blob[] = [];
    vi.stubGlobal("URL", Object.assign(Object.create(URL), { createObjectURL: (blob: Blob) => { blobs.push(blob); return "blob:x"; }, revokeObjectURL: () => undefined }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    expect(click).toHaveBeenCalled();
    // jsdom's Blob has no text(); FileReader reads it.
    const text = await new Promise<string>((done) => { const reader = new FileReader(); reader.onload = () => done(String(reader.result)); reader.readAsText(blobs[0]); });
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(365);
    expect(text).toContain("DTSTART;VALUE=DATE:20270101");
    click.mockRestore();
  });

  it("prints every day of the plan, drawn before the print dialog opens", () => {
    let printed = 0;
    vi.stubGlobal("print", vi.fn(() => { printed = document.querySelectorAll(".print-sheet-portal .rps-rows > li").length; }));
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Print the plan" }));
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(printed).toBe(365);
    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.querySelectorAll(".print-sheet-portal .rps-rows > li")).toHaveLength(0);
  });

  it("keeps ticks in this browser only once a day is ticked, and opens on the kept plan next time", () => {
    renderPage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    fireEvent.click(within(dayRows()[0]).getByRole("checkbox"));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").read).toEqual([1]);
    expect(fact("Days read")).toBe("1 / 365");
    cleanup();
    renderPage();
    expect(within(dayRows()[0]).getByRole("checkbox")).toBeChecked();
    fireEvent.click(screen.getByLabelText("New Testament"));
    expect(screen.getByText(/You have a plan saved in this browser/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open my saved plan" }));
    expect(fact("Days read")).toBe("1 / 365");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Forget my saved plan" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
