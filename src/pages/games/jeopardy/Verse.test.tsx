// The verse on Bible Jeopardy's answer screen (design 5.3, 13), with chapter loading stubbed.
import { render, screen, waitFor } from "@testing-library/react";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { quiz } from "./bank.test.fixture";
import { Verse } from "./Verse";

const loadChapterPlain = vi.fn();
vi.mock("@/lib/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/data")>(),
  loadChapterPlain: (...args: unknown[]) => loadChapterPlain(...args),
}));

const catalog = { stamp: "test", sections: [], books: [], equivalent: {}, translations: [{ slug: "bsb", books: { GEN: ["1", "2"] } }] } as unknown as Catalog;
const show = (q = quiz("00000000000000aa")) => render(<CatalogContext.Provider value={catalog}><Verse q={q} /></CatalogContext.Provider>);

afterEach(() => { vi.restoreAllMocks(); loadChapterPlain.mockReset(); });

describe("Verse", () => {
  it("shows the BSB words and a reference that opens the reader in a new tab", async () => {
    loadChapterPlain.mockResolvedValue({ "1:1": "¶ In the beginning God created the heavens and the earth." });
    show();
    expect(await screen.findByText("In the beginning God created the heavens and the earth.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Genesis 1:1/ });
    expect(link).toHaveAttribute("href", "/read/bsb/GEN/1?v=1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(loadChapterPlain).toHaveBeenCalledWith("bsb", "GEN", ["1", "2"], "1");
  });

  it("shows the reference alone when the question has no link", () => {
    show({ ...quiz("00000000000000ab"), link: null });
    expect(screen.getByText("Genesis 1:1")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(loadChapterPlain).not.toHaveBeenCalled();
  });

  it("shows the reference alone when the words fail to load", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    loadChapterPlain.mockRejectedValue(new Error("offline"));
    show();
    await waitFor(() => expect(loadChapterPlain).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: /Genesis 1:1/ })).toBeInTheDocument();
    expect(document.querySelector("blockquote")).toBeNull();
  });
});
