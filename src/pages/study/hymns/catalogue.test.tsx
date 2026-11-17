// The hymns card catalogue (05) follows the owner's scroll rule (2026-11-17): every match is in the grid, drawn a window
// of rows at a time, with no "Load more". jsdom has no layout, so only the opening rows are drawn here.
import { existsSync, readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { HymnCollection } from "@/lib/hymns";
import { Cards } from "./Catalogue";

const built = existsSync("data/hymns/collection.json");

afterEach(cleanup);

describe.runIf(built)("the hymns card catalogue", () => {
  const collection = built ? JSON.parse(readFileSync("data/hymns/collection.json", "utf8")) as HymnCollection : null;
  const renderCards = () => render(<MemoryRouter><Cards collection={collection!} /></MemoryRouter>);

  it("draws the opening rows of every hymn with no load-more button", () => {
    const { container } = renderCards();
    const cards = container.querySelectorAll(".pc-card");
    expect(cards.length).toBeGreaterThanOrEqual(20);
    expect(cards.length).toBeLessThan(collection!.hymns.length);
    expect([...cards].every((card) => card.hasAttribute("data-row"))).toBe(true);
    expect(screen.queryByRole("button", { name: /load more|show more/i })).toBeNull();
  });

  it("still says when nothing matches", () => {
    renderCards();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search hymns" }), { target: { value: "zzzz no such hymn" } });
    expect(screen.getByText("No hymn matches these filters.")).toBeInTheDocument();
  });
});
