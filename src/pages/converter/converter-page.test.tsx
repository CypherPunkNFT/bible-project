// The /converter page (design section 2 and its review): it converts as the reader types, keeps the conversion in the
// address, switches kinds, prices money at the reader's wage, opens an example with its Berean verse (and Retry when
// the verse fails to load), lists every unit with its source, and sends mistyped addresses home.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import ConverterPage from "./ConverterPage";
import { BIBLE_UNITS } from "./units";

let shown = "";
function Where() {
  const { pathname, search } = useLocation();
  shown = pathname + search;
  return null;
}

function renderAt(path: string) {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <Where />
        <main id="main"><Routes><Route path="/converter/*" element={<ConverterPage />} /></Routes></main>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const answer = () => document.querySelector(".cv-answer")?.textContent ?? "";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("converter page", () => {
  it("opens on one cubit and converts as the reader types, keeping it in the address", () => {
    renderAt("/converter");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Biblical converter");
    expect(answer()).toMatch(/1 cubit.*45\.7 cm.*18 in/);
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "300" } });
    expect(answer()).toMatch(/300 cubits.*137 m.*450 ft/);
    expect(shown).toBe("/converter?kind=length&unit=cubit&amount=300");
    expect(screen.getByRole("table", { name: "The same amount in every unit" })).toHaveTextContent(/Measuring reed\s*42\.9/);
  });

  it("says what to type when the amount is not a number, and keeps the last good answer", () => {
    renderAt("/converter?kind=length&unit=cubit&amount=30");
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "thirty" } });
    expect(screen.getByLabelText("Amount")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Type a number, such as 300 or 6.5.")).toBeInTheDocument();
    expect(answer()).toMatch(/30 cubits/);
  });

  it("converts from today's units too, and switches kinds", () => {
    renderAt("/converter?kind=length&unit=mi&amount=1");
    expect(within(screen.getByRole("table", { name: "The same amount in every unit" })).getByRole("row", { name: /Stadion/ })).toHaveTextContent("8.7");
    fireEvent.click(screen.getByRole("button", { name: "Weight" }));
    expect(screen.getByRole("button", { name: "Weight" })).toHaveAttribute("aria-pressed", "true");
    expect(shown).toBe("/converter?kind=weight&unit=shekel&amount=1");
    expect(answer()).toMatch(/1 shekel.*11\.4 g/);
  });

  it("prices money as work and in dollars at the reader's own wage, which stays out of the address", () => {
    renderAt("/converter?kind=money&unit=talent-coin&amount=1");
    expect(answer()).toMatch(/1 talent.*20 years.*\$720,000/);
    expect(screen.getByText("Scholarly estimate", { selector: ".cv-about .cv-sure" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("A day's wage today, in US dollars"), { target: { value: "200" } });
    expect(answer()).toMatch(/\$1,200,000|\$1\.2M/);
    expect(shown).toBe("/converter?kind=money&unit=talent-coin&amount=1");
  });

  it("opens an example with its sizes and its verse in the Berean", async () => {
    serveBerean();
    renderAt("/converter");
    fireEvent.click(screen.getByRole("button", { name: "How big was Noah's ark?" }));
    expect(shown).toBe("/converter?example=noahs-ark");
    const row = screen.getByRole("button", { name: "How big was Noah's ark?" }).closest("li")!;
    expect(row).toHaveTextContent(/Length\s*300 cubits ≈ 137 m · 450 ft/);
    expect(within(row).getByRole("link", { name: "300 cubits" })).toHaveAttribute("href", "/converter?kind=length&unit=cubit&amount=300&example=noahs-ark#convert");
    await waitFor(() => expect(row.querySelector("blockquote")).toHaveTextContent("The ark is to be 300 cubits long"));
    expect(within(row).getByRole("link", { name: "Read Genesis 6:15 in context" })).toHaveAttribute("href", "/read/bsb/GEN/6?hl=15-15");
  });

  it("offers Retry when an example's verse does not load", async () => {
    serveBerean({ fail: true });
    renderAt("/converter?example=thirty-pieces");
    expect(await screen.findByRole("alert")).toHaveTextContent("The verse did not load.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText(/counting each piece as a shekel is an estimate/)).toBeInTheDocument();
  });

  it("lists every unit with its source, and the measures with no fixed size", () => {
    renderAt("/converter");
    // Row headings read straight from the tables: a role query per unit is too slow beside the whole suite.
    const named = [...document.querySelectorAll(".cv-units tbody th a")].map((link) => link.textContent);
    expect(named).toEqual(BIBLE_UNITS.map((unit) => unit.name));
    expect(screen.getAllByText("A cubit is approximately 18 inches or 45.7 centimeters.").length).toBe(2); // the chosen unit, and its table row
    expect(screen.getByText("A stone's throw")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where these numbers come from" })).toBeInTheDocument();
  });

  it("sends a mistyped address home", () => {
    renderAt("/converter/nowhere");
    expect(shown).toBe("/converter");
  });
});
