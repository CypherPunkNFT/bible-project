// The list pages and name pages (design 7.2, "Vitest"), rendered against the real built data: every /data/ request is
// answered from the repository's data/ folder in place of the network.
import { existsSync, readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NameDocument, NamesIndex } from "@/data/baby-names";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import BabyNamesPage from "./BabyNamesPage";
import { WHOLE_LIST } from "./NameVerses";
import { forgetBabyNames } from "./useBabyNames";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const index = JSON.parse(readFileSync("data/baby-names/index.json", "utf8")) as NamesIndex;
const nameFile = (slug: string) => JSON.parse(readFileSync(`data/baby-names/names/${slug}.json`, "utf8")) as NameDocument;

function serveData() {
  const fetchMock = vi.fn(async (url: string) => {
    const path = `data/${decodeURIComponent(String(url).replace(/^\/data\//, "").split("?")[0])}`;
    if (!String(url).startsWith("/data/") || path.includes("..") || !existsSync(path)) {
      return { ok: false, status: 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
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

function renderAt(path: string) {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <Probe />
        <Routes><Route path="/baby-names/*" element={<BabyNamesPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

const robots = () => document.head.querySelector('meta[name="robots"]');
const firstLongParagraph = (container: HTMLElement) => [...container.querySelectorAll("p")].find((p) => (p.textContent ?? "").length >= 60);

beforeEach(() => { forgetBabyNames(); serveData(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("baby names: the list pages", () => {
  it("opens the hub with its heading, its opening paragraph first, the well-known names A to Z and no load-more button", async () => {
    const { container } = renderAt("/baby-names");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Biblical Baby Names");
    await screen.findByRole("searchbox", { name: "Search names" });
    const full = index.names.filter((row) => row.f === 1);
    expect(screen.getByText(`${full.length.toLocaleString("en")} names`)).toBeInTheDocument();
    expect(firstLongParagraph(container)?.textContent).toMatch(/^1,8\d\d names borne by people in the Bible/);
    const links = [...container.querySelectorAll<HTMLAnchorElement>(".bn-row-name")];
    expect(links.length).toBeGreaterThanOrEqual(20);
    expect(links.length).toBeLessThan(full.length);
    expect(links[0].getAttribute("href")).toBe(`/baby-names/${[...full].sort((a, b) => a.n.localeCompare(b.n, "en"))[0].s}`);
    expect(screen.queryByRole("button", { name: /load more|show more/i })).toBeNull();
  });

  it("gives the boy and girl pages their own heading and starting filter", async () => {
    const { container, unmount } = renderAt("/baby-names/boys");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Biblical Boy Names");
    await screen.findByRole("searchbox", { name: "Search names" });
    expect(screen.getByRole("button", { name: "Boy" })).toHaveAttribute("aria-pressed", "true");
    const genders = [...container.querySelectorAll(".bn-gender")].map((item) => item.textContent);
    expect(genders.every((text) => text === "Boy" || text === "Boy & girl")).toBe(true);
    unmount();
    renderAt("/baby-names/girls");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Biblical Girl Names");
    expect(await screen.findByRole("button", { name: "Girl" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the filters in the address and reads them back from it", async () => {
    renderAt("/baby-names?g=girl&t=nt&l=m");
    await screen.findByRole("searchbox", { name: "Search names" });
    expect(screen.getByRole("button", { name: "Girl" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: "Mary" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Old Testament" }));
    expect(address).toBe("/baby-names?g=girl&t=ot&l=m");
    expect(screen.getByRole("link", { name: "Miriam" })).toBeInTheDocument();
  });

  it("finds a name by another spelling as the visitor types", async () => {
    renderAt("/baby-names");
    fireEvent.change(await screen.findByRole("searchbox", { name: "Search names" }), { target: { value: "Elias" } });
    expect(screen.getByRole("link", { name: "Elijah" })).toBeInTheDocument();
    expect(address).toBe("/baby-names?q=Elias");
  });

  it("offers to remove each filter when nothing matches", async () => {
    renderAt("/baby-names?g=girl&q=zzz");
    expect(await screen.findByText("No names match all of these. Remove a filter:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: 'Search "zzz" ×' }));
    expect(address).toBe("/baby-names?g=girl");
    expect(screen.queryByText(/No names match/)).toBeNull();
  });
});

describe("baby names: a name page", () => {
  it("links Jesus to the Gospels and person page without reducing His story to a bearer card", async () => {
    renderAt("/baby-names/jesus");
    await screen.findByRole("heading", { level: 1, name: /Jesus/ });
    expect(screen.getByRole("link", { name: "The Gospels: the life of Jesus" })).toHaveAttribute("href", "/study/gospels");
    expect(screen.getByRole("link", { name: "Jesus among the people of the Bible" })).toHaveAttribute("href", "/people/jesus-isa-7-14");
    expect(screen.queryByRole("link", { name: "Read Jesus's full story" })).toBeNull();
    expect(screen.getByRole("link", { name: "Read Justus's full story" })).toHaveAttribute("href", "/people/justus-col-4-11");
  });

  it("links a place name to its selected place in the existing atlas", async () => {
    const bethany = nameFile("bethany");
    renderAt("/baby-names/bethany");
    await screen.findByRole("heading", { level: 2, name: "The place called Bethany" });
    expect(screen.getByRole("link", { name: "Bethany in the atlas" })).toHaveAttribute("href", `/atlas?place=${encodeURIComponent(bethany.places[0].id)}#places-map`);
  });

  it("shows the heading, the opening as the first long paragraph, the meaning, the bearer and the quoted verses", async () => {
    const hannah = nameFile("hannah");
    const { container } = renderAt("/baby-names/hannah");
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Hannah: Meaning in the Bible");
    expect(heading.querySelector('[translate="no"]')?.textContent).toBe("Hannah");
    expect(firstLongParagraph(container)?.textContent).toBe(hannah.opening);
    expect(screen.getByText("“favored”")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read Hannah's full story" })).toHaveAttribute("href", "/people/hannah-1sa-1-2");
    await waitFor(() => expect(container.querySelector(".scripture")).not.toBeNull());
    const verse = container.querySelector(".scripture")!;
    expect(verse.getAttribute("lang")).toBe("en");
    expect(verse.textContent).toMatch(/Hannah/);
    expect(container.querySelector('a.bn-ref[href="/read/bsb/1SA/1?hl=2"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Anna" })[0]).toHaveAttribute("href", "/baby-names/anna");
    expect(screen.getByRole("link", { name: "Verses for a new baby" })).toHaveAttribute("href", "/life-events/new-baby");
    expect(robots()).toBeNull();
  });

  it("asks search engines not to index a short page, and takes the tag away on leaving", async () => {
    const { unmount } = renderAt("/baby-names/abagtha");
    await screen.findByRole("heading", { level: 1, name: /Abagtha/ });
    expect(robots()?.getAttribute("content")).toBe("noindex,follow");
    unmount();
    expect(robots()).toBeNull();
  });

  it("gives Noah one meaning block for each original word", async () => {
    const { container } = renderAt("/baby-names/noah");
    await screen.findByRole("heading", { level: 2, name: "What the name means" });
    expect(container.querySelectorAll(".bn-meaning")).toHaveLength(2);
    expect(screen.getByText("Boy's and girl's name")).toBeInTheDocument();
  });

  it("distinguishes Mary's Greek spelling from its Hebrew origin", async () => {
    const { container } = renderAt("/baby-names/mary");
    await screen.findByRole("heading", { level: 1, name: /Mary/ });
    expect(container.querySelector(".bn-facts")?.textContent).toContain("Greek, from Hebrew");
    expect(container.querySelector('.bn-facts [lang="grc"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Open Scriptures Hebrew Bible Project" })).toHaveAttribute("href", "https://github.com/openscriptures/HebrewLexicon");
  });

  it("draws a long verse list a window at a time, reading chapters rather than whole books", async () => {
    const david = nameFile("david");
    expect(david.verses.length).toBeGreaterThan(WHOLE_LIST);
    const fetchMock = serveData();
    const { container } = renderAt("/baby-names/david");
    await screen.findByRole("heading", { level: 2, name: /Every verse that names David/ });
    const rows = container.querySelectorAll(".bn-verses li");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(david.verses.length);
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("/data/text/bsb/"))).toBe(true));
  });
});

describe("baby names: addresses", () => {
  it("shows the site's not-found page for a name that has no page", async () => {
    renderAt("/baby-names/not-a-biblical-name");
    expect(await screen.findByRole("heading", { level: 1, name: "Nothing is written here." })).toBeInTheDocument();
    cleanup();
    renderAt("/baby-names/boys/extra");
    expect(await screen.findByRole("heading", { level: 1, name: "Nothing is written here." })).toBeInTheDocument();
  });

  it("sends another spelling to its page, saying so", async () => {
    renderAt("/baby-names/Elias");
    await screen.findByRole("heading", { level: 1, name: /Elijah/ });
    expect(address).toBe("/baby-names/elijah");
    expect(screen.getByText(/Elias is another spelling of/)).toBeInTheDocument();
  });

  it("corrects capitals in place", async () => {
    renderAt("/baby-names/Hannah");
    await screen.findByRole("heading", { level: 1, name: /Hannah/ });
    expect(address).toBe("/baby-names/hannah");
    expect(screen.queryByText(/another spelling/)).toBeNull();
  });

  it("offers to try again when the names cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, headers: { get: () => "text/plain" }, json: async () => ({}) })));
    renderAt("/baby-names");
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    serveData();
    await act(async () => { fireEvent.click(within(alert).getByRole("button", { name: "Try again" })); });
    expect(await screen.findByRole("searchbox", { name: "Search names" })).toBeInTheDocument();
  });
});
