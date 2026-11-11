import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TOOLS, isLive } from "@/pages/tools/registry";
import { lastAddress, renderAt, serveChapters } from "./test-kit";
import { RANDOM_VERSE_PATH } from "./share";

const JOHN_3_16 = "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Random Bible verse", () => {
  it("draws a verse on arrival, puts it in the address and links it to the reader", async () => {
    serveChapters();
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderAt("/random-verse");
    expect(await screen.findByText("In the beginning God created the heavens and the earth.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Genesis 1:1" })).toHaveAttribute("href", "/read/bsb/GEN/1?hl=1");
    expect(lastAddress()).toBe("/random-verse?v=GEN.1.1");
    expect(screen.getByText("31,086 verses to draw from")).toBeInTheDocument();
  });

  it("shows a shared verse as it is, and one tap draws another", async () => {
    serveChapters();
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderAt("/random-verse?v=JHN.3.16");
    expect(await screen.findByText(JOHN_3_16)).toBeInTheDocument();
    expect(lastAddress()).toBe("/random-verse?v=JHN.3.16");
    fireEvent.click(screen.getByRole("button", { name: "Another verse" }));
    expect(await screen.findByRole("link", { name: "Genesis 1:1" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/random-verse?v=GEN.1.1");
  });

  it("never draws the verse already on screen when there is another", async () => {
    serveChapters();
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(0.999);
    renderAt("/random-verse?from=OBA");
    await screen.findByRole("link", { name: "Obadiah 1:1" });
    fireEvent.click(screen.getByRole("button", { name: "Another verse" }));
    expect(await screen.findByRole("link", { name: "Obadiah 1:21" })).toBeInTheDocument();
  });

  it("draws from the book chosen, then from a theme within it", async () => {
    serveChapters();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    renderAt("/random-verse?v=JHN.3.16");
    await screen.findByText(JOHN_3_16);
    fireEvent.change(screen.getByRole("combobox", { name: "From" }), { target: { value: "OBA" } });
    expect(await screen.findByRole("link", { name: "Obadiah 1:21" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/random-verse?v=OBA.1.21&from=OBA");
    expect(screen.getByText("21 verses to draw from")).toBeInTheDocument();
    // No theme has a verse in Obadiah, so every theme is greyed out.
    expect(screen.getByRole("button", { name: "Hope" })).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "From" }), { target: { value: "nt" } });
    await waitFor(() => expect(lastAddress()).toMatch(/&from=nt$/));
    fireEvent.click(screen.getByRole("button", { name: "Hope" }));
    expect(await screen.findByRole("link", { name: "Hebrews 10:23" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/random-verse?v=HEB.10.23&from=nt&theme=hope");
    expect(screen.getByRole("button", { name: "Hope" })).toHaveAttribute("aria-pressed", "true");
  });

  it("says so when a theme has no verse in the books chosen, and keeps the verse on screen", async () => {
    serveChapters();
    renderAt("/random-verse?v=JHN.1.1&theme=jesus");
    await screen.findByRole("link", { name: "John 1:1" });
    fireEvent.change(screen.getByRole("combobox", { name: "From" }), { target: { value: "OBA" } });
    expect(await screen.findByText(/None of this theme's verses are in the books you chose/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Another verse" })).toBeDisabled();
    expect(lastAddress()).toBe("/random-verse?v=JHN.1.1&from=OBA&theme=jesus");
    expect(screen.getByRole("link", { name: "John 1:1" })).toBeInTheDocument();
  });

  it("copies the verse with its reference", async () => {
    serveChapters();
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText }, share: undefined });
    renderAt("/random-verse?v=JHN.3.16");
    await screen.findByText(JOHN_3_16);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${JOHN_3_16} — John 3:16 (BSB)`);
    // With no share sheet, Share copies the verse with a link back to it.
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(await screen.findByText("Copied, with a link back to this verse")).toBeInTheDocument();
    expect(writeText).toHaveBeenLastCalledWith(`${JOHN_3_16} — John 3:16 (BSB)\n\nhttps://bibleguide.io/random-verse?v=JHN.3.16`);
  });

  it("hands the verse to the phone's share sheet, and shows it to copy by hand when copying is refused", async () => {
    serveChapters();
    const share = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined, share });
    renderAt("/random-verse?v=JHN.3.16");
    await screen.findByText(JOHN_3_16);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "John 3:16", text: `${JOHN_3_16} — John 3:16 (BSB)`, url: "https://bibleguide.io/random-verse?v=JHN.3.16" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("textbox", { name: "Press and hold to copy" })).toHaveValue(`${JOHN_3_16} — John 3:16 (BSB)`);
  });

  it("says plainly when a shared verse is not in the Berean, and replaces a broken link with a fresh verse", async () => {
    serveChapters();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { unmount } = renderAt("/random-verse?v=MAT.17.21");
    expect(await screen.findByText("The Berean Standard Bible has no verse Matthew 17:21. Ask for another verse below.")).toBeInTheDocument();
    unmount();
    renderAt("/random-verse?v=constructor.1.1&from=toString&theme=__proto__");
    expect(await screen.findByRole("link", { name: "Genesis 1:1" })).toBeInTheDocument();
    expect(lastAddress()).toBe("/random-verse?v=GEN.1.1");
  });

  it("is live on the tools hub at its own address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "random-verse");
    expect(entry && isLive(entry) && entry.path).toBe(RANDOM_VERSE_PATH);
  });
});
