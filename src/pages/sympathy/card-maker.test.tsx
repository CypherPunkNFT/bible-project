// The card maker (design 7.4, "Card maker" and "Message builder"): fields and their limits, typed words kept out of the
// address and drawn under translate="no", the print plumbing, the QR code box, the verse fallback, and the message tab.
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pageRule, PRINT_MARKER } from "@/pages/life-events/print-sheet";
import { removeFonts, renderAt, serveBerean, visits } from "./test-kit";

const pageStyle = () => document.getElementById("print-sheet-page");
const portal = () => document.querySelector(".print-sheet-portal");
const verseSelect = () => screen.getByRole("combobox", { name: "Verse" }) as HTMLSelectElement;
const tab = (name: string) => screen.getByRole("tab", { name });

async function openReady(path = "/sympathy/loss-of-mother") {
  serveBerean();
  removeFonts();
  const view = renderAt(path);
  await screen.findByRole("button", { name: "Print" });
  // The sheet is drawn into its container on <body> one render after the container is made.
  await waitFor(() => expect(portal()?.querySelector(".sys-sheet")).toBeTruthy());
  return view;
}

function asPhone() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width: 767px"), media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }));
}

beforeEach(() => { vi.stubGlobal("print", vi.fn()); });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  removeFonts();
  document.documentElement.classList.remove(PRINT_MARKER);
  Reflect.deleteProperty(navigator, "share");
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("card maker: choosing", () => {
  it("offers the page's card verses, the default first, with believer verses marked and the later hint shown", async () => {
    await openReady("/sympathy");
    expect(verseSelect().selectedOptions[0].textContent).toBe("Psalm 34:18");
    const options = [...verseSelect().options].map((option) => option.textContent);
    expect(options).toHaveLength(14);
    expect(options).not.toContain("Psalm 23:1–6");
    fireEvent.change(verseSelect(), { target: { value: "psalm-30-5b" } });
    expect(screen.getByText(/Often better a few weeks on/)).toBeInTheDocument();
    cleanup();
    await openReady("/sympathy/loss-of-father");
    expect([...verseSelect().options].map((option) => option.textContent)).toContain("Romans 14:8 (For a believer)");
  });

  it("shows the hint under Isaiah 54:5 that another verse suits a man who has lost his wife", async () => {
    await openReady("/sympathy/loss-of-spouse");
    fireEvent.change(verseSelect(), { target: { value: "isaiah-54-5" } });
    expect(screen.getByText(/for a man who has lost his wife/)).toBeInTheDocument();
  });

  it("falls back to the default card verse, and says so, when a display reading cannot go on the folded card", async () => {
    await openReady();
    fireEvent.click(tab("Display print"));
    expect([...verseSelect().options].map((option) => option.textContent)).toContain("Proverbs 31:25–31");
    fireEvent.change(verseSelect(), { target: { value: "proverbs-31-25-31" } });
    expect(portal()!.querySelector(".sys-display .scripture")?.textContent).toMatch(/^Strength and honor are her clothing/);
    fireEvent.click(tab("Print a card"));
    await waitFor(() => expect(verseSelect().selectedOptions[0].textContent).toBe("Psalm 34:18"));
    expect(screen.getByText("That passage is too long for this card, so it now uses Psalm 34:18.")).toBeInTheDocument();
  });

  it("draws the chosen style's ornament on the card", async () => {
    await openReady();
    fireEvent.click(screen.getByRole("radio", { name: "Lily" }));
    expect(portal()!.querySelector(".sys-front .sy-ornament-lily")).not.toBeNull();
  });
});

