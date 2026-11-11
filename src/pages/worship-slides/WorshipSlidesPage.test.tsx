import { readFileSync } from "node:fs";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isLive, TOOLS } from "@/pages/tools/registry";
import { PPTX_TYPE } from "./pptx";
import { catchDownloads, forgetDownloads, lastAddress, PATH, renderAt, serveChapters, standInCanvas } from "./test-kit";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  forgetDownloads();
});

describe("Worship slide maker", () => {
  it("asks for a passage on arrival", () => {
    standInCanvas();
    serveChapters();
    renderAt(PATH);
    expect(screen.getByRole("heading", { name: "Worship slide maker" })).toBeInTheDocument();
    expect(screen.getByText("Type a verse or passage above, or try one of the examples.")).toBeInTheDocument();
  });

  it("makes a title slide and one slide per verse, and draws them", async () => {
    const { drawn } = standInCanvas();
    serveChapters();
    const { container } = renderAt(`${PATH}?ref=Psalm+23`);
    expect(await screen.findByText("7 slides")).toBeInTheDocument();
    const tiles = [...container.querySelectorAll<HTMLElement>(".ws-tile")];
    expect(tiles).toHaveLength(7);
    expect(within(tiles[0]).getByText("Psalm 23")).toBeInTheDocument();
    expect(within(tiles[1]).getByText("Psalm 23:1")).toBeInTheDocument();
    await waitFor(() => expect(drawn).toContain("shepherd;"));
    expect(drawn).toContain("Berean Standard Bible");
  });

  it("typing a reference and an example both put it in the address", async () => {
    standInCanvas();
    serveChapters();
    renderAt(PATH);
    fireEvent.change(screen.getByLabelText("Verse or passage"), { target: { value: "John 3:16-18" } });
    fireEvent.click(screen.getByRole("button", { name: "Make slides" }));
    expect(await screen.findByText("4 slides")).toBeInTheDocument();
    expect(lastAddress()).toBe(`${PATH}?ref=John+3%3A16-18`);
    fireEvent.click(screen.getByRole("button", { name: "Isaiah 40:28-31" }));
    expect(await screen.findByText("Isaiah 40:28–31")).toBeInTheDocument();
    expect(lastAddress()).toBe(`${PATH}?ref=Isaiah+40%3A28-31`);
  });

  it("changes with the choices, which go into the address", async () => {
    standInCanvas();
    serveChapters();
    renderAt(`${PATH}?ref=Psalm+23`);
    await screen.findByText("7 slides");
    fireEvent.click(screen.getByRole("button", { name: "Small" }));
    fireEvent.click(screen.getByRole("button", { name: "As many verses as fit" }));
    await waitFor(() => expect(screen.queryByText("7 slides")).toBeNull());
    const count = screen.getByText(/^\d+ slides$/).textContent ?? "";
    expect(parseInt(count, 10)).toBeLessThan(7);
    fireEvent.click(screen.getByRole("checkbox", { name: "A title slide first" }));
    fireEvent.click(screen.getByRole("button", { name: /Paper/ }));
    fireEvent.click(screen.getByRole("button", { name: "Lower third" }));
    expect(lastAddress()).toBe(`${PATH}?ref=Psalm+23&layout=lower-third&theme=paper&per=fill&size=small&title=0`);
    expect(screen.getByRole("button", { name: "Lower third" })).toHaveAttribute("aria-pressed", "true");
  });

  it("says what is wrong with a reference it cannot read", async () => {
    standInCanvas();
    serveChapters();
    renderAt(`${PATH}?ref=Hezekiah+3`);
    expect(screen.getByText(/No book of the Bible is called “Hezekiah”/)).toBeInTheDocument();
    renderAt(`${PATH}?ref=John+3:99`);
    expect(await screen.findByText(/The Berean Standard Bible has no verses in this passage/)).toBeInTheDocument();
  });

  it("says when the passage cannot be loaded, and tries again", async () => {
    standInCanvas();
    const fetchMock = serveChapters({ fail: true });
    renderAt(`${PATH}?ref=Haggai+2`);
    expect(await screen.findByText(/The passage could not be loaded/)).toBeInTheDocument();
    const calls = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(calls));
  });

  it("downloads a PowerPoint file, every picture in a zip, and one picture", async () => {
    standInCanvas();
    serveChapters();
    const files = catchDownloads();
    renderAt(`${PATH}?ref=Psalm+23`);
    await screen.findByText("7 slides");
    fireEvent.click(screen.getByRole("button", { name: "Download PowerPoint" }));
    await waitFor(() => expect(files).toHaveLength(1));
    expect(files[0].name).toBe("Psalm-23.pptx");
    expect(files[0].blob.type).toBe(PPTX_TYPE);
    fireEvent.click(screen.getByRole("button", { name: "Download all pictures (zip)" }));
    await waitFor(() => expect(files).toHaveLength(2));
    expect(files[1].name).toBe("Psalm-23-pictures.zip");
    const zip = new TextDecoder().decode(new Uint8Array(await files[1].blob.arrayBuffer()));
    expect(zip).toContain("01-Psalm-23.png");
    expect(zip).toContain("07-Psalm-23-6.png");
    await waitFor(() => expect(screen.getByRole("button", { name: "Download PowerPoint" })).toBeEnabled());
    fireEvent.click(screen.getAllByRole("button", { name: "Save picture" })[2]);
    await waitFor(() => expect(files).toHaveLength(3));
    expect(files[2]).toMatchObject({ name: "03-Psalm-23-2.png" });
    expect(files[2].blob.type).toBe("image/png");
  });

  it("is a live tool on the Tools page, with its route", () => {
    const entry = TOOLS.find((tool) => tool.slug === "worship-slides");
    expect(entry && isLive(entry) && entry.path).toBe(PATH);
    expect(entry?.category).toBe("sharing");
    expect(readFileSync("src/App.tsx", "utf8")).toContain(`<Route path="${PATH}" element={<WorshipSlidesPage />} />`);
  });
});
