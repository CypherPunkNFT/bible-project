// The card maker and the print mechanism (design 7.3, "Card maker tests").
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canPrint, defaultPaper, pageRule, PRINT_MARKER } from "./print-sheet";
import { qrModules } from "./qr";
import { removeFonts, renderAt, seen, serveBerean, standInFonts } from "./test-kit";

const pageStyle = () => document.getElementById("print-sheet-page");
const portal = () => document.querySelector(".print-sheet-portal");
const verseSelect = () => screen.getByRole("combobox", { name: "Verse" }) as HTMLSelectElement;

async function openReady(path = "/life-events/wedding") {
  serveBerean();
  removeFonts();
  const view = renderAt(path);
  await screen.findByRole("button", { name: "Print" });
  return view;
}

beforeEach(() => { vi.stubGlobal("print", vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); removeFonts(); document.documentElement.classList.remove(PRINT_MARKER); });

describe("card maker: fields", () => {
  it("has as many name fields as the pack's data says, and a date only where it asks for one", async () => {
    await openReady("/life-events/wedding");
    expect(screen.getByLabelText("Name 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Name 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    cleanup();
    await openReady("/life-events/new-job");
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name 2")).toBeNull();
    expect(screen.queryByLabelText("Date")).toBeNull();
  });

  it("stops each field at its limit and says how many characters are allowed", async () => {
    await openReady();
    const name = screen.getByLabelText("Name 1") as HTMLInputElement;
    expect(name.maxLength).toBe(40);
    fireEvent.change(name, { target: { value: "A".repeat(45) } });
    expect(name.value).toHaveLength(40);
    expect(screen.getByText("That is the most this field takes: 40 characters.")).toBeInTheDocument();
    expect((screen.getByLabelText("Heading") as HTMLInputElement).maxLength).toBe(50);
    expect((screen.getByLabelText("Message") as HTMLInputElement).maxLength).toBe(160);
    expect((screen.getByLabelText("Date") as HTMLInputElement).maxLength).toBe(40);
  });

  it("never writes what is typed into the address, and draws it under translate=no, as plain text", async () => {
    await openReady();
    fireEvent.change(screen.getByLabelText("Name 1"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Name 2"), { target: { value: "<b>Hope</b>" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Joy to you both" } });
    const names = [...portal()!.querySelectorAll(".les-names")].find((element) => element.textContent === "Grace & <b>Hope</b>");
    expect(names).toBeTruthy();
    expect(names!.closest('[translate="no"]')).not.toBeNull();
    expect(portal()!.querySelector("b")).toBeNull();
    expect(portal()!.querySelector(".les-message")?.closest('[translate="no"]')).not.toBeNull();
    for (const address of seen) expect(address).not.toMatch(/Grace|Hope|Joy/);
    expect(seen.at(-1)).toBe("/life-events/wedding");
  });
});

describe("card maker: readiness", () => {
  it("keeps Print disabled until the verses and every font face are ready, saying what it waits for", async () => {
    serveBerean();
    const fonts = standInFonts();
    renderAt("/life-events/wedding");
    expect(screen.getByRole("button", { name: "Waiting for the verses…" })).toBeDisabled();
    expect(await screen.findByRole("button", { name: "Waiting for the fonts…" })).toBeDisabled();
    expect(fonts.load).toHaveBeenCalledWith('400 1em "Literata Variable"');
    expect(fonts.load).toHaveBeenCalledWith('italic 400 1em "Literata Variable"');
    expect(fonts.load).toHaveBeenCalledWith('400 1em "Archivo Variable"');
    await act(async () => { fonts.release(); });
    expect(await screen.findByRole("button", { name: "Print" })).toBeEnabled();
  });

  it("tells an in-app browser to open the page in a real browser", () => {
    const facebook = { print: () => {}, navigator: { userAgent: "Mozilla/5.0 [FBAN/FBIOS;FBAV/400.0]" } } as unknown as Window;
    expect(canPrint(facebook)).toBe(false);
    expect(canPrint({ print: () => {}, navigator: { userAgent: "Mozilla/5.0 Chrome/130" } } as unknown as Window)).toBe(true);
  });

  it("defaults to Letter in the US and Canada and to A4 elsewhere", () => {
    expect(defaultPaper(["en-US"])).toBe("letter");
    expect(defaultPaper(["fr-CA"])).toBe("letter");
    expect(defaultPaper(["en-GB"])).toBe("a4");
    expect(defaultPaper(["de"])).toBe("a4");
  });
});

describe("card maker: printing", () => {
  it("adds the @page rule and the marker on Print, keeps them after afterprint, and removes them on leaving", async () => {
    const view = await openReady();
    fireEvent.click(screen.getByLabelText("A4"));
    expect(pageStyle()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(pageStyle()?.textContent).toBe(pageRule("a4", "0"));
    expect(pageStyle()?.textContent).toContain("size: 210mm 297mm; margin: 0;");
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(true);
    fireEvent(window, new Event("afterprint"));
    expect(pageStyle()).not.toBeNull();
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(true);
    fireEvent.click(screen.getByLabelText("US Letter"));
    expect(pageStyle()?.textContent).toContain("size: 8.5in 11in; margin: 0;");
    view.unmount();
    expect(pageStyle()).toBeNull();
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(false);
    expect(portal()).toBeNull();
  });

  it("gives the readings sheet a real page margin, and prints every passage on it", async () => {
    await openReady();
    fireEvent.click(screen.getByLabelText("US Letter"));
    fireEvent.click(screen.getByRole("radio", { name: /Readings sheet/ }));
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(pageStyle()?.textContent).toContain("margin: 0.75in;");
    expect(portal()!.querySelectorAll(".les-reading")).toHaveLength(16);
    expect(portal()!.querySelector(".les-readings h1")?.textContent).toBe("Bible Verses for a Wedding");
  });

  it("turns the top two quarters of the folded card, and keeps the front and back upright", async () => {
    await openReady();
    const quarter = (name: string) => portal()!.querySelector(`[data-quarter="${name}"]`)!;
    expect(quarter("top-left").classList.contains("les-turned")).toBe(true);
    expect(quarter("top-right").classList.contains("les-turned")).toBe(true);
    expect(quarter("bottom-left").classList.contains("les-turned")).toBe(false);
    expect(quarter("bottom-right").classList.contains("les-turned")).toBe(false);
    expect(quarter("bottom-right").querySelector(".les-front .scripture")?.getAttribute("lang")).toBe("en");
    expect(quarter("top-left").querySelector(".les-inside")).not.toBeNull();
    expect(quarter("bottom-left").querySelector(".les-back")).not.toBeNull();
  });

  it("points the QR code at the public page address, whatever address the page is open at", async () => {
    await openReady();
    expect(window.location.origin).not.toBe("https://bibleguide.io");
    const qr = portal()!.querySelector("svg.le-qr")!;
    expect(qr.getAttribute("aria-label")).toBe("QR code for bibleguide.io/life-events/wedding");
    expect(qr.querySelector("path")?.getAttribute("d")).toBe(qrModules("https://bibleguide.io/life-events/wedding")!.path);
    expect(portal()!.querySelector(".les-address")?.textContent).toBe("bibleguide.io/life-events/wedding");
  });

  it("falls back to the first card verse, and says so, when the format cannot take the chosen verse", async () => {
    await openReady();
    expect(verseSelect().selectedOptions[0].textContent).toBe("Ecclesiastes 4:12b");
    fireEvent.click(screen.getByRole("radio", { name: /Display print/ }));
    const options = [...verseSelect().options].map((option) => option.textContent);
    expect(options).toContain("Song of Songs 8:6–7");
    expect(options).not.toContain("Ephesians 5:22–33");
    fireEvent.change(verseSelect(), { target: { value: [...verseSelect().options].find((option) => option.textContent === "Song of Songs 8:6–7")!.value } });
    expect(portal()!.querySelector(".les-display .scripture")?.textContent).toMatch(/^Set me as a seal over your heart/);
    fireEvent.click(screen.getByRole("radio", { name: /Folded card/ }));
    await waitFor(() => expect(verseSelect().selectedOptions[0].textContent).toBe("Ecclesiastes 4:12b"));
    expect(screen.getByRole("status").textContent).toBe("That verse is too long for this format, so the card now uses Ecclesiastes 4:12b.");
  });

  it("shrinks a card verse over 240 characters one step", async () => {
    await openReady("/life-events/engagement");
    const blessing = [...verseSelect().options].find((option) => option.textContent === "Philippians 1:9–11")!;
    fireEvent.change(verseSelect(), { target: { value: blessing.value } });
    expect(portal()!.querySelector(".les-front .les-verse")?.classList.contains("les-small")).toBe(true);
  });
});