describe("card maker: fields", () => {
  it("stops each folded-card field at its limit and says how many characters are allowed", async () => {
    await openReady();
    const name = screen.getByLabelText("Their name or names") as HTMLInputElement;
    expect(name.maxLength).toBe(60);
    fireEvent.change(name, { target: { value: "A".repeat(70) } });
    expect(name.value).toHaveLength(60);
    expect(screen.getByText("That is the most this field takes: 60 characters.")).toBeInTheDocument();
    expect((screen.getByLabelText("Heading on the front") as HTMLInputElement).maxLength).toBe(50);
    expect((screen.getByLabelText("Your message") as HTMLTextAreaElement).maxLength).toBe(300);
    expect((screen.getByLabelText("Your name") as HTMLInputElement).maxLength).toBe(60);
    fireEvent.click(tab("Memorial cards"));
    expect((screen.getByLabelText("Name of the person who died") as HTMLInputElement).maxLength).toBe(60);
    expect((screen.getByLabelText("Dates") as HTMLInputElement).maxLength).toBe(40);
    expect((screen.getByLabelText("Heading") as HTMLInputElement).value).toBe("In loving memory");
  });

  it("never writes what is typed into the address, and draws it under translate=no, as plain text", async () => {
    await openReady();
    fireEvent.change(screen.getByLabelText("Their name or names"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Your message"), { target: { value: "<b>Joy</b> to you" } });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Hope" } });
    const names = portal()!.querySelector(".sys-names")!;
    expect(names.textContent).toBe("Grace");
    expect(names.closest('[translate="no"]')).not.toBeNull();
    expect(portal()!.querySelector(".sys-message")?.textContent).toBe("<b>Joy</b> to you");
    expect(portal()!.querySelector("b")).toBeNull();
    fireEvent.click(tab("Send as a message"));
    fireEvent.change(screen.getByLabelText("Your message (optional)"), { target: { value: "Love from Faith" } });
    for (const { address } of visits) expect(address).not.toMatch(/Grace|Hope|Joy|Faith/);
    expect(visits.at(-1)?.address).toBe("/sympathy/loss-of-mother");
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
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(true);
    fireEvent(window, new Event("afterprint"));
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(true);
    view.unmount();
    expect(pageStyle()).toBeNull();
    expect(document.documentElement.classList.contains(PRINT_MARKER)).toBe(false);
    expect(portal()).toBeNull();
  });

  it("turns the folded card's top quarters and keeps front and back upright, with the verse on the front", async () => {
    await openReady();
    const quarter = (name: string) => portal()!.querySelector(`[data-quarter="${name}"]`)!;
    expect(quarter("top-left").classList.contains("sys-turned")).toBe(true);
    expect(quarter("top-right").classList.contains("sys-turned")).toBe(true);
    expect(quarter("bottom-right").classList.contains("sys-turned")).toBe(false);
    expect(quarter("bottom-right").querySelector(".sys-front .scripture")?.textContent).toBe("The LORD is near to the brokenhearted; He saves the contrite in spirit.");
    expect(quarter("bottom-right").querySelector(".sys-heading")?.textContent).toBe("With deepest sympathy");
    expect(quarter("bottom-left").querySelector(".sys-address")?.textContent).toBe("bibleguide.io/sympathy");
  });

  it("prints no QR code on the folded card unless the box is ticked, and then the public card link", async () => {
    await openReady();
    expect(portal()!.querySelector("svg.le-qr")).toBeNull();
    fireEvent.click(screen.getByLabelText(/Add a QR code/));
    expect(portal()!.querySelector("svg.le-qr")?.getAttribute("aria-label")).toBe("QR code for the card link of Psalm 34:18");
  });

  it("prints four memorial cards with the name, dates and verse", async () => {
    await openReady();
    fireEvent.click(tab("Memorial cards"));
    fireEvent.change(screen.getByLabelText("Name of the person who died"), { target: { value: "Ruth Ann Miller" } });
    fireEvent.change(screen.getByLabelText("Dates"), { target: { value: "1931 – 2026" } });
    const cards = portal()!.querySelectorAll(".sys-memorial-card");
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.querySelector(".sys-names")?.textContent).toBe("Ruth Ann Miller");
      expect(card.querySelector(".sys-dates")?.textContent).toBe("1931 – 2026");
      expect(card.querySelector(".sys-ref")?.textContent).toBe("Psalm 34:18");
    }
  });
});

describe("card maker: send as a message", () => {
  it("opens on the message tab on a phone, with Text message and the encoded body", async () => {
    asPhone();
    serveBerean();
    removeFonts();
    renderAt("/sympathy");
    await screen.findByRole("link", { name: "Email" });
    expect(tab("Send as a message").getAttribute("aria-selected")).toBe("true");
    const preview = screen.getByLabelText("What will be sent") as HTMLTextAreaElement;
    expect(preview.value).toContain("— Psalm 34:18 (BSB)");
    expect(preview.value.endsWith("https://bibleguide.io/sympathy/card/psalm-34-18")).toBe(true);
    expect(screen.getByRole("link", { name: "Text message" }).getAttribute("href")).toBe(`sms:?&body=${encodeURIComponent(preview.value)}`);
    expect(screen.getByRole("link", { name: "Email" }).getAttribute("href")).toContain(`&body=${encodeURIComponent(preview.value)}`);
  });

  it("hides Share where the browser has no share sheet, and shows it where it has one", async () => {
    await openReady("/sympathy");
    fireEvent.click(tab("Send as a message"));
    expect(screen.queryByRole("button", { name: "Share…" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Text message" })).toBeNull();
    cleanup();
    const share = vi.fn(() => Promise.reject(Object.assign(new Error("cancelled"), { name: "AbortError" })));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    await openReady("/sympathy");
    fireEvent.click(tab("Send as a message"));
    fireEvent.click(screen.getByRole("button", { name: "Share…" }));
    expect(share).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(screen.queryByText(/Press and hold to copy/)).toBeNull();
  });

  it("carries the style into the link, and offers the card page to preview", async () => {
    await openReady("/sympathy");
    fireEvent.click(screen.getByRole("radio", { name: "Olive branch" }));
    fireEvent.click(tab("Send as a message"));
    const panel = screen.getByRole("tabpanel");
    expect((within(panel).getByLabelText("What will be sent") as HTMLTextAreaElement).value).toMatch(/\/sympathy\/card\/psalm-34-18\?style=olive$/);
    expect(within(panel).getByRole("link", { name: "Preview the card" }).getAttribute("href")).toBe("/sympathy/card/psalm-34-18?style=olive");
  });

  it("shows the message to copy by hand when the clipboard is blocked", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("blocked")) } });
    await openReady("/sympathy");
    fireEvent.click(tab("Send as a message"));
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    expect(await screen.findByText(/Press and hold to copy/)).toBeInTheDocument();
  });
});
