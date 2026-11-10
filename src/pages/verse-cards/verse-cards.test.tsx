import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VersePanel } from "@/components/reader/VersePanel";
import { CatalogContext } from "@/lib/catalog";
import { removeFonts } from "@/pages/life-events/test-kit";
import { readReference } from "./reference";
import { localDate, todayFromDayFile } from "./today";
import { catalog, lastAddress, renderAt, serveFiles } from "./test-kit";

beforeEach(() => { serveFiles(); });
afterEach(() => { vi.unstubAllGlobals(); removeFonts(); });

describe("the card page", () => {
  it("shows the card, the verse and a way into the reader at the verse", async () => {
    renderAt("/verse-cards/john-3-16");
    expect(await screen.findByRole("heading", { level: 1, name: "John 3:16" })).toBeInTheDocument();
    expect(screen.getByText(/For God so loved the world/, { selector: "blockquote" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read John 3" })).toHaveAttribute("href", "/read/bsb/JHN/3?hl=16");
    const cards = await screen.findAllByRole("img");
    expect(cards[0]).toHaveAccessibleName(expect.stringMatching(/^For God so loved the world.*John 3:16$/));
    expect(screen.getByRole("heading", { name: "Make your own card of this verse" })).toBeInTheDocument();
    expect(screen.getByText("Cards are drawn on your device. Nothing you type is sent or saved.")).toBeInTheDocument();
  });

  it("opens in the link's design and puts the design, never the visitor's line, in the address", async () => {
    renderAt("/verse-cards/proverbs-3-5-6?look=night");
    await screen.findByRole("heading", { level: 1, name: "Proverbs 3:5–6" });
    expect(screen.getByRole("button", { name: /Night/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Olive/ }));
    await waitFor(() => expect(lastAddress()).toBe("/verse-cards/proverbs-3-5-6?look=olive"));
    fireEvent.change(screen.getByLabelText("Add a line (optional)"), { target: { value: "Praying for you, Sam" } });
    expect(screen.getAllByRole("img")[1]).toHaveAccessibleName(expect.stringContaining("Praying for you, Sam"));
    expect(lastAddress()).not.toContain("Sam");
    fireEvent.click(screen.getByRole("button", { name: /Paper/ }));
    await waitFor(() => expect(lastAddress()).toBe("/verse-cards/proverbs-3-5-6"));
  });

  it("adds the verse before and after inside the chapter", async () => {
    renderAt("/verse-cards/john-3-16");
    await screen.findByRole("heading", { level: 1, name: "John 3:16" });
    fireEvent.click(screen.getByRole("button", { name: "Add the verse after" }));
    expect(await screen.findByRole("heading", { level: 1, name: "John 3:16–17" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/verse-cards/john-3-16-17");
    fireEvent.click(screen.getByRole("button", { name: "Add the verse before" }));
    expect(await screen.findByRole("heading", { level: 1, name: "John 3:15–17" })).toBeInTheDocument();
  });

  it("stops adding verses at what one card can hold", async () => {
    renderAt("/verse-cards/esther-8-9-10");
    await screen.findByRole("heading", { level: 1, name: "Esther 8:9–10" });
    expect(screen.getByText(/\(the month of Sivan\), they recorded/, { selector: "blockquote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add the verse after" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add the verse before" })).toBeDisabled();
    expect(screen.getByText("That is as much as a card can hold.")).toBeInTheDocument();
  });

  it("opens a too-long link at its first verse, with a note", async () => {
    renderAt("/verse-cards/esther-8-9-12");
    expect(await screen.findByRole("heading", { level: 1, name: "Esther 8:9" })).toBeInTheDocument();
    expect(screen.getByText(/more than one card can hold/)).toBeInTheDocument();
  });

  it("opens the start page for a key that is not a card, and for a verse the Berean leaves out", async () => {
    renderAt("/verse-cards/john-3-16a");
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't find that verse.");
    expect(screen.getByRole("heading", { level: 1, name: "Bible verse cards" })).toBeInTheDocument();
    renderAt("/verse-cards/matthew-17-21");
    expect(await screen.findByText("The Berean Standard Bible has no verse Matthew 17:21.")).toBeInTheDocument();
    renderAt("/verse-cards/john-99-1");
    expect(await screen.findByText(/has no verse John 99:1/)).toBeInTheDocument();
  });

  it("offers to try again when the verse could not be downloaded", async () => {
    serveFiles({ fail: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderAt("/verse-cards/ruth-1-16");
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
    serveFiles();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Ruth 1:16" })).toBeInTheDocument();
  });

  it("keeps Share picture away where the browser cannot share files, and Save, Copy link and Copy text always", async () => {
    renderAt("/verse-cards/john-3-16");
    await screen.findByRole("heading", { level: 1, name: "John 3:16" });
    expect(screen.queryByRole("button", { name: "Share picture" })).not.toBeInTheDocument();
    for (const name of ["Save picture", "Copy link", "Copy text"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByLabelText("Press and hold to copy")).toHaveValue("https://bibleguide.io/verse-cards/john-3-16");
  });
});

describe("the start page", () => {
  it("opens a typed reference as a card, and explains what to type otherwise", async () => {
    renderAt("/verse-cards");
    const box = screen.getByLabelText(/Type a verse/);
    fireEvent.change(box, { target: { value: "ps 23:1-3" } });
    fireEvent.click(screen.getByRole("button", { name: "Make a card" }));
    await waitFor(() => expect(lastAddress()).toBe("/verse-cards/psalm-23-1-3"));
  });

  it("offers today's verse and the six well-known verses", async () => {
    renderAt("/verse-cards");
    const list = screen.getByRole("heading", { name: "Or choose one" }).parentElement!;
    for (const name of ["John 3:16", "Jeremiah 29:11", "Philippians 4:13", "Proverbs 3:5–6", "Isaiah 40:31", "Romans 8:28"]) {
      expect(within(list).getByRole("link", { name })).toHaveAttribute("href", expect.stringMatching(/^\/verse-cards\/[a-z0-9-]+$/));
    }
    expect(await within(list).findByRole("link", { name: /Today's verse/ })).toHaveAttribute("href", "/verse-cards/hebrews-4-12");
  });

  it("reads references the way people type them", () => {
    const read = (typed: string) => { const result = readReference(catalog, typed); return result.ok ? result.ref : result.error; };
    expect(read("John 3:16")).toEqual({ book: 43, chapter: 3, first: 16, last: 16 });
    expect(read("1 Cor 13:4–7")).toEqual({ book: 46, chapter: 13, first: 4, last: 7 });
    expect(read("jn 3.16")).toEqual({ book: 43, chapter: 3, first: 16, last: 16 });
    expect(read("Jude 3")).toEqual({ book: 65, chapter: 1, first: 3, last: 3 });
    expect(read("I John 4:8")).toEqual({ book: 62, chapter: 4, first: 8, last: 8 });
    expect(read("")).toBe("Type a verse, such as John 3:16.");
    expect(read("John 3")).toBe("Add the verse as well, such as John 3:1.");
    expect(read("Genesis 1:1-2:3")).toMatch(/one chapter/);
    expect(read("John 3:18-16")).toMatch(/run backwards/);
    expect(read("John 30:1")).toBe("John has 21 chapters, so there is no chapter 30.");
    expect(read("Tobit 1:1")).toMatch(/no book called "Tobit"/);
    expect(read("J 3:16")).toMatch(/no book called/);
    expect(read("Phi 4:13")).toMatch(/could be Philippians or Philemon/);
  });

  it("hides today's verse for anything that is not a day file", () => {
    const day = JSON.parse(readFileSync("public/widget/v1/days/2026-11-10.json", "utf8"));
    expect(todayFromDayFile(day)).toEqual({ key: "hebrews-4-12", reference: "Hebrews 4:12" });
    for (const value of [null, "<!doctype html>", { ...day, v: 2 }, { ...day, read: "/countdowns/advent/1" }, { ...day, read: "https://evil.example/read/bsb/HEB/4?hl=12" }]) {
      expect(todayFromDayFile(value)).toBeNull();
    }
    expect(localDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("the reader's Make a verse card button", () => {
  const panel = (slug: string, bookCode: string, chapter = "3", label = "16") => {
    const translation = catalog.translations.find((entry) => entry.slug === slug)!;
    return render(
      <CatalogContext.Provider value={catalog}>
        <MemoryRouter><VersePanel translation={translation} bookCode={bookCode} chapter={chapter} label={label} onClose={() => {}} /></MemoryRouter>
      </CatalogContext.Provider>,
    );
  };

  it("links the Berean reader's verse to its card", () => {
    panel("bsb", "JHN");
    expect(screen.getByRole("link", { name: "Make a verse card" })).toHaveAttribute("href", "/verse-cards/john-3-16");
  });

  it("says Berean in another English-numbered version, and still links a verse the Berean leaves out", () => {
    panel("kjv", "MAT", "17", "21");
    expect(screen.getByRole("link", { name: "Make a verse card (Berean)" })).toHaveAttribute("href", "/verse-cards/matthew-17-21");
  });

  it("is not offered for a version numbered another way, or for the Apocrypha", () => {
    panel("dra", "JHN");
    expect(screen.queryByRole("link", { name: /Make a verse card/ })).not.toBeInTheDocument();
    panel("kjv", "TOB", "1", "1");
    expect(screen.queryByRole("link", { name: /Make a verse card/ })).not.toBeInTheDocument();
  });
});
