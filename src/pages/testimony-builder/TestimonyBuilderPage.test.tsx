// The /testimony-builder page (design §3, §7 and §9): the first question with its guidance and example, typing saved
// after the pause and at once on pagehide, the sheet growing section by section, moving between questions and the list,
// the progress sentence, copy (and the box to copy by hand when the clipboard is blocked), the two downloads, Print,
// Save and Open a draft file, Start over, a blocked store, a save that fails, the hero verse and its Retry, and the
// registry entry live in its own category.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import { CATEGORIES, TOOLS, isLive } from "@/pages/tools/registry";
import { QUESTIONS } from "./questions";
import { FILE_KIND, STORAGE_KEY } from "./storage";
import { SAVE_DELAY_MS } from "./useDraft";
import TestimonyBuilderPage from "./TestimonyBuilderPage";

function renderPage() {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={["/testimony-builder"]}>
        <main id="main"><Routes><Route path="/testimony-builder" element={<TestimonyBuilderPage />} /></Routes></main>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
const write = () => screen.getByRole("region", { name: "Write your testimony" });
const sheet = () => screen.getByRole("region", { name: "Your testimony sheet" });
const box = (question = QUESTIONS[0].text) => screen.getByLabelText(question);
const settle = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS + 50); }); };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(new Date(2026, 10, 11, 9, 0));
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Element.prototype.scrollIntoView = vi.fn();
  serveBerean();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("print-sheet-active");
});

