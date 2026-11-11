import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TOOLS, isLive } from "@/pages/tools/registry";
import { renderAt, seen, serveBerean, stat } from "./test-kit";
import { WORD_COUNTER_PATH } from "./WordCounterPage";

const SLOW = 30000; // the whole Bible is read from disk for each count

afterEach(() => vi.unstubAllGlobals());

describe("Bible word counter", () => {
  it("counts a shared search on arrival and links its verse to the reader", async () => {
    serveBerean();
    renderAt("/word-counter?q=Jesus%20wept");
    const link = await screen.findByRole("link", { name: "John 11:35" }, { timeout: 15000 });
    expect(link).toHaveAttribute("href", "/read/bsb/JHN/11?hl=35");
    expect(stat("Times")).toBe("1");
    expect(stat("Verses")).toBe("1");
    expect(stat("Old Testament")).toBe("0");
    expect(stat("New Testament")).toBe("1");
    expect(within(link.closest("li")!).getByText("Jesus wept", { selector: "mark" })).toBeInTheDocument();
  }, SLOW);

  it("counts from the form, puts the search in the address, and breaks it down by book", async () => {
    serveBerean();
    renderAt("/word-counter");
    fireEvent.change(screen.getByRole("searchbox", { name: "Word or phrase" }), { target: { value: "Gethsemane" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Match capital letters/ }));
    fireEvent.click(screen.getByRole("button", { name: "Count" }));
    await screen.findByRole("heading", { name: "Gethsemane" }, { timeout: 15000 });
    expect(seen.address).toBe("/word-counter?q=Gethsemane&case=1");
    const books = screen.getByRole("list", { name: "Times in each book" });
    expect(within(books).getAllByRole("listitem")).toHaveLength(66);
    const withIt = within(books).getAllByRole("button");
    expect(withIt.map((button) => button.querySelector(".wc-book-name")?.textContent)).toEqual(["Matthew", "Mark"]);
    fireEvent.click(withIt[1]);
    expect(screen.getByRole("heading", { level: 3, name: "Mark" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Mark 14:32$/ })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /^Matthew/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show every book" }));
    expect(screen.getByRole("link", { name: "Matthew 26:36" })).toBeInTheDocument();
  }, SLOW);

  it("runs an example, and says plainly when a word is not there", async () => {
    serveBerean();
    renderAt("/word-counter?q=xylophone");
    expect(await screen.findByText(/Not found in the Berean Standard Bible/, {}, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Times in each book" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "grace" }));
    expect(await screen.findByRole("heading", { name: "grace" })).toBeInTheDocument();
    expect(Number(stat("Times")?.replace(/\D/g, ""))).toBeGreaterThan(100);
    expect(seen.address).toBe("/word-counter?q=grace");
  }, SLOW);

  it("draws a long list a window at a time", async () => {
    serveBerean();
    renderAt("/word-counter?q=the");
    await screen.findByRole("heading", { name: "the" }, { timeout: 15000 });
    const verses = Number(stat("Verses")?.replace(/\D/g, ""));
    expect(verses).toBeGreaterThan(20000);
    const list = screen.getByRole("heading", { level: 3, name: "Every verse" }).closest("section")!.querySelector("ol")!;
    expect(list.children.length).toBeGreaterThan(0);
    expect(list.children.length).toBeLessThan(200);
  }, SLOW);

  it("is live on the tools hub at its own address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "word-counter");
    expect(entry && isLive(entry) && entry.path).toBe(WORD_COUNTER_PATH);
  }, SLOW);
});
