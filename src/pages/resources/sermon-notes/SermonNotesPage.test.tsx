// The sermon notes sheet (README.md beside this file): its place on the Resources station, the two sheets, the optional
// title and passage, the paper, printing, and typed words kept out of the address and out of storage.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResourcesPage from "@/pages/ResourcesPage";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { pageRule, PRINT_MARKER } from "@/pages/life-events/print-sheet";
import { removeFonts, standInFonts } from "@/pages/life-events/test-kit";
import { cleanField, MAX_FIELD } from "./fields";
import { SERMON_NOTES_PATH } from "./SermonNotesPage";

const seen: string[] = [];
const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <AddressProbe onSeen={(address) => { seen.push(address); }} />
    <Routes><Route path="/resources/*" element={<ResourcesPage />} /></Routes>
  </MemoryRouter>,
);
const preview = () => document.querySelector(".sn-preview .sn-sheet") as HTMLElement;
const printed = () => document.querySelector(".print-sheet-portal .sn-sheet") as HTMLElement;

async function openPage() {
  removeFonts();
  renderAt(SERMON_NOTES_PATH);
  await screen.findByRole("button", { name: "Print" });
  // The sheet is drawn into its container on <body> one render after the container is made.
  await waitFor(() => expect(printed()).toBeTruthy());
}

beforeEach(() => { seen.length = 0; vi.stubGlobal("print", vi.fn()); });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  removeFonts();
  document.documentElement.classList.remove(PRINT_MARKER);
  localStorage.clear();
  sessionStorage.clear();
});

describe("sermon notes sheet", () => {
  it("is a printable on the Resources station, outside the three doorways", async () => {
    renderAt("/resources");
    const printables = await screen.findByRole("region", { name: "Printables" });
    const link = within(printables).getByRole("link", { name: /Sermon notes sheet/ });
    expect(link.getAttribute("href")).toBe(SERMON_NOTES_PATH);
    expect(within(screen.getByRole("navigation", { name: "Resources" })).queryByRole("link", { name: /Sermon notes/ })).toBeNull();
    fireEvent.click(link);
    expect(await screen.findByRole("heading", { level: 1, name: "Sermon notes" })).toBeInTheDocument();
    expect(seen.at(-1)).toBe(SERMON_NOTES_PATH);
  });

  it("opens on the adults' sheet, with blank lines where the title and passage go", async () => {
    await openPage();
    const sheet = within(printed());
    expect(sheet.getByRole("heading", { name: "Sermon notes", hidden: true })).toBeInTheDocument();
    for (const prompt of ["The main point", "Notes", "Other verses mentioned", "What this shows about God", "How I will respond this week", "Questions to look into", "A prayer in response"]) {
      expect(sheet.getByRole("heading", { name: prompt, hidden: true })).toBeInTheDocument();
    }
    expect(printed().querySelectorAll(".sn-filled")).toHaveLength(0);
    expect(printed().querySelectorAll(".sn-write").length).toBeGreaterThanOrEqual(5);
    expect(printed().querySelector(".sn-draw")).toBeNull();
    expect(printed().textContent).toContain("bibleguide.io/resources/sermon-notes");
  });

  it("switches to the children's sheet: simpler questions and a box to draw in", async () => {
    await openPage();
    fireEvent.click(screen.getByRole("radio", { name: "For children" }));
    for (const sheet of [preview(), printed()]) {
      expect(sheet.dataset.version).toBe("kids");
      expect(within(sheet).getByRole("heading", { name: "My sermon notes", hidden: true })).toBeInTheDocument();
      expect(within(sheet).getByRole("heading", { name: "Draw a picture of what you heard", hidden: true })).toBeInTheDocument();
      expect(within(sheet).getByRole("heading", { name: "One thing I learned about God", hidden: true })).toBeInTheDocument();
      expect(sheet.querySelector(".sn-draw")).not.toBeNull();
      expect(within(sheet).queryByRole("heading", { name: "Questions to look into", hidden: true })).toBeNull();
    }
  });

  it("puts a typed title and passage on both sheets, cleaned and marked not to translate", async () => {
    await openPage();
    fireEvent.change(screen.getByRole("textbox", { name: "Sermon title (optional)" }), { target: { value: "  The Good\u202e Shepherd " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Bible passage (optional)" }), { target: { value: "John 10:1-18" } });
    const filled = () => [...printed().querySelectorAll(".sn-filled")].map((item) => item.textContent);
    expect(filled()).toEqual(["The Good Shepherd", "John 10:1-18"]);
    for (const item of printed().querySelectorAll(".sn-filled")) expect(item.getAttribute("translate")).toBe("no");
    fireEvent.click(screen.getByRole("radio", { name: "For children" }));
    expect(filled()).toEqual(["John 10:1-18", "The Good Shepherd"]);
    expect([...preview().querySelectorAll(".sn-filled")].map((item) => item.textContent)).toEqual(["John 10:1-18", "The Good Shepherd"]);
  });

  it("limits what goes on the sheet", () => {
    expect(cleanField("a".repeat(200))).toHaveLength(MAX_FIELD);
    expect(cleanField("\u0007Psalm\u200e 23\n")).toBe("Psalm 23");
  });

  it("sizes the sheet for the paper chosen", async () => {
    await openPage();
    fireEvent.click(screen.getByRole("radio", { name: "US Letter" }));
    expect(printed().className).toContain("sn-paper-letter");
    expect(printed().style.getPropertyValue("--sheet-height")).toBe("11in");
    fireEvent.click(screen.getByRole("radio", { name: "A4" }));
    expect(printed().className).toContain("sn-paper-a4");
    expect(printed().style.getPropertyValue("--sheet-width")).toBe("210mm");
    expect(preview().className).toContain("sn-paper-a4");
  });

  it("prints one sheet on the chosen paper with no page margin", async () => {
    await openPage();
    fireEvent.click(screen.getByRole("radio", { name: "A4" }));
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(true);
    expect(document.getElementById("print-sheet-page")?.textContent).toBe(pageRule("a4", "0"));
    expect(document.querySelectorAll(".print-sheet-portal .sn-sheet")).toHaveLength(1);
  });

  it("waits for the sheet's fonts before printing", async () => {
    const fonts = standInFonts();
    renderAt(SERMON_NOTES_PATH);
    expect(screen.getByRole("button", { name: "Waiting for the fonts…" })).toBeDisabled();
    fonts.release();
    expect(await screen.findByRole("button", { name: "Print" })).toBeEnabled();
  });

  it("keeps typed words out of the address and out of storage, even when Enter is pressed", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    await openPage();
    const title = screen.getByRole("textbox", { name: "Sermon title (optional)" });
    fireEvent.change(title, { target: { value: "Grace upon grace" } });
    fireEvent.keyDown(title, { key: "Enter" });
    fireEvent.change(screen.getByRole("textbox", { name: "Bible passage (optional)" }), { target: { value: "John 1" } });
    expect(new Set(seen)).toEqual(new Set([SERMON_NOTES_PATH]));
    expect(document.querySelector("form")).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length + sessionStorage.length).toBe(0);
    setItem.mockRestore();
  });

  it("says where to print from in a browser with no print dialog", async () => {
    removeFonts();
    vi.stubGlobal("navigator", { ...navigator, userAgent: "Mozilla/5.0 FBAN/FBIOS" });
    renderAt(SERMON_NOTES_PATH);
    expect(await screen.findByRole("status")).toHaveTextContent("Open this page in your browser to print: https://bibleguide.io/resources/sermon-notes");
    expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
  });
});
