// The funeral readings page (design 7.4, "Readings page"): ticking, reordering, the list link, the list kept in the page's
// own address without new history entries, opening a list link, and the readers' sheet.
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRINT_MARKER } from "@/pages/life-events/print-sheet";
import { listAsText, listUrl, readingTime } from "./reading-text";
import { readList } from "./useReadingList";
import { removeFonts, renderAt, serveBerean, visits } from "./test-kit";

const panel = () => screen.getByRole("complementary", { name: "Our readings" });
const chosenRefs = () => within(panel()).queryAllByRole("listitem").map((item) => item.querySelector("strong")?.textContent);
const tick = (reference: string) => fireEvent.click(screen.getByRole("checkbox", { name: `Add ${reference} to our list` }));

async function openPage(path = "/sympathy/funeral-readings") {
  serveBerean();
  removeFonts();
  renderAt(path);
  await screen.findByRole("heading", { level: 2, name: "Closing blessing" });
}

beforeEach(() => { vi.stubGlobal("print", vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.documentElement.classList.remove(PRINT_MARKER); Reflect.deleteProperty(navigator, "clipboard"); });

describe("funeral readings: the page", () => {
  it("lists the five parts of the service with all 47 readings, folded to their first line", async () => {
    await openPage();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible Readings for a Funeral");
    for (const part of ["Opening words", "Psalms and Old Testament", "New Testament", "At the graveside", "Closing blessing"]) {
      expect(screen.getByRole("heading", { level: 2, name: part })).toBeInTheDocument();
    }
    expect(document.querySelectorAll(".sy-reading-row")).toHaveLength(47);
    const first = document.querySelector(".sy-reading-row .sy-text")!;
    expect(first.classList.contains("sy-folded")).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Show reading" })[0]);
    expect(first.classList.contains("sy-folded")).toBe(false);
    expect(screen.getByRole("link", { name: "Amazing Grace" }).getAttribute("href")).toBe("/study/hymns/ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound");
  });

  it("gives each reading its time aloud, at about 150 words a minute", () => {
    expect(readingTime("word ".repeat(40))).toBe("About 1 minute aloud");
    expect(readingTime("word ".repeat(300))).toBe("About 2 minutes aloud");
  });
});

describe("funeral readings: our list", () => {
  it("adds ticked readings in service order, reorders them, and removes them", async () => {
    await openPage();
    tick("Numbers 6:24–26");
    tick("Psalm 23:1–6");
    tick("John 11:25b");
    expect(chosenRefs()).toEqual(["John 11:25b", "Psalm 23:1–6", "Numbers 6:24–26"]);
    fireEvent.click(screen.getByRole("button", { name: "Move Numbers 6:24–26 up" }));
    expect(chosenRefs()).toEqual(["John 11:25b", "Numbers 6:24–26", "Psalm 23:1–6"]);
    expect(screen.getByRole("button", { name: "Move John 11:25b up" })).toBeDisabled();
    tick("John 14:1–6");
    expect(chosenRefs()).toEqual(["John 11:25b", "Numbers 6:24–26", "Psalm 23:1–6", "John 14:1–6"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Psalm 23:1–6 from our list" }));
    expect(chosenRefs()).toEqual(["John 11:25b", "Numbers 6:24–26", "John 14:1–6"]);
  });

  it("keeps the list in the page's own address, replacing the history entry each time", async () => {
    await openPage();
    tick("Psalm 23:1–6");
    tick("John 14:1–6");
    await waitFor(() => expect(visits.at(-1)?.address).toBe("/sympathy/funeral-readings?list=psalm-23-1-6,john-14-1-6"));
    expect(visits.filter((visit) => visit.address.includes("list=")).every((visit) => visit.how === "REPLACE")).toBe(true);
    expect(visits.some((visit) => visit.how === "PUSH")).toBe(false);
    tick("Psalm 23:1–6");
    tick("John 14:1–6");
    await waitFor(() => expect(visits.at(-1)?.address).toBe("/sympathy/funeral-readings"));
  });

  it("opens a list link in its order, keeping each reading once and skipping unknown keys with a note", async () => {
    await openPage("/sympathy/funeral-readings?list=numbers-6-24-26,psalm-23-1-6,no-such-key,psalm-23-1-6,psalm-34-18");
    expect(chosenRefs()).toEqual(["Numbers 6:24–26", "Psalm 23:1–6"]);
    expect(screen.getByText("2 readings in this link could not be found, so they were left out.")).toBeInTheDocument();
    await waitFor(() => expect(visits.at(-1)?.address).toBe("/sympathy/funeral-readings?list=numbers-6-24-26,psalm-23-1-6"));
    expect(screen.getByText("2 readings in this link could not be found, so they were left out.")).toBeInTheDocument();
  });

  it("sends the pastor a link holding only reading keys, and copies the list as text for a program", async () => {
    expect(listUrl(["psalm-23-1-6", "john-14-1-6"])).toBe("https://bibleguide.io/sympathy/funeral-readings?list=psalm-23-1-6,john-14-1-6");
    expect(readList("Psalm-23-1-6, john-14-1-6 ,bogus").keys).toEqual(["psalm-23-1-6", "john-14-1-6"]);
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await openPage();
    tick("Psalm 23:1–6");
    fireEvent.click(screen.getByRole("button", { name: "Send the list to our pastor" }));
    expect(writeText).toHaveBeenLastCalledWith("https://bibleguide.io/sympathy/funeral-readings?list=psalm-23-1-6");
    expect(await screen.findByText(/The link to your list is copied/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy as text" }));
    const text = (writeText.mock.calls.at(-1) as unknown as [string])[0];
    expect(text.startsWith("Psalms and Old Testament\nPsalm 23:1–6\nThe LORD is my shepherd; I shall not want.")).toBe(true);
    expect(text.endsWith("Berean Standard Bible (public domain).")).toBe(true);
    expect(typeof listAsText).toBe("function");
  });

  it("prints the readers' sheet with a real page margin, one reading per page by default", async () => {
    await openPage();
    tick("Psalm 23:1–6");
    tick("John 14:1–6");
    fireEvent.click(within(panel()).getByLabelText("US Letter"));
    const print = await within(panel()).findByRole("button", { name: "Print readers' sheet" });
    fireEvent.click(print);
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(document.getElementById("print-sheet-page")?.textContent).toContain("margin: 0.75in;");
    const sheet = document.querySelector(".print-sheet-portal .sys-readers")!;
    expect(sheet.classList.contains("sys-new-page")).toBe(true);
    expect([...sheet.querySelectorAll(".sys-reading h3")].map((heading) => heading.textContent)).toEqual(["Psalm 23:1–6", "John 14:1–6"]);
    fireEvent.click(within(panel()).getByLabelText("Start each reading on a new page"));
    expect(document.querySelector(".print-sheet-portal .sys-readers")!.classList.contains("sys-new-page")).toBe(false);
  });
});
