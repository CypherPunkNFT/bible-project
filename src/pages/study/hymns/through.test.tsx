// Hymns through the Bible (02): a book's hymns follow the owner's scroll rule (2026-11-17). Psalms alone holds hundreds,
// so the list is drawn a window of rows at a time, chapter headings included. jsdom has no layout: only the opening rows.
import { existsSync, readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { bookIndexOf, type HymnCollection } from "@/lib/hymns";
import { Through } from "./Through";

const built = existsSync("data/hymns/collection.json");

afterEach(cleanup);

describe.runIf(built)("hymns through the Bible", () => {
  const collection = built ? JSON.parse(readFileSync("data/hymns/collection.json", "utf8")) as HymnCollection : null;

  it("draws a window of the opening book's hymns, not every one", () => {
    const { container } = render(<MemoryRouter><Through collection={collection!} /></MemoryRouter>);
    const title = container.querySelector(".thr-book h3")?.textContent;
    const b = collection!.books.findIndex((book) => book.name === title);
    const onBook = collection!.hymns.filter((h) => h.v && bookIndexOf(h.v) === b).length;
    expect(onBook).toBeGreaterThan(100);
    const lines = [...container.querySelectorAll(".thr-list > li")];
    expect(lines.length).toBe(20);
    expect(lines.every((li) => li.hasAttribute("data-row"))).toBe(true);
    expect(lines[0].classList.contains("thr-chapter")).toBe(true);
    expect(lines[0].hasAttribute("data-sticky")).toBe(true);
    expect(container.querySelectorAll(".thr-item").length).toBeLessThan(onBook);
  });
});
