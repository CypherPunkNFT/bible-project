// The page, rendered against the real built data: every /data/ request is answered from the repository's data/ folder
// (data/baby-names/ is git-ignored and built by scripts/bible/build_baby_names.py, as the baby-names tests need too).
import { existsSync, readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NamesIndex } from "@/data/baby-names";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { forgetBabyNames } from "@/pages/baby-names/useBabyNames";
import { TOOLS, isLive } from "@/pages/tools/registry";
import NameInHebrewPage, { NAME_IN_HEBREW_PATH } from "./NameInHebrewPage";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const index = JSON.parse(readFileSync("data/baby-names/index.json", "utf8")) as NamesIndex;
const row = (slug: string) => index.names.find((name) => name.s === slug)!;

function serveData(options: { down?: boolean } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = `data/${decodeURIComponent(String(url).replace(/^\/data\//, "").split("?")[0])}`;
    if (options.down || !String(url).startsWith("/data/") || path.includes("..") || !existsSync(path)) {
      return { ok: false, status: options.down ? 503 : 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
    }
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(path, "utf8")) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let address = "";
function Probe() {
  const location = useLocation();
  address = `${location.pathname}${location.search}`;
  return null;
}

const renderAt = (path: string) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <Probe />
      <Routes><Route path={NAME_IN_HEBREW_PATH} element={<NameInHebrewPage />} /></Routes>
    </MemoryRouter>
  </CatalogContext.Provider>,
);

const card = (title: string) => screen.getByRole("region", { name: title });
/** The result on screen (the printable card, drawn hidden on <body>, repeats the meaning). */
const result = (name: string) => within(screen.getByRole("region", { name }));

beforeEach(() => forgetBabyNames());
afterEach(() => vi.unstubAllGlobals());

describe("your name in Hebrew, Greek and Aramaic", () => {
  it("shows a shared Bible name's meaning, Scripture's spellings and the spellings by sound", async () => {
    serveData();
    renderAt("/name-in-hebrew?name=david");
    expect(screen.getByRole("heading", { level: 2, name: "David" })).toBeInTheDocument();
    expect(await result("David").findByText(`“${row("david").m}”`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More about the name David, with its verses" })).toHaveAttribute("href", "/baby-names/david");
    await waitFor(() => expect(within(card("Hebrew")).getByText("In the Bible")).toBeInTheDocument());
    expect(within(card("Hebrew")).getByText("By sound, as Hebrew writes names today")).toBeInTheDocument();
    expect(within(card("Greek")).getByText("In the Bible")).toBeInTheDocument();
    expect(within(card("Aramaic")).getByText("The Hebrew letters, in Aramaic script")).toBeInTheDocument();
    expect(within(card("Aramaic")).getByText("ܕܘܕ")).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "" }).textContent).toMatch(/Spelled by sound, so it is approximate/);
  });

  it("spells from the form, puts the name in the address, and says plainly when the Bible has no such name", async () => {
    serveData();
    renderAt("/name-in-hebrew");
    fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), { target: { value: "  emma " } });
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(address).toBe("/name-in-hebrew?name=Emma");
    expect(await screen.findByText(/Emma isn't spelled this way in the Bible/)).toBeInTheDocument();
    expect(within(card("Hebrew")).getByText("אמה")).toBeInTheDocument();
    expect(within(card("Greek")).getByText("Εμα")).toBeInTheDocument();
    expect(within(card("Hebrew")).queryByText("In the Bible")).toBeNull();
  });

  it("finds another spelling under its Bible name, and runs an example", async () => {
    serveData();
    renderAt("/name-in-hebrew?name=Emmanuel");
    expect(await screen.findByText("Found under Immanuel (also written Emmanuel)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Peter" }));
    expect(address).toBe("/name-in-hebrew?name=Peter");
    expect(await screen.findByText("The Aramaic name in the Bible: Cephas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "John 1:42" })).toHaveAttribute("href", "/read/bsb/JHN/1?hl=42");
  });

  it("shows a name of God as the Bible writes it, never by sound", async () => {
    serveData();
    renderAt("/name-in-hebrew?name=Yahweh");
    expect(await screen.findByText("A name of God in the Bible")).toBeInTheDocument();
    expect(within(card("Hebrew")).getByText("יהוה")).toBeInTheDocument();
    for (const title of ["Hebrew", "Greek", "Aramaic"]) expect(within(card(title)).queryByText(/^By sound/)).toBeNull();
  });

  it("drops what is not a Latin letter and says so", () => {
    serveData();
    renderAt("/name-in-hebrew?name=Anna%3Cb%3E2");
    expect(screen.getByRole("heading", { level: 2, name: "Annab" })).toBeInTheDocument();
    expect(screen.getByText(/Only Latin letters/)).toBeInTheDocument();
  });

  it("still spells by sound when the Bible names cannot be loaded, and tries again", async () => {
    serveData({ down: true });
    renderAt("/name-in-hebrew?name=Sarah");
    expect(await screen.findByText(/We couldn't check the Bible's names just now/)).toBeInTheDocument();
    expect(within(card("Hebrew")).getByText("By sound, as Hebrew writes names today")).toBeInTheDocument();
    expect(screen.queryByText(/isn't spelled this way/)).toBeNull();
    serveData();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await result("Sarah").findByText(`“${row("sarah").m}”`)).toBeInTheDocument();
  });

  it("copies a spelling where the browser allows it, and prints a card", async () => {
    serveData();
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/name-in-hebrew?name=Emma");
    await screen.findByText(/Emma isn't spelled this way/);
    fireEvent.click(within(card("Hebrew")).getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("אמה");
    expect(await within(card("Hebrew")).findByRole("button", { name: "Copied" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Print a card" }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });

  it("is live on the tools hub at its own address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "name-in-hebrew");
    expect(entry && isLive(entry) && entry.path).toBe(NAME_IN_HEBREW_PATH);
  });
});
