import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import { TOOLS, isLive } from "@/pages/tools/registry";
import CitationPage, { CITATION_PATH } from "./CitationPage";

const seen = { address: "" };
const renderAt = (path: string) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <AddressProbe onSeen={(address) => { seen.address = address; }} />
      <Routes><Route path={CITATION_PATH} element={<CitationPage />} /></Routes>
    </MemoryRouter>
  </CatalogContext.Provider>,
);

/** The citation shown under a label, as text. */
const line = (label: string) => screen.getByText(label, { selector: "dt" }).nextElementSibling?.querySelector(".cg-citation")?.textContent;

afterEach(() => vi.unstubAllGlobals());

describe("Bible citation generator", () => {
  it("opens on John 3:16 in the Berean Standard Bible, in MLA, with titles in italics", () => {
    renderAt(CITATION_PATH);
    expect(screen.getByRole("textbox", { name: "Reference" })).toHaveValue("John 3:16");
    expect(screen.getByRole("combobox", { name: "Version" })).toHaveValue("bsb");
    expect(screen.getByRole("radio", { name: "MLA" })).toBeChecked();
    expect(line("In the text, the first time")).toBe("(Berean Standard Bible, John 3.16)");
    expect(line("Works Cited")).toMatch(/^Berean Standard Bible\. 2023\. Bible Guide, bibleguide\.io\/read\. Accessed /);
    const works = screen.getByText("Works Cited", { selector: "dt" }).nextElementSibling!;
    expect(within(works as HTMLElement).getByText("Berean Standard Bible", { selector: "i" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read it in the Berean Standard Bible" })).toHaveAttribute("href", "/read/bsb/JHN/3?hl=16");
  });

  it("reads a shared address, and keeps the reference, version and style in it as they change", () => {
    renderAt(`${CITATION_PATH}?ref=Ps%2023%3B%2091%3A1-4&v=kjv&style=sbl`);
    expect(line("Note")).toBe("Pss 23; 91:1–4.");
    expect(line("Say once, in your first note or preface")).toBe("Unless otherwise noted, Scripture quotations are from the King James Version (KJV).");
    fireEvent.click(screen.getByRole("radio", { name: "APA" }));
    expect(line("In the text, every time")).toBe("(King James Version, 1611/n.d., Psalms 23; 91:1–4)");
    expect(seen.address).toBe(`${CITATION_PATH}?ref=Ps+23%3B+91%3A1-4&v=kjv&style=apa`);
    fireEvent.change(screen.getByRole("textbox", { name: "Reference" }), { target: { value: "Rom 8:28" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Version" }), { target: { value: "web" } });
    expect(line("Reference list")).toBe("World English Bible. (2020). Bible Guide. https://bibleguide.io/read");
    expect(line("In the text, every time")).toBe("(World English Bible, 2020, Romans 8:28)");
    expect(seen.address).toBe(`${CITATION_PATH}?ref=Rom+8%3A28&v=web&style=apa`);
  });

  it("offers every version the site serves, grouped by language", () => {
    renderAt(CITATION_PATH);
    const select = screen.getByRole("combobox", { name: "Version" });
    expect(within(select).getAllByRole("option")).toHaveLength(catalog.translations.length);
    expect(within(select).getAllByRole("group").map((group) => group.getAttribute("label"))).toContain("English");
  });

  it("says what is wrong with a reference it cannot cite", () => {
    renderAt(`${CITATION_PATH}?ref=Tobit%201%3A1`);
    expect(screen.getByRole("alert")).toHaveTextContent("The Berean Standard Bible does not have Tobit.");
    expect(screen.queryByRole("button", { name: /^Copy/ })).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Version" }), { target: { value: "kjv" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(line("In the text, the first time")).toBe("(King James Version, Tob. 1.1)");
  });

  it("warns that a version numbered differently may not match", () => {
    renderAt(`${CITATION_PATH}?ref=Psalm%2023&v=lxxe`);
    expect(screen.getByText(/numbers some chapters and verses differently/)).toBeInTheDocument();
  });

  it("uses a printed Bible's publisher and year, kept on the page only", () => {
    renderAt(`${CITATION_PATH}?style=chicago`);
    fireEvent.change(screen.getByRole("textbox", { name: "Publisher" }), { target: { value: "Crossway" } });
    fireEvent.change(screen.getByRole("textbox", { name: "City (Chicago and Turabian only)" }), { target: { value: "Wheaton, IL" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Year printed" }), { target: { value: "20x16" } });
    expect(line("Bibliography")).toBe("Berean Standard Bible. Wheaton, IL: Crossway, 2016.");
    expect(seen.address).not.toMatch(/Crossway|2016/);
  });

  it("copies a line, and shows it to copy by hand when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderAt(`${CITATION_PATH}?style=turabian`);
    fireEvent.click(screen.getByRole("button", { name: "Copy: First note" }));
    await screen.findByRole("button", { name: "Copied: First note" });
    expect(writeText).toHaveBeenCalledWith("John 3:16 (Berean Standard Bible).");
    fireEvent.click(screen.getByRole("button", { name: /^Copy all/ }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining("Later notes: John 3:16.")));

    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Copy: Later notes" }));
    expect(await screen.findByDisplayValue("John 3:16.")).toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("is live on the tools hub at its own routed address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "citation-generator");
    expect(entry && isLive(entry) ? entry.path : null).toBe(CITATION_PATH);
    expect(entry?.category).toBe("study");
    const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
    expect(app).toContain(`<Route path="${CITATION_PATH}"`);
  });
});
