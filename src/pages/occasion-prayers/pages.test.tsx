// The prayer pages as a reader meets them (design 7.3): the hub and its filter with the crisis line, every occasion page
// with its prayers, verses, older prayer and source lines, an unknown address, the tab title, sending and printing.
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CROWN_ACKNOWLEDGEMENT, GROUPS, HISTORIC_PRAYERS, OCCASIONS, occasionBySlug } from "@/data/occasion-prayers";
import { DEFAULT_TITLE } from "@/lib/page-head";
import { removeFonts } from "@/pages/life-events/test-kit";
import { descriptionParagraph, renderAt, serveBerean } from "./test-kit";

const scroll = vi.fn();
let fetchMock: ReturnType<typeof serveBerean>;
beforeEach(() => {
  fetchMock = serveBerean();
  removeFonts();
  scroll.mockClear();
  Element.prototype.scrollIntoView = scroll;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.documentElement.classList.remove("print-sheet-active"); });

const versesLoaded = () => screen.findAllByRole("heading", { name: "Rooted in Scripture" }, { timeout: 5000 });
const cards = () => [...document.querySelectorAll(".op-grid a strong")].map((card) => card.textContent);

describe("the hub", () => {
  it("lists all 32 occasions in six groups, with its introduction as the description", () => {
    renderAt("/prayers");
    expect(screen.getByRole("heading", { level: 1, name: "Prayers for Life's Occasions" })).toBeVisible();
    for (const group of GROUPS) expect(screen.getByRole("heading", { level: 2, name: group.title })).toBeVisible();
    expect([...document.querySelectorAll(".op-grid a")].map((card) => card.getAttribute("href"))).toEqual(OCCASIONS.map((item) => `/prayers/${item.slug}`));
    expect(descriptionParagraph()).toMatch(/^Short prayers for the moments that matter/);
    expect(screen.getByRole("link", { name: "What the Bible says when you're hurting" })).toHaveAttribute("href", "/when-youre");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("finds before surgery when “operation” is typed, and announces the count", () => {
    renderAt("/prayers");
    fireEvent.change(screen.getByLabelText(/Type a word/), { target: { value: "operation" } });
    expect(cards()).toContain("Before surgery");
    expect(cards().length).toBeLessThan(32);
    expect(document.querySelector(".op-count")?.textContent).toBe(cards().length === 1 ? "One prayer page matches." : `${cards().length} prayer pages match.`);
    expect(document.querySelector(".op-urgent")).toBeNull();
  });

  it("shows the calm help line above the results when crisis words are typed", () => {
    renderAt("/prayers");
    fireEvent.change(screen.getByLabelText(/Type a word/), { target: { value: "I want to die" } });
    const line = document.querySelector(".op-urgent")!;
    expect(line.textContent).toMatch(/If you are thinking of ending your life or someone is hurting you, help is here/);
    expect(within(line as HTMLElement).getByRole("link")).toHaveAttribute("href", "/when-youre/thinking-of-suicide");
    expect(line.compareDocumentPosition(document.querySelector(".op-grid")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows every page when nothing matches", () => {
    renderAt("/prayers");
    fireEvent.change(screen.getByLabelText(/Type a word/), { target: { value: "zzzqqq" } });
    expect(cards()).toHaveLength(32);
    expect(document.querySelector(".op-count")?.textContent).toMatch(/No page matches/);
  });
});

describe("an occasion page", () => {
  it.each(OCCASIONS.map((occasion) => [occasion.slug, occasion] as const))("%s shows every part the design lists", async (_, occasion) => {
    renderAt(`/prayers/${occasion.slug}`);
    expect(screen.getByRole("heading", { level: 1, name: occasion.heading })).toBeVisible();
    expect(descriptionParagraph()).toBe(occasion.intro);
    if (occasion.before) expect(screen.getByRole("heading", { name: "A word before you pray" })).toBeVisible();
    for (const prayer of occasion.prayers) {
      const section = document.getElementById(prayer.id)!;
      expect(within(section).getByRole("heading", { level: 2, name: prayer.label })).toBeVisible();
      expect(section.querySelector(".op-prayer-text")?.textContent).toBe(prayer.text);
    }
    await versesLoaded();
    const rootCount = occasion.prayers.reduce((sum, prayer) => sum + prayer.rootedIn.length, 0) + (occasion.scriptureBlessing ? 1 : 0);
    const verses = document.querySelectorAll(".op-root blockquote.scripture");
    expect(verses).toHaveLength(rootCount);
    for (const verse of verses) {
      expect(verse.getAttribute("lang")).toBe("en");
      expect(verse.textContent?.length).toBeGreaterThan(10);
    }
    expect(new Set([...document.querySelectorAll("[id]")].map((element) => element.id)).size).toBe(document.querySelectorAll("[id]").length);
    for (const prayer of occasion.prayers) for (const passage of prayer.rootedIn) if (passage.context) expect(document.body.textContent).toContain(passage.context);
    if (occasion.historic) {
      const older = HISTORIC_PRAYERS[occasion.historic];
      const section = document.getElementById("older-prayer")!;
      expect(section.querySelector("blockquote")?.textContent).toBe(older.text);
      expect(section.querySelector("blockquote")?.getAttribute("lang")).toBe("en");
      expect(section.textContent).toContain(older.source);
      if (older.explanation) expect(section.textContent).toContain(older.explanation);
    } else {
      expect(document.getElementById("older-prayer")).toBeNull();
    }
    const source = document.querySelector(".op-source")!.textContent!;
    expect(source).toContain("Scripture quotations are from the Berean Standard Bible (public domain).");
    expect(source.includes(CROWN_ACKNOWLEDGEMENT)).toBe(Boolean(occasion.historic && HISTORIC_PRAYERS[occasion.historic].rights === "bcp-1662-crown"));
    const more = screen.getByRole("region", { name: "Explore more" });
    for (const topic of occasion.topics) expect(within(more).getByRole("link", { name: topic.title })).toHaveAttribute("href", `/topics/${topic.slug}`);
    for (const slug of occasion.related) expect(within(more).getByRole("link", { name: occasionBySlug(slug)!.heading })).toHaveAttribute("href", `/prayers/${slug}`);
  });

  it("links every verse reference to the reader", async () => {
    renderAt("/prayers/before-surgery");
    await versesLoaded();
    const section = document.getElementById("for-you")!;
    expect(within(section).getByRole("link", { name: "Psalm 31:14–15a" }).getAttribute("href")).toBe("/read/bsb/PSA/31?hl=14-15");
    expect(within(section).getByRole("link", { name: "Jeremiah 17:14" })).toBeVisible();
    expect(section.textContent).toContain("Jeremiah's own prayer for healing");
    expect(document.getElementById("psalm-31-14-15a")).not.toBeNull();
    expect(document.getElementById("psalm-31-14-15a-2")).not.toBeNull();
  });

  it("shows the site's not-found page for an unknown occasion", () => {
    renderAt("/prayers/no-such-occasion");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nothing is written here.");
  });

  it("names the tab with its search title and puts the default back when the page is left", async () => {
    const { unmount } = renderAt("/prayers/job-interview");
    expect(document.title).toBe("Prayer Before a Job Interview · Bible Guide");
    await versesLoaded();
    unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it("opens a shared link at the prayer it names once the verses have drawn", async () => {
    renderAt("/prayers/before-surgery#for-someone");
    await versesLoaded();
    await waitFor(() => expect(scroll).toHaveBeenCalled());
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById("for-someone"));
  });

  it("ignores a malformed fragment", async () => {
    renderAt("/prayers/before-surgery#%E0%A4%A");
    await versesLoaded();
    expect(scroll).not.toHaveBeenCalled();
  });

  it("ends the closing page with Numbers 6:24–26 as Scripture", async () => {
    renderAt("/prayers/closing-a-meeting");
    await versesLoaded();
    const blessing = screen.getByRole("region", { name: "A blessing from Scripture" });
    expect(within(blessing).getByRole("link", { name: "Numbers 6:24–26" })).toBeVisible();
    expect(blessing.querySelector("blockquote.scripture")?.textContent).toMatch(/^.?May the LORD bless you and keep you/);
  });
});

describe("sending a prayer", () => {
  it("builds the message with the typed name, keeping the name out of the address, storage and requests", async () => {
    renderAt("/prayers/before-surgery");
    await versesLoaded();
    const section = document.getElementById("for-someone")!;
    fireEvent.click(within(section).getByRole("button", { name: "Send to them" }));
    expect(within(section).getByText("Add their name here, or fill it in before you send.")).toBeVisible();
    expect(section.querySelector(".op-preview")?.textContent).toMatch(/^I'm praying for you\.\n\nFather, I bring \[name\] to you today/);
    fireEvent.change(within(section).getByLabelText(/Their name/), { target: { value: "Grace" } });
    const preview = section.querySelector(".op-preview")!;
    expect(preview.textContent).toContain("Father, I bring Grace to you today");
    expect(preview.querySelector('[translate="no"]')?.textContent).toBe("Grace");
    expect(within(section).getByRole("link", { name: "Email" }).getAttribute("href")).toContain(encodeURIComponent("I bring Grace to you"));
    expect(within(section).getByRole("link", { name: "Text message" }).getAttribute("href")).toMatch(/^sms:\?&body=/);
    expect(window.location.href).not.toContain("Grace");
    expect(JSON.stringify({ ...localStorage })).not.toContain("Grace");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("Grace");
    expect(fetchMock.mock.calls.flat().join(" ")).not.toContain("Grace");
  });

  it("hides Share where the browser has no share sheet, and offers it where it does", async () => {
    vi.stubGlobal("navigator", { ...navigator, share: undefined });
    const first = renderAt("/prayers/travel");
    await versesLoaded();
    fireEvent.click(within(document.getElementById("for-you")!).getByRole("button", { name: "Send" }));
    expect(screen.queryByRole("button", { name: "Share…" })).toBeNull();
    first.unmount();
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    renderAt("/prayers/travel");
    await versesLoaded();
    fireEvent.click(within(document.getElementById("for-you")!).getByRole("button", { name: "Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Share…" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: expect.stringContaining("https://bibleguide.io/prayers/travel#for-you") }));
  });

  it("shows the text selected with “Press and hold to copy” when the clipboard is blocked", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });
    renderAt("/prayers/new-home");
    await versesLoaded();
    fireEvent.click(within(document.getElementById("for-you")!).getByRole("button", { name: "Copy" }));
    const box = await screen.findByLabelText("Press and hold to copy");
    expect((box as HTMLTextAreaElement).value).toMatch(/— A prayer for a new home, bibleguide\.io\/prayers\/new-home$/);
  });
});

describe("printing a prayer", () => {
  it("draws a sheet holding only that prayer, its verse references and the source lines", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/prayers/someone-in-hospital");
    await versesLoaded();
    fireEvent.click(within(document.getElementById("for-you")!).getByRole("button", { name: "Print this prayer" }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    const sheet = document.querySelector(".print-sheet-portal .op-sheet")!;
    const occasion = occasionBySlug("someone-in-hospital")!;
    expect(sheet.querySelector(".op-sheet-prayer")?.textContent).toBe(occasion.prayers[1].text);
    expect(sheet.textContent).not.toContain(occasion.prayers[0].text);
    expect([...sheet.querySelectorAll("cite")].map((cite) => cite.textContent)).toEqual(["Psalm 41:3", "Psalm 23:4", "2 Corinthians 1:3–4"]);
    expect(sheet.textContent).toContain("Berean Standard Bible");
    expect(sheet.textContent).not.toContain(CROWN_ACKNOWLEDGEMENT);
  });

  it("prints an older 1662 prayer with the Crown acknowledgement", async () => {
    vi.stubGlobal("print", vi.fn());
    renderAt("/prayers/someone-in-hospital");
    await versesLoaded();
    fireEvent.click(within(document.getElementById("older-prayer")!).getByRole("button", { name: "Print this prayer" }));
    await waitFor(() => expect(document.querySelector(".print-sheet-portal .op-sheet")).not.toBeNull());
    expect(document.querySelector(".print-sheet-portal .op-sheet")!.textContent).toContain(CROWN_ACKNOWLEDGEMENT);
  });

  it("hides the print button where the browser cannot print", async () => {
    vi.stubGlobal("print", undefined);
    renderAt("/prayers/someone-in-hospital");
    await versesLoaded();
    expect(screen.queryByRole("button", { name: "Print this prayer" })).toBeNull();
  });
});
