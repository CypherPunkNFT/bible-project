// The /scripture-memory page (design §6 and §9): choosing a verse by typing or a starter, refusals, the step a day with
// fading words and peeking, the list, export and import, a failed load and Try again, nothing sent but the Berean's
// files, and its live entry on the tools hub.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import { TOOLS } from "@/pages/tools/registry";
import { readFileText } from "./files";
import { FILE_KIND, STORAGE_KEY } from "./storage";
import ScriptureMemoryPage from "./ScriptureMemoryPage";

function renderPage() {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={["/scripture-memory"]}>
        <main id="main"><Routes><Route path="/scripture-memory" element={<ScriptureMemoryPage />} /></Routes></main>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const practise = () => screen.getByRole("region", { name: "Practise" });
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
const gaps = () => within(screen.getByTestId("sm-verse")).queryAllByRole("button");

async function addTyped(reference: string) {
  fireEvent.change(screen.getByLabelText("Reference"), { target: { value: reference } });
  fireEvent.click(screen.getByRole("button", { name: "Add and practise" }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 9, 0));
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("scripture memory page", () => {
  it("adds a typed verse and shows every word on step 1", async () => {
    const fetchMock = serveBerean();
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Scripture memory helper");
    await addTyped("jn 3:16");
    expect(await within(practise()).findByRole("heading", { name: "John 3:16" })).toBeInTheDocument();
    expect(await screen.findByTestId("sm-verse")).toHaveTextContent(/^For God so loved the world/);
    expect(gaps()).toHaveLength(0);
    expect(within(practise()).getByText("Step 1 of 6")).toBeInTheDocument();
    expect(saved()).toMatchObject({ v: 1, verses: [{ from: 43003016, to: 43003016, stage: 0, last: 0 }] });
    expect(screen.getByLabelText("Reference")).toHaveValue("");
    for (const [url] of fetchMock.mock.calls) expect(String(url)).toMatch(/^\/data\/plain\/bsb\/[A-Z0-9]+\.json/);
  });

  it("refuses what it cannot learn, with a sentence", async () => {
    serveBerean();
    renderPage();
    await addTyped("Psalm 23");
    expect(screen.getByText("Choose one verse, or a few verses in one chapter, such as Psalm 23:1-3.")).toBeInTheDocument();
    expect(screen.getByLabelText("Reference")).toHaveAttribute("aria-invalid", "true");
    await addTyped("John 3:99");
    expect(await screen.findByText("The Berean Standard Bible has no verse John 3:99.")).toBeInTheDocument();
    await addTyped("<img src=x onerror=alert(1)> 3:16");
    expect(document.querySelector("img[src='x']")).toBeNull();
    expect(saved()).toBeNull();
  });

  it("takes one step a day, fades words, and lets a gap be peeked at without losing focus", async () => {
    serveBerean();
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "John 3:16" }));
    await screen.findByTestId("sm-verse");
    fireEvent.click(screen.getByRole("button", { name: "I said it today" }));
    expect(screen.getByText("Today's step is done. Come back tomorrow for the next one.")).toBeInTheDocument();
    expect(within(practise()).getByText("Step 2 of 6")).toBeInTheDocument();
    expect(gaps().length).toBeGreaterThan(0);
    expect(gaps().every((gap) => gap.getAttribute("aria-label") === "Hidden word, show")).toBe(true);
    expect(gaps().filter((gap) => gap.tabIndex === 0)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "I said it today" }));
    expect(screen.getAllByText("Done for today. One step per calendar day: come back tomorrow for the next one.").length).toBeGreaterThan(0);
    expect(saved().verses[0].stage).toBe(1);

    const first = gaps()[0];
    first.focus();
    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first.getAttribute("aria-label")).not.toBe("Hidden word, show");
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toBe(gaps()[1]);

    vi.setSystemTime(new Date(2026, 10, 10, 0, 1));
    const before = gaps().length;
    fireEvent.click(screen.getByRole("button", { name: "I said it today" }));
    expect(within(practise()).getByText("Step 3 of 6")).toBeInTheDocument();
    expect(gaps().length).toBeGreaterThan(before);
    expect(saved().verses[0]).toMatchObject({ stage: 2 });
  });

  it("lists verses newest first and opens one from the list", async () => {
    serveBerean();
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "John 3:16" }));
    await within(practise()).findByRole("heading", { name: "John 3:16" });
    fireEvent.click(screen.getByRole("button", { name: "Psalms 23:1" }));
    await within(practise()).findByRole("heading", { name: "Psalms 23:1" });
    const list = screen.getByRole("region", { name: "My verses" });
    expect(within(list).getByText("2 verses in your list.")).toBeInTheDocument();
    const rows = within(list).getAllByRole("listitem").filter((row) => row.classList.contains("sm-row"));
    expect(rows.map((row) => row.querySelector(".sm-row-ref")?.textContent)).toEqual(["Psalms 23:1", "John 3:16"]);
    fireEvent.click(within(rows[1]).getByRole("button"));
    expect(await within(practise()).findByRole("heading", { name: "John 3:16" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "John 3:16" }));
    expect(screen.getByText("That verse is already in your list, so it is open below.")).toBeInTheDocument();
    expect(saved().verses).toHaveLength(2);
  });

  it("exports the list as a file and imports one back, merged", async () => {
    serveBerean();
    let blob: Blob | null = null;
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn((value: Blob) => { blob = value; return "blob:x"; }), revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "John 3:16" }));
    await screen.findByTestId("sm-verse");
    fireEvent.click(screen.getByRole("button", { name: "Export my verses" }));
    expect(click).toHaveBeenCalled();
    const exported = JSON.parse(await readFileText(blob!));
    expect(exported).toMatchObject({ kind: FILE_KIND, v: 1, exported: "2026-11-09", verses: [{ from: 43003016, stage: 0 }] });

    const file = new File([JSON.stringify({ kind: FILE_KIND, v: 1, verses: [
      { from: 43003016, to: 43003016, stage: 3, added: 20_000, last: 20_000 },
      { from: 19023001, to: 19023001, stage: 1, added: 20_000, last: 0 },
      { from: "bad" },
    ] })], "verses.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Choose an export file"), { target: { files: [file] } });
    expect(await screen.findByText("Added 1 verse.")).toBeInTheDocument();
    expect(screen.getByText("1 verse was further along in the file and was updated.")).toBeInTheDocument();
    expect(screen.getByText("1 entry could not be read and was skipped.")).toBeInTheDocument();
    expect(saved().verses.map((verse: { from: number; stage: number }) => [verse.from, verse.stage])).toEqual([[43003016, 3], [19023001, 1]]);

    fireEvent.change(screen.getByLabelText("Choose an export file"), { target: { files: [new File(["not json"], "x.json")] } });
    expect(await screen.findByText("That file is not an export from this page, so nothing was changed.")).toBeInTheDocument();
  });

  it("offers Try again when the Bible file cannot load, and does not add the verse", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    serveBerean({ fail: true });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Isaiah 40:31" }));
    expect(await screen.findByText(/This verse couldn't load/)).toBeInTheDocument();
    expect(saved()).toBeNull();
    vi.unstubAllGlobals();
    serveBerean();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await within(practise()).findByRole("heading", { name: "Isaiah 40:31" })).toBeInTheDocument();
  });

  it("removes a verse and clears the list", async () => {
    serveBerean();
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "John 3:16" }));
    await screen.findByTestId("sm-verse");
    fireEvent.click(screen.getByRole("button", { name: "Remove from my verses" }));
    expect(saved().verses).toHaveLength(0);
    expect(screen.getByText("Removed from your list.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Psalms 23:1" }));
    await waitFor(() => expect(saved().verses).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByText("No verses yet. Choose one above to start.")).toBeInTheDocument();
  });

  it("is a live tool on the tools hub", () => {
    expect(TOOLS.find((tool) => tool.slug === "scripture-memory")).toMatchObject({ status: "live", path: "/scripture-memory", category: "study" });
  });
});
