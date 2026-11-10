// The birthday pages (docs/features/birthday-verses/design.md 6, 9.2): the hub and its chooser and "Today", a month, a
// date with its card and message, the forgiving addresses, 29 February, and a chapter that fails to load. The Berean's
// chapter files are served from disk in place of the network.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog, removeFonts } from "@/pages/life-events/test-kit";
import { serveFiles } from "@/pages/verse-cards/test-kit";
import BirthdayVersesPage from "./BirthdayVersesPage";

const seen: string[] = [];
const lastAddress = () => seen[seen.length - 1];

function renderAt(path: string) {
  cleanup();
  seen.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <AddressProbe onSeen={(address) => seen.push(address)} />
        <Routes><Route path="/birthday-verses/*" element={<BirthdayVersesPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

beforeEach(() => { serveFiles(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); removeFonts(); });

describe("birthday verses: the hub", () => {
  it("shows the year as 12 month blocks holding 366 date links, each named with its date and reference", () => {
    renderAt("/birthday-verses");
    expect(screen.getByRole("heading", { level: 1, name: "Birthday Bible Verses: A Verse for Every Day of the Year" })).toBeInTheDocument();
    const blocks = screen.getAllByRole("navigation", { name: /birthday verses$/ });
    expect(blocks).toHaveLength(12);
    const dateLinks = blocks.flatMap((block) => within(block).getAllByRole("listitem"));
    expect(dateLinks).toHaveLength(366);
    expect(screen.getByRole("link", { name: "March 16, John 3:16" })).toHaveAttribute("href", "/birthday-verses/march-16");
    expect(screen.getByRole("link", { name: "March" })).toHaveAttribute("href", "/birthday-verses/march");
    expect(screen.getByRole("link", { name: "More verses for a birthday" })).toHaveAttribute("href", "/occasion-verses?o=birthday");
  });

  it("offers 29 days for February in the chooser, and opens the chosen date", async () => {
    renderAt("/birthday-verses");
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "2" } });
    const days = within(screen.getByLabelText("Day")).getAllByRole("option");
    expect(days).toHaveLength(29);
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "29" } });
    fireEvent.click(screen.getByRole("button", { name: "Show the verse" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Bible Verse for a February 29 Birthday" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/birthday-verses/february-29");
  });

  it("moves the day back when a shorter month is chosen", () => {
    renderAt("/birthday-verses");
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "31" } });
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "4" } });
    expect(screen.getByLabelText("Day")).toHaveValue("30");
  });

  it.each([
    [new Date(2028, 1, 29, 9, 0), "Today, February 29", "/birthday-verses/february-29"],
    [new Date(2026, 11, 31, 23, 50), "Today, December 31", "/birthday-verses/december-31"],
    [new Date(2026, 10, 10, 0, 5), "Today, November 10", "/birthday-verses/november-10"],
  ])("links today's date from the visitor's own clock (%s)", (now, name, href) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    renderAt("/birthday-verses");
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    expect(screen.getByLabelText("Day")).toHaveValue(String(now.getDate()));
  });
});

