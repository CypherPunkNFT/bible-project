// Teachers through the Bible: the book panel follows the owner's scroll rule (2026-11-17). Psalms holds 580 works on
// 128 chapters, so the list is drawn a window of rows at a time, chapter headings included. jsdom has no layout: only
// the opening rows (useRowWindow's first 20) are drawn.
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { Book, PassageWork, Person } from "@/data/teachers/pages-types";
import { BookPanel } from "./BookPanel";
import type { Track } from "./model";

afterEach(cleanup);

const books = [{ name: "Psalms", code: "PSA", section: "poetry" }] as unknown as Book[];
const person = { id: "watts", short: "Watts", born: 1674 } as unknown as Person;
// 300 works, three on each of 100 psalms: 400 lines with the chapter headings.
const works = Array.from({ length: 300 }, (_, i): PassageWork => ({ v: 1e6 + (Math.floor(i / 3) + 1) * 1e3 + 1, t: `Work ${i}`, r: `Psalm ${Math.floor(i / 3) + 1}`, g: "sermon", d: null, u: null }) as unknown as PassageWork);
const track = { id: "watts", person, byBook: [works.map((work) => ({ work, person }))], totals: [300], urls: new Map(), inLife: () => true } as unknown as Track;

describe("the Teachers through the Bible book panel", () => {
  it("draws a window of the book's works and headings, not every one, with no button", () => {
    const { container } = render(<MemoryRouter><BookPanel books={books} track={track} byId={new Map()} timeline={null} year={Infinity} selected={0} order="text" onOrder={() => {}} /></MemoryRouter>);
    const lines = [...container.querySelectorAll(".thr-rows > li")];
    expect(lines.length).toBe(20);
    expect(lines.every((li) => li.hasAttribute("data-row"))).toBe(true);
    expect(lines[0].textContent).toBe("Psalm 1");
    expect(lines[0].hasAttribute("data-sticky")).toBe(true);
    expect(container.querySelectorAll(".thr-item").length).toBeLessThan(300);
    expect(container.querySelector(".thr-rows button")).toBeNull();
  });

  it("still says when the book has no works", () => {
    const empty = { ...track, byBook: [[]], totals: [0] } as unknown as Track;
    const { container } = render(<MemoryRouter><BookPanel books={books} track={empty} byId={new Map()} timeline={null} year={Infinity} selected={0} order="text" onOrder={() => {}} /></MemoryRouter>);
    expect(container.querySelector(".thr-empty")?.textContent).toBe("No works on Psalms by Watts in the library yet.");
  });
});
