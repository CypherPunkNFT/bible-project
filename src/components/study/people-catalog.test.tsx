// Everyone in the Bible (PeopleCatalog) follows the owner's scroll rule (2026-11-17): the ~3,000 cards are drawn a window
// of rows at a time, each period's band a row of its own (2026-11-19). jsdom has no layout, so only the opening rows are
// drawn here; the scrolling itself is checked in the browser (e2e/study.spec.ts).
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PersonRow } from "@/lib/study";
import { PeopleCatalog } from "./PeopleCatalog";

// The roles are read from the English list once it arrives; here it never does, so they come from these rows.
vi.mock("@/lib/study", async (original) => ({ ...await original<typeof import("@/lib/study")>(), loadEnglishPeople: () => new Promise(() => {}) }));

afterEach(cleanup);

const person = (i: number, p: string): PersonRow => ({ id: `person-${i}`, n: `Person ${i}`, o: [], b: "A king of Judah", c: 1000 - i, p });
const PEOPLE = [...Array.from({ length: 150 }, (_, i) => person(i, "patriarchs")), ...Array.from({ length: 150 }, (_, i) => person(150 + i, "exodus"))];
const renderAt = (address = "/study/people") => render(<MemoryRouter initialEntries={[address]}><PeopleCatalog people={PEOPLE} backLabel="People" /></MemoryRouter>);

describe("the people catalogue", () => {
  it("draws the opening rows, not every card, the period's band a sticky row of its own with its count", () => {
    const { container } = renderAt();
    const rows = [...container.querySelectorAll(".people-catalog-rows > li")];
    expect(rows.length).toBe(20);
    expect(rows.every((li) => li.hasAttribute("data-row"))).toBe(true);
    expect(rows[0].hasAttribute("data-sticky")).toBe(true);
    expect(rows[0].querySelector("h3")?.textContent).toContain("Patriarchs");
    expect(rows[0].querySelector("h3")?.textContent).toContain("150 people");
    expect(container.querySelectorAll(".people-card").length).toBe(19);
    // The first drawn row is a band, so no stand-in is needed.
    expect(container.querySelector(".people-catalog-pin")).toBeNull();
    expect(screen.queryByRole("button", { name: /load more|show more/i })).toBeNull();
  });

  it("keeps search and the period filter, and says when no one matches", () => {
    const { container } = renderAt();
    fireEvent.click(screen.getByRole("button", { name: /^Exodus/ }));
    expect(container.querySelector(".people-catalog-rows h3")?.textContent).toContain("Exodus");
    expect(screen.getByText("150 of 300 people shown")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "Person 151" } });
    expect([...container.querySelectorAll(".people-card strong")].map((el) => el.textContent)).toEqual(["Person 151"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "no such person" } });
    expect(screen.getByText("No one matches.")).toBeInTheDocument();
  });

  it("outlines the card you came back from", () => {
    // jsdom has no scrolling; the arrival brings the catalogue into view.
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, writable: true, value: scrollIntoView });
    const { container } = renderAt("/study/people?person=person-3");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(container.querySelector('[data-person="person-3"]')?.classList.contains("is-last")).toBe(true);
    expect(container.querySelectorAll(".people-card.is-last").length).toBe(1);
  });
});