describe("birthday verses: addresses", () => {
  it.each([
    ["/birthday-verses/mar-16", "/birthday-verses/march-16"],
    ["/birthday-verses/03-16", "/birthday-verses/march-16"],
    ["/birthday-verses/16-march", "/birthday-verses/march-16"],
    ["/birthday-verses/March16", "/birthday-verses/march-16"],
    ["/birthday-verses/Mar", "/birthday-verses/march"],
    ["/birthday-verses/12", "/birthday-verses/december"],
  ])("opens %s at its official address", async (from, to) => {
    renderAt(from);
    await waitFor(() => expect(lastAddress()).toBe(to));
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it.each(["/birthday-verses/february-30", "/birthday-verses/march-32", "/birthday-verses/smarch-1", "/birthday-verses/march-16/extra"])("opens the hub with a note for %s", (path) => {
    renderAt(path);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't find that date.");
    expect(screen.getByRole("heading", { level: 1, name: /A Verse for Every Day of the Year/ })).toBeInTheDocument();
  });
});

describe("birthday verses: a month", () => {
  it("lists each date with its reference and note, and the months around it", () => {
    renderAt("/birthday-verses/march");
    expect(screen.getByRole("heading", { level: 1, name: "March Birthday Bible Verses" })).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(31);
    expect(within(rows[15]).getByRole("link", { name: "March 16" })).toHaveAttribute("href", "/birthday-verses/march-16");
    expect(rows[15]).toHaveTextContent("John 3:16");
    expect(screen.getByRole("link", { name: "Previous month: February" })).toHaveAttribute("href", "/birthday-verses/february");
    expect(screen.getByRole("link", { name: "Next month: April" })).toHaveAttribute("href", "/birthday-verses/april");
  });
});

describe("birthday verses: a date", () => {
  it("shows the heading, the lead line, the verse, where its number comes from, its place, the card and the dates around it", async () => {
    renderAt("/birthday-verses/march-16");
    expect(screen.getByRole("heading", { level: 1, name: "Bible Verse for a March 16 Birthday" })).toBeInTheDocument();
    expect(screen.getByText(/^March 16 · John 3:16: The heart of the gospel/)).toBeInTheDocument();
    expect(await screen.findByText(/For God so loved the world/, { selector: "blockquote" })).toBeInTheDocument();
    expect(screen.getByText("Chapter 3, verse 16: the 3rd month and the 16th day.")).toBeInTheDocument();
    expect(screen.getByText(/The Bible gives no verse to any date/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In its place" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read John 3" })).toHaveAttribute("href", "/read/bsb/JHN/3?hl=16");
    expect(screen.getByRole("heading", { name: "Make a birthday card" })).toBeInTheDocument();
    const cards = await screen.findAllByRole("img");
    expect(cards[0]).toHaveAccessibleName(expect.stringContaining("John 3:16"));
    expect(screen.getByRole("link", { name: "Previous: March 15: Colossians 3:15" })).toHaveAttribute("href", "/birthday-verses/march-15");
    expect(screen.getByRole("link", { name: /^Next: March 17/ })).toHaveAttribute("href", "/birthday-verses/march-17");
    expect(screen.getByRole("link", { name: "All March birthday verses" })).toHaveAttribute("href", "/birthday-verses/march");
    expect(screen.queryByText(/Born on February 29/)).toBeNull();
  });

  it("says when a verse is the date the other way round, or chosen for it", async () => {
    renderAt("/birthday-verses/january-24");
    expect(await screen.findByText("Chapter 24, verse 1: the day and the month of January 24.")).toBeInTheDocument();
    renderAt("/birthday-verses/august-29");
    expect(await screen.findByText(/^No verse numbered for this date fits a birthday card well/)).toBeInTheDocument();
  });

  it("shows a context line only where one is stored", async () => {
    renderAt("/birthday-verses/november-29");
    expect(await screen.findByText(/Jeremiah 29:11/)).toBeInTheDocument();
    renderAt("/birthday-verses/march-16");
    await screen.findByText(/For God so loved the world/, { selector: "blockquote" });
    expect(document.querySelector(".bv-context")).toBeNull();
  });

  it("links 29 February to February 28 and March 1, and both back to it", async () => {
    renderAt("/birthday-verses/february-29");
    expect(screen.getByText(/Born on February 29\? Many celebrate/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "February 28" })).toHaveAttribute("href", "/birthday-verses/february-28");
    expect(screen.getByRole("link", { name: "March 1" })).toHaveAttribute("href", "/birthday-verses/march-1");
    renderAt("/birthday-verses/march-1");
    expect(screen.getByRole("link", { name: "Its verse is here." })).toHaveAttribute("href", "/birthday-verses/february-29");
  });

  it("keeps the heading, reference, note and links when the chapter cannot be loaded, without a card", async () => {
    serveFiles({ fail: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderAt("/birthday-verses/october-1"); // a chapter no other test here has read, so none is held from before
    expect(await screen.findByRole("alert")).toHaveTextContent("The verse could not be loaded.");
    expect(screen.getByRole("link", { name: "Read Numbers 6:24–26 in the reader." })).toHaveAttribute("href", "/read/bsb/NUM/6?hl=24-26");
    expect(screen.getByRole("heading", { level: 1, name: "Bible Verse for an October 1 Birthday" })).toBeInTheDocument();
    expect(screen.getByText(/^October 1 · Numbers 6:24–26: /)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Make a birthday card" })).toBeNull();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getByLabelText("The message")).toHaveValue("Happy birthday! A verse for your day:\n\nNumbers 6:24–26 (BSB)\n\nhttps://bibleguide.io/birthday-verses/october-1");
    expect(screen.getByRole("link", { name: "All October birthday verses" })).toBeInTheDocument();
  });

  it("puts a typed name in the message only, and a card line on the picture only, never in the address", async () => {
    renderAt("/birthday-verses/march-16");
    await screen.findByText(/For God so loved the world/, { selector: "blockquote" });
    const name = screen.getByLabelText("Their name (optional)");
    expect(name).toHaveAttribute("maxLength", "40");
    expect(name).not.toHaveAttribute("name");
    expect(name.closest("form")).toBeNull();
    fireEvent.change(name, { target: { value: "Anna" } });
    const message = (screen.getByLabelText("The message") as HTMLTextAreaElement).value;
    expect(message).toMatch(/^Happy birthday, Anna! A verse for your day:\n\n“For God so loved the world/);
    expect(message.endsWith("\n\nhttps://bibleguide.io/birthday-verses/march-16")).toBe(true);
    expect(screen.getByRole("link", { name: "Email" }).getAttribute("href")).toBe(`mailto:?subject=Happy%20birthday&body=${encodeURIComponent(message)}`);
    fireEvent.change(screen.getByLabelText("Add a line (optional)"), { target: { value: "Love, Sam" } });
    expect((await screen.findAllByRole("img"))[0]).toHaveAccessibleName(expect.stringContaining("Love, Sam"));
    expect(seen.join(" ")).not.toMatch(/Anna|Sam/);
    expect(lastAddress()).toBe("/birthday-verses/march-16");
  });
});