describe("writing", () => {
  it("offers Retry when the verse does not load (first, before the verse is cached), and the form still works", async () => {
    vi.useRealTimers();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    serveBerean({ fail: true });
    renderPage();
    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    fireEvent.change(box(), { target: { value: "Still writing." } });
    expect(box()).toHaveValue("Still writing.");
  });

  it("opens the first question with its part, place, guidance and example, and nothing saved yet", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Testimony builder");
    expect(within(write()).getByText("Question 1 of 18")).toBeInTheDocument();
    expect(within(write()).getAllByText("Before Christ").length).toBeGreaterThan(0);
    expect(box()).toBeInTheDocument();
    expect(within(write()).getByText(QUESTIONS[0].guidance[0])).toBeInTheDocument();
    expect(within(write()).getByText(QUESTIONS[0].example![0])).toBeInTheDocument();
    expect(within(write()).getByText("0 of 18 answered")).toBeInTheDocument();
    expect(saved()).toBeNull();
    expect(within(sheet()).getByText(/Your testimony appears here/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("saves what is typed after a pause and shows it on the sheet under its heading", async () => {
    renderPage();
    fireEvent.change(box(), { target: { value: "I grew up by the river.\n\nWe never went to church." } });
    expect(saved()).toBeNull();
    await settle();
    expect(saved()).toMatchObject({ v: 1, answers: { began: "I grew up by the river.\n\nWe never went to church." } });
    expect(within(write()).getByText("1 of 18 answered")).toBeInTheDocument();
    const preview = sheet();
    expect(within(preview).getByRole("heading", { level: 3, name: "My testimony" })).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { level: 4, name: "Where I began" })).toBeInTheDocument();
    expect(within(preview).getByText("I grew up by the river.").closest("p")).toHaveAttribute("translate", "no");
    expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled();
  });

  it("saves at once when the tab is hidden, before the pause ends", async () => {
    renderPage();
    fireEvent.change(box(), { target: { value: "Quick." } });
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    expect(saved()).toMatchObject({ answers: { began: "Quick." } });
  });

  it("moves with Next and Previous and the list, remembers the open question in this tab, and ends at the sheet", async () => {
    renderPage();
    fireEvent.click(within(write()).getByRole("button", { name: "Next" }));
    expect(within(write()).getByText("Question 2 of 18")).toBeInTheDocument();
    expect(box(QUESTIONS[1].text)).toBeInTheDocument();
    expect(sessionStorage.getItem("bp-testimony-builder-open")).toBe(QUESTIONS[1].id);
    expect(document.activeElement?.textContent).toBe(QUESTIONS[1].text);
    fireEvent.click(within(write()).getByRole("button", { name: "Previous" }));
    expect(within(write()).getByText("Question 1 of 18")).toBeInTheDocument();
    const list = screen.getByRole("navigation", { name: "Questions" });
    fireEvent.click(within(list).getByRole("button", { name: "When it happened" }));
    expect(within(write()).getByText("Question 18 of 18")).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: "When it happened" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByLabelText("When did it happen?")).toHaveAttribute("maxlength", "80");
    expect(within(write()).queryByRole("button", { name: "Next" })).toBeNull();
    fireEvent.click(within(write()).getByRole("button", { name: "Read your testimony" }));
    expect(document.activeElement?.id).toBe("sheet-title");
  });

  it("marks answered questions in the list, in their name too, and comes back to the saved draft", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: { scene: "In my car.", title: "The Parking Lot", name: "Lucas" } }));
    sessionStorage.setItem("bp-testimony-builder-open", "scene");
    renderPage();
    expect(within(write()).getByText("Question 5 of 18")).toBeInTheDocument();
    expect(box(QUESTIONS[4].text)).toHaveValue("In my car.");
    const list = screen.getByRole("navigation", { name: "Questions" });
    expect(within(list).getByRole("button", { name: /^The day everything changed ?, answered$/ })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: "Where I began" })).toBeInTheDocument();
    expect(within(write()).getByText("3 of 18 answered")).toBeInTheDocument();
    expect(within(sheet()).getByRole("heading", { level: 3, name: "The Parking Lot" })).toBeInTheDocument();
    expect(within(sheet()).getByText("Lucas")).toBeInTheDocument();
  });

  it("shows the counter near the limit", () => {
    renderPage();
    fireEvent.change(box(), { target: { value: "x".repeat(3990) } });
    expect(within(write()).getByText("10 characters left")).toBeInTheDocument();
  });

  it("makes a draft from a newer version read-only", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 9, answers: { began: "Future." } }));
    renderPage();
    expect(box()).toHaveAttribute("readonly");
    expect(screen.getByText(/saved by a newer version/)).toBeInTheDocument();
  });

  it("says when the browser will not save, and when a save fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderPage();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    fireEvent.change(box(), { target: { value: "Lost?" } });
    await settle();
    expect(screen.getByText(/could not be saved in this browser/)).toBeInTheDocument();
    setItem.mockRestore();
    fireEvent.change(box(), { target: { value: "Lost? No." } });
    await settle();
    expect(screen.queryByText(/could not be saved in this browser/)).toBeNull();
    expect(saved()).toMatchObject({ answers: { began: "Lost? No." } });
    expect(warn).toHaveBeenCalled();
  });

  it("works for the visit when storage is blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    renderPage();
    expect(screen.getAllByText(/not letting the page save/).length).toBeGreaterThan(0);
    fireEvent.change(box(), { target: { value: "Still here." } });
    expect(box()).toHaveValue("Still here.");
  });
});

describe("the sheet's actions", () => {
  const draft = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: { scene: "In my car.", now: "At peace.", title: "The Parking Lot" } }));

  it("copies the text, and shows it to copy by hand when the clipboard is blocked", async () => {
    draft();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderPage();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy" })); });
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied.startsWith("The Parking Lot\n\nTHE DAY EVERYTHING CHANGED\n\nIn my car.\n\nMY LIFE NOW\n\nAt peace.\n")).toBe(true);
    expect(copied).toContain("Written with Bible Guide, bibleguide.io, on ");
    expect(screen.getByText(/^Copied\./)).toBeInTheDocument();
    cleanup();
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });
    renderPage();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy" })); });
    expect(screen.getByText(/blocked copying/)).toBeInTheDocument();
    expect(screen.getByLabelText("Your testimony as text")).toHaveValue(copied);
  });

  it("downloads the text and the web page, named by the date", () => {
    draft();
    const blobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return "blob:testimony"; });
    vi.stubGlobal("URL", Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "download", "set").mockImplementation(function (this: HTMLAnchorElement, name: string) { names.push(name); });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Download as text" }));
    fireEvent.click(screen.getByRole("button", { name: "Download as a web page" }));
    expect(click).toHaveBeenCalledTimes(2);
    expect(names).toEqual(["my-testimony-2026-11-11.txt", "my-testimony-2026-11-11.html"]);
    expect(blobs.map((blob) => blob.type)).toEqual(["text/plain;charset=utf-8", "text/html;charset=utf-8"]);
    expect(screen.getByText(/Saved as a web page/)).toBeInTheDocument();
  });

  it("prints the sheet from the portal with the page's marker", () => {
    draft();
    const print = vi.fn();
    vi.stubGlobal("print", print);
    window.print = print;
    renderPage();
    const button = screen.getByRole("button", { name: /Print|Waiting for the fonts/ });
    expect(button).toHaveTextContent("Print");
    fireEvent.click(button);
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains("print-sheet-active")).toBe(true);
    const portal = document.querySelector(".print-sheet-portal")!;
    expect(within(portal as HTMLElement).getByRole("heading", { level: 1, hidden: true })).toHaveTextContent("The Parking Lot");
    expect(document.getElementById("print-sheet-page")?.textContent).toMatch(/@page \{ size: .*; margin: 18mm; \}/);
  });
});

