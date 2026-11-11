// The /tithe-calculator page (design sections 3, 4 and 8): figures as the reader types, any period and percentage, hints
// for what it cannot read, other percentages, nothing sent or stored while typing, a passage opened in the Berean (and
// Retry when it fails), and its live entry on the tools hub.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import { TOOLS } from "@/pages/tools/registry";
import TitheCalculatorPage from "./TitheCalculatorPage";

let shown = "";
function Where() {
  const { pathname, search, hash } = useLocation();
  shown = pathname + search + hash;
  return null;
}

function renderPage() {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={["/tithe-calculator"]}>
        <Where />
        <main id="main"><Routes><Route path="/tithe-calculator" element={<TitheCalculatorPage />} /></Routes></main>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const figures = () => screen.getByTestId("tc-figures").textContent ?? "";
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("tithe calculator page", () => {
  it("asks for an income first, then shows a tenth by week, month and year", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tithe and giving calculator");
    expect(screen.getByText("Type your income to see what your giving comes to.")).toBeInTheDocument();
    type("How often", "week");
    type("Income", "1,000");
    expect(figures()).toMatch(/Each week\$100\.00Each month\$433\.33Each year\$5,200\.00/);
    expect(screen.getByText("Counted as $1,000.00.")).toBeInTheDocument();
    expect(screen.getByText("10%", { selector: "button bdi" }).closest("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("follows the period, the currency and the percentage, quick or typed", () => {
    renderPage();
    type("Income", "2000");
    type("How often", "two-weeks");
    expect(figures()).toMatch(/Each pay\$200\.00/);
    type("Currency", "JPY");
    expect(figures()).toMatch(/Each year¥5,200/);
    fireEvent.click(screen.getByText("15%", { selector: "button bdi" }));
    expect(screen.getByLabelText("Or type a percentage")).toHaveValue("15");
    expect(figures()).toMatch(/Each year¥7,800/);
    type("Or type a percentage", "12,5");
    expect(figures()).toMatch(/Each year¥6,500/);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("says what to type when it cannot read a field, and hides the figures", () => {
    renderPage();
    type("Income", "1,0005");
    expect(screen.getByLabelText("Income")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Type an amount above zero in figures/)).toBeInTheDocument();
    expect(screen.queryByTestId("tc-figures")).toBeNull();
    type("Income", "3000");
    type("Or type a percentage", "150");
    expect(screen.getByText(/Type a percentage above 0 and up to 100/)).toBeInTheDocument();
    expect(screen.queryByTestId("tc-figures")).toBeNull();
  });

  it("compares the same income at other percentages, marking the chosen one", () => {
    renderPage();
    expect(screen.getByText("Type your income above to compare percentages.")).toBeInTheDocument();
    type("Income", "5000");
    type("Or type a percentage", "7.5");
    const table = screen.getByRole("table", { name: "Giving at other percentages" });
    const rows = [...table.querySelectorAll("tbody tr")].map((row) => row.textContent);
    expect(rows).toHaveLength(7);
    expect(rows[1]).toMatch(/^7\.5%Your choice/);
    expect(within(table).getByText("$6,000.00")).toBeInTheDocument(); // 10% of 60,000 a year
  });

  it("announces the figures once typing pauses", async () => {
    renderPage();
    type("Income", "1000");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Giving 10% comes to $23.08 a week, $100.00 a month and $1,200.00 a year."));
  });

  it("sends and stores nothing while the reader types", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const stored = vi.spyOn(Storage.prototype, "setItem");
    const cookie = vi.spyOn(document, "cookie", "set");
    renderPage();
    type("Income", "4,250.75");
    type("How often", "year");
    type("Currency", "GBP");
    type("Or type a percentage", "12");
    fireEvent.keyDown(screen.getByLabelText("Income"), { key: "Enter" });
    expect(figures()).toMatch(/£510\.09/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(stored).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(shown).toBe("/tithe-calculator");
    expect(document.title).not.toMatch(/4,250/);
    expect(document.querySelector("form")).toBeNull();
  });

  it("opens a passage in the Berean, one at a time, with a link to read it in context", async () => {
    serveBerean();
    renderPage();
    const malachi = screen.getByText("Malachi 3:10").closest("button")!;
    fireEvent.click(malachi);
    expect(malachi).toHaveAttribute("aria-expanded", "true");
    const row = malachi.closest("li")!;
    await waitFor(() => expect(row.querySelector("blockquote")).toHaveTextContent("Bring the full tithe into the storehouse"));
    expect(within(row).getByRole("link", { name: "Read Malachi 3:10 in context" })).toHaveAttribute("href", "/read/bsb/MAL/3?hl=10-10");
    const mark = screen.getByText("Mark 12:43–44").closest("button")!;
    fireEvent.click(mark);
    expect(malachi).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(mark.closest("li")!.querySelector("blockquote")).toHaveTextContent("this poor widow has put more than all the others"));
  });

  it("offers Retry when a passage does not load", async () => {
    serveBerean({ fail: true });
    renderPage();
    fireEvent.click(screen.getByText("2 Corinthians 9:7").closest("button")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("The verse did not load.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read 2 Corinthians 9:7 in context" })).toBeInTheDocument();
  });

  it("is live on the tools hub at its own address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "tithe-calculator");
    expect(entry).toMatchObject({ status: "live", path: "/tithe-calculator", category: "family" });
  });
});
