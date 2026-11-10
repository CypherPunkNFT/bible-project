// The page (docs/features/verse-widget/design.md 10, "The page"): the tools hub entry, today's verse drawn by the real
// script, the builder's choices changing the snippet and the preview, Copy and its fallbacks, and the contrast warning.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOOLS } from "@/pages/tools/registry";
import { day, fakeFetch, resetWidget, runWidget, setVisibility, settle } from "./widget-kit";
import VerseOfTheDayPage from "./VerseOfTheDayPage";

const TODAY = "2026-11-09";
const longest = day("2027-02-16", { text: "A much longer verse than usual, to see how the widget fits a long day in the space a church gives it." });

function renderPage() {
  return render(<MemoryRouter initialEntries={["/verse-of-the-day"]}><VerseOfTheDayPage /></MemoryRouter>);
}

const previewFigure = () => document.querySelector(".vd-preview-box .bibleguide-verse")!.shadowRoot?.querySelector("figure") ?? null;
const code = (label: string) => (screen.getByLabelText(label) as HTMLTextAreaElement).value;
const choice = (group: string, name: string) => within(screen.getByRole("group", { name: group })).getByRole("button", { name });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 12));
  setVisibility("visible");
  fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY), "/widget/v1/pool.json": { v: 1, lastDate: "2029-11-09", next: 0, entries: [{ text: "x.", reference: "John 1:1", read: "/read/bsb/JHN/1?hl=1" }], longest } });
  runWidget();
});

afterEach(() => {
  resetWidget();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("verse of the day page", () => {
  it("is live in the tools hub at /verse-of-the-day", () => {
    const entry = TOOLS.find((tool) => tool.slug === "verse-widget")!;
    expect(entry.status).toBe("live");
    expect(entry.path).toBe("/verse-of-the-day");
  });

  it("shows today's verse through the real widget, then a link to read the chapter", async () => {
    renderPage();
    expect(screen.getAllByText("Today's verse appears here").length).toBeGreaterThan(0);
    await act(settle);
    const today = document.querySelector(".vd-today .bibleguide-verse")!;
    expect(today.shadowRoot!.querySelector("blockquote")!.textContent).toBe("Words standing in for one day's verse in the tests.");
    expect(today.getAttribute("data-style")).toBe("card");
    expect(screen.getByRole("link", { name: "Read the chapter" }).getAttribute("href")).toBe("/read/bsb/GEN/1?hl=1");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible verse of the day");
  });

  it("changes the snippet and the preview as choices change", async () => {
    renderPage();
    await act(settle);
    expect(code("Code to paste into your website").split("\n")[0]).toBe('<div class="bibleguide-verse">');
    expect(previewFigure()!.getAttribute("class")).toBe("plain auto standard site start");
    fireEvent.click(choice("Look", "Card"));
    fireEvent.click(choice("Colours", "Dark"));
    fireEvent.click(choice("Size", "Compact"));
    await act(settle);
    expect(code("Code to paste into your website").split("\n")[0]).toBe('<div class="bibleguide-verse" data-style="card" data-theme="dark" data-size="compact">');
    expect(previewFigure()!.getAttribute("class")).toBe("card dark compact site start");
  });

  it("writes the frame code with its height, and drops the website's font there", async () => {
    renderPage();
    await act(settle);
    fireEvent.click(screen.getByRole("tab", { name: "If your website does not allow scripts" }));
    expect(code("Frame code to paste into your website")).toContain('src="https://bibleguide.io/widget/v1/frame?theme=light"');
    expect(within(screen.getByRole("group", { name: "Font" })).queryByRole("button", { name: "Your website's" })).toBeNull();
    expect(screen.getByText(/Recommended height: \d+ pixels/)).toBeTruthy();
    expect(screen.getByText("On a dark page, choose the Card look.")).toBeTruthy();
    fireEvent.click(choice("Text in the frame", "Light text, for a dark page"));
    expect(code("Frame code to paste into your website")).toContain("frame?theme=dark");
    fireEvent.click(screen.getByRole("tab", { name: "Just a link" }));
    expect(code("Link as plain text")).toBe("Today's Bible verse: https://bibleguide.io/verse-of-the-day");
  });

  it("copies the code and says Copied", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderPage();
    await act(settle);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await act(settle);
    expect(writeText).toHaveBeenCalledWith(code("Code to paste into your website"));
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("selects the code and says how to copy it where copying is refused", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderPage();
    await act(settle);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await act(settle);
    expect(screen.getByText("Press Ctrl+C, or long-press and choose Copy").getAttribute("role")).toBe("status");
    expect(warn).toHaveBeenCalled();
  });

  it("warns about a pale link colour on a light card", async () => {
    renderPage();
    await act(settle);
    fireEvent.click(choice("Look", "Card"));
    fireEvent.click(choice("Colours", "Light"));
    fireEvent.change(screen.getByLabelText("Colour as a hex code"), { target: { value: "#f5dd9c" } });
    expect(screen.getByText("This colour is hard to read on a light card.")).toBeTruthy();
    expect(code("Code to paste into your website")).toContain('data-accent="#f5dd9c"');
    fireEvent.change(screen.getByLabelText("Colour as a hex code"), { target: { value: "#22599f" } });
    expect(screen.queryByText("This colour is hard to read on a light card.")).toBeNull();
  });

  it("shows the longest verse in the preview when asked", async () => {
    renderPage();
    await act(settle);
    fireEvent.click(screen.getByLabelText("Show the longest verse"));
    await act(settle);
    await act(settle);
    expect(previewFigure()!.querySelector("blockquote")!.textContent).toBe(longest.text);
  });
});
