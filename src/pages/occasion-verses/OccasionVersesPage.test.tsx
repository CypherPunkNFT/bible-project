// The occasion verse picker on screen (design 1–9): the chooser, an occasion by part of the service, Our list in the
// address, Copy, one failed book, the certificate's privacy and one print at a time, and its Tools hub entry.
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOOLS, isLive } from "@/pages/tools/registry";
import { giveListLayout, lastAddress, renderAt, seen, serveBerean } from "./test-kit";

const PSALM_118_24 = "This is the day that the LORD has made; we will rejoice and be glad in it.";

beforeEach(() => giveListLayout());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.querySelectorAll(".print-sheet-portal").forEach((element) => element.remove());
});

describe("Occasion verse picker", () => {
  // First, while no test has loaded Luke yet: the site keeps each book it has loaded for the visit.
  it("shows the passages that loaded when one book fails, and Try again fetches it again", async () => {
    const fetchMock = serveBerean({ failBooks: ["LUK"] });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderAt("/occasion-verses?o=birthday");
    expect(await screen.findByText(PSALM_118_24)).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Some passages could not be loaded");
    expect(screen.getByText("These words could not be loaded.")).toBeInTheDocument();
    serveBerean();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("And Jesus grew in wisdom and stature, and in favor with God and man.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalled();
  });

  it("opens on the occasions, grouped, and an occasion link opens its passages by part of the service", async () => {
    serveBerean();
    renderAt("/occasion-verses");
    const chooser = screen.getByRole("navigation", { name: "Occasions" });
    for (const group of ["Weddings and marriage", "Faith", "Birthdays and milestones", "Funerals and loss"]) {
      expect(within(chooser).getByRole("heading", { name: group })).toBeInTheDocument();
    }
    for (const name of ["Wedding", "Baptism", "Confirmation or profession of faith", "Birthday", "Funeral service", "Graduation"]) {
      expect(within(chooser).getByRole("link", { name })).toBeInTheDocument();
    }
    fireEvent.click(within(chooser).getByRole("link", { name: "Wedding" }));
    expect(await screen.findByRole("heading", { name: "Bible Verses for a Wedding" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/occasion-verses?o=wedding");
    for (const part of ["Welcome and opening words", "Scripture readings", "The message to the couple", "Vows and rings", "Prayer over the couple", "Pronouncement and benediction", "Programs, invitations and cards"]) {
      expect(screen.getByRole("heading", { name: part, level: 3 })).toBeInTheDocument();
    }
    expect(await screen.findByText(PSALM_118_24)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Psalm 118:24" })).toHaveAttribute("href", "/read/bsb/PSA/118?hl=24-24");
    expect(screen.getByText(/Only a suggestion/)).toBeInTheDocument();
  });

  it("cleans an address it cannot use and shows the occasions", async () => {
    serveBerean();
    renderAt("/occasion-verses?o=__proto__&list=nope,psalm-23-1-6,psalm-23-1-6&utm_source=x");
    await waitFor(() => expect(lastAddress()).toBe("/occasion-verses?list=psalm-23-1-6"));
    expect(screen.getByText("Choose an occasion above to see its passages.")).toBeInTheDocument();
    const list = screen.getByRole("complementary", { name: "Our list" });
    expect(within(list).getByText("Psalm 23:1–6")).toBeInTheDocument();
  });

  it("keeps the list in the address across occasions, moves it in order and copies it as text", async () => {
    serveBerean();
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderAt("/occasion-verses?o=birthday");
    await screen.findByText(PSALM_118_24);
    const boxes = screen.getAllByRole("checkbox", { name: "Add to our list" });
    fireEvent.click(boxes[0]);
    await waitFor(() => expect(lastAddress()).toBe("/occasion-verses?o=birthday&list=psalm-139-13-14"));
    fireEvent.click(screen.getByRole("link", { name: "Funeral service" }));
    await screen.findByRole("heading", { name: "Bible Readings for a Funeral" });
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Add to our list" })[0]);
    await waitFor(() => expect(lastAddress()).toMatch(/^\/occasion-verses\?o=funeral&list=psalm-139-13-14,john-11-25b$/));
    const list = screen.getByRole("complementary", { name: "Our list" });
    const down = within(list).getByRole("button", { name: "Move Psalm 139:13–14 down" });
    fireEvent.click(down);
    await waitFor(() => expect(lastAddress()).toBe("/occasion-verses?o=funeral&list=john-11-25b,psalm-139-13-14"));
    expect(within(list).getByText("Moved to place 2")).toBeInTheDocument();
    const copy = within(list).getByRole("button", { name: "Copy as text" });
    await waitFor(() => expect(copy).toBeEnabled());
    fireEvent.click(copy);
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const text = (writeText.mock.calls[0] as unknown as [string])[0];
    expect(text.indexOf("John 11:25b")).toBeLessThan(text.indexOf("Psalm 139:13–14"));
    expect(text).toContain("I praise You, for I am fearfully and wonderfully made.");
    expect(text.endsWith("Scripture quotations are from the Berean Standard Bible (public domain).")).toBe(true);
  });

  it("shows the text to copy by hand when the clipboard refuses", async () => {
    serveBerean();
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderAt("/occasion-verses?list=psalm-118-24");
    const copy = await screen.findByRole("button", { name: "Copy as text" });
    await waitFor(() => expect(copy).toBeEnabled());
    fireEvent.click(copy);
    const box = await screen.findByRole("textbox", { name: /Press and hold to copy/ });
    expect((box as HTMLTextAreaElement).value).toContain(PSALM_118_24);
  });

  it("prints a baptism certificate alone, with the typed name never in the address or the title", async () => {
    serveBerean();
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/occasion-verses?o=baptism&list=psalm-23-1-6");
    await screen.findByRole("heading", { name: "Bible Verses for Baptism" });
    const name = screen.getByRole("textbox", { name: "Name of the person baptized" });
    expect(name.closest("form")).toBeNull();
    expect(name).not.toHaveAttribute("name");
    fireEvent.change(name, { target: { value: "Zebedee Quill" } });
    fireEvent.keyDown(name, { key: "Enter" });
    const button = screen.getByRole("button", { name: "Print certificate" });
    await waitFor(() => expect(button).toBeEnabled());
    await act(async () => { fireEvent.click(button); });
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    const portals = document.querySelectorAll(".print-sheet-portal");
    expect(portals).toHaveLength(1);
    expect(portals[0].querySelector("[data-sheet='certificate']")).not.toBeNull();
    expect(portals[0].textContent).toContain("Zebedee Quill");
    expect(portals[0].textContent).toContain("having professed faith in Jesus Christ, was baptized by immersion");
    expect(seen.some((address) => address.includes("Zebedee"))).toBe(false);
    expect(document.title).not.toContain("Zebedee");
  });

  it("then prints the list alone, never both sheets together", async () => {
    serveBerean();
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/occasion-verses?o=baptism&list=psalm-23-1-6");
    await screen.findByRole("heading", { name: "Bible Verses for Baptism" });
    const certificate = screen.getByRole("button", { name: "Print certificate" });
    await waitFor(() => expect(certificate).toBeEnabled());
    await act(async () => { fireEvent.click(certificate); });
    const list = screen.getByRole("button", { name: "Print readers' sheet" });
    await waitFor(() => expect(list).toBeEnabled());
    await act(async () => { fireEvent.click(list); });
    await waitFor(() => expect(print).toHaveBeenCalledTimes(2));
    const portals = document.querySelectorAll(".print-sheet-portal");
    expect(portals).toHaveLength(1);
    expect(portals[0].querySelector("[data-format='readers']")).not.toBeNull();
    expect(portals[0].querySelector("[data-sheet='certificate']")).toBeNull();
  });

  it("titles the confirmation certificate Profession of Faith unless Confirmation is chosen", async () => {
    serveBerean();
    vi.stubGlobal("print", vi.fn());
    renderAt("/occasion-verses?o=confirmation");
    await screen.findByRole("heading", { name: "Bible Verses for a Confirmation or Profession of Faith" });
    expect(screen.getByText("Confirmation, and how Baptists differ")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Print certificate" });
    await waitFor(() => expect(button).toBeEnabled());
    await act(async () => { fireEvent.click(button); });
    await waitFor(() => expect(document.querySelector(".print-sheet-portal h1")?.textContent).toBe("Profession of Faith"));
  });

  it("offers no certificate where none fits, and links an occasion to its full page", async () => {
    serveBerean();
    renderAt("/occasion-verses?o=graduation");
    await screen.findByRole("heading", { name: "Graduation Bible Verses" });
    expect(screen.queryByRole("button", { name: /Print certificate/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the full page, with a card to print" })).toHaveAttribute("href", "/life-events/graduation");
  });
});

describe("Occasion verse picker on the Tools hub", () => {
  it("is a live tool at its own routed address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "occasion-verses");
    expect(entry && isLive(entry) ? entry.path : null).toBe("/occasion-verses");
    expect(readFileSync("src/App.tsx", "utf8")).toContain('<Route path="/occasion-verses"');
  });
});