describe("keeping the draft", () => {
  it("saves a draft file with the answers only", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: { began: "Home." } }));
    const blobs: Blob[] = [];
    vi.stubGlobal("URL", Object.assign(Object.create(URL), { createObjectURL: vi.fn((blob: Blob) => { blobs.push(blob); return "blob:draft"; }), revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Save a draft" }));
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toBe("application/json");
    expect(screen.getByText(/saved as a file in your downloads/)).toBeInTheDocument();
  });

  it("opens a draft file, replacing the draft after asking, and refuses a file that is not one", async () => {
    vi.useRealTimers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: { began: "Old." } }));
    renderPage();
    const input = screen.getByLabelText("Choose a draft file");
    const good = new File([JSON.stringify({ kind: FILE_KIND, v: 1, answers: { scene: "From the file.", bogus: "x" } })], "draft.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [good] } });
    await waitFor(() => expect(screen.getByText(/opened from the file/)).toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(saved()).toMatchObject({ answers: { scene: "From the file." } });
    expect(saved().answers.began).toBeUndefined();
    expect(within(sheet()).getByText("From the file.")).toBeInTheDocument();
    const bad = new File(["{\"kind\":\"other\"}"], "other.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [bad] } });
    await waitFor(() => expect(screen.getByText(/not a draft from this page/)).toBeInTheDocument());
    expect(saved()).toMatchObject({ answers: { scene: "From the file." } });
  });

  it("starts over after asking, and goes back to the first question", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: { scene: "In my car." } }));
    sessionStorage.setItem("bp-testimony-builder-open", "scene");
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(within(write()).getByText("Question 1 of 18")).toBeInTheDocument();
    expect(within(write()).getByText("0 of 18 answered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("follows another tab's save, except the answer being written here", async () => {
    renderPage();
    fireEvent.change(box(), { target: { value: "Mine, unsaved." } });
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify({ v: 1, answers: { began: "Theirs.", now: "Their now." } }) }));
    });
    expect(box()).toHaveValue("Mine, unsaved.");
    expect(within(write()).getByText("2 of 18 answered")).toBeInTheDocument();
    expect(screen.getByText(/changed in another tab/)).toBeInTheDocument();
    await settle();
    expect(saved()).toMatchObject({ answers: { began: "Mine, unsaved.", now: "Their now." } });
  });
});

describe("the hero and the hub", () => {
  it("loads Mark 5:19 from the Berean and links to the reader", async () => {
    vi.useRealTimers();
    renderPage();
    const verse = await screen.findByText(/Go home to your own people/);
    expect(verse.closest("blockquote")).toHaveAttribute("lang", "en");
    expect(screen.getByRole("link", { name: "Read Mark 5:19 in context" })).toHaveAttribute("href", "/read/bsb/MRK/5?hl=19-19");
  });

  it("is live on the tools hub in its own category", () => {
    const tool = TOOLS.find((entry) => entry.slug === "testimony-builder")!;
    expect(isLive(tool) && tool.path).toBe("/testimony-builder");
    expect(tool.category).toBe("witness");
    expect(CATEGORIES.find((category) => category.key === "witness")?.title).toBe("Your story of faith");
    expect(tool.art.tone).toBe("acts");
  });
});
