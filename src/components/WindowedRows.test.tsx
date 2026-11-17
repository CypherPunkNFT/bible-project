// WindowedRows: the site's row window for long lists (owner's scroll rule, 2026-11-17). jsdom has no layout, so the
// window stays at its first rows (useRowWindow's opening 20); these tests check what is drawn there and the end signal.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WindowedRows } from "./WindowedRows";

afterEach(cleanup);

const numbers = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("WindowedRows", () => {
  it("draws the opening rows of a long list, each marked with its row, and no button", () => {
    const { container } = render(<WindowedRows as="ul" items={numbers(500)} itemKey={String} estimate={30}
      renderItem={(n, row) => <li key={n} data-row={row}>{`Item ${n}`}</li>} />);
    const drawn = [...container.querySelectorAll("li")];
    expect(drawn.length).toBe(20);
    expect(drawn[0].textContent).toBe("Item 0");
    expect(drawn.map((li) => li.dataset.row)).toEqual(numbers(20).map(String));
    expect(container.querySelector("button")).toBeNull();
  });

  it("gives a heading item a row of its own", () => {
    const items = ["h:A", "a1", "a2", "h:B", "b1"];
    const { container } = render(<WindowedRows items={items} itemKey={(s) => s} estimate={30} fullRow={(s) => s.startsWith("h:")}
      renderItem={(s, row) => <div key={s} data-row={row}>{s}</div>} />);
    // One column without layout: every item is a row, headings included.
    expect([...container.querySelectorAll("[data-row]")].map((el) => el.getAttribute("data-row"))).toEqual(["0", "1", "2", "3", "4"]);
  });

  it("says when the last row is drawn, and not before", () => {
    const short = vi.fn(), long = vi.fn();
    render(<WindowedRows items={numbers(5)} itemKey={String} estimate={30} onEnd={short} renderItem={(n, row) => <div key={n} data-row={row} />} />);
    render(<WindowedRows items={numbers(500)} itemKey={String} estimate={30} onEnd={long} renderItem={(n, row) => <div key={n} data-row={row} />} />);
    expect(short).toHaveBeenCalled();
    expect(long).not.toHaveBeenCalled();
  });
});
