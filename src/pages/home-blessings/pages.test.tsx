// The blessings pages as a reader meets them (design 9.3, "Pages"; "Copy and send"): the hub with its four groups and the
// children's band, every page with its items, kind labels, verses, notes, glosses and source lines, an unknown address,
// the tab title, a shared link, copying, sending and printing.
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLESSING_PAGES, DEATH_NOTE, GROUPS, OLDER_TEXTS, pageBySlug, type BlessingItem, type BlessingPage } from "@/data/home-blessings";
import { DEFAULT_TITLE } from "@/lib/page-head";
import { removeFonts } from "@/pages/life-events/test-kit";
import { BSB_LINE, OLDER_LINE } from "./BlessingPage";
import { NO_PRINT_LINE } from "./PrintChooser";
import { descriptionParagraph, renderAt, serveBerean, versesLoaded } from "./test-kit";

const scroll = vi.fn();
let fetchMock: ReturnType<typeof serveBerean>;
beforeEach(() => {
  fetchMock = serveBerean();
  removeFonts();
  scroll.mockClear();
  Element.prototype.scrollIntoView = scroll;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.documentElement.classList.remove("print-sheet-active"); });

const KIND_LABEL = { written: "Written for Bible Guide", "fill-in": "A card to fill in", scripture: "Scripture · Berean Standard Bible" };
const kindLabel = (item: BlessingItem) => (item.kind === "older" ? item.label : KIND_LABEL[item.kind]);
const section = (id: string) => document.getElementById(id) as HTMLElement;

/** Every verse drawn beneath an item or at a station, with its note. */
function rootPassages(page: BlessingPage) {
  return [
    ...page.items.flatMap((item) => (item.kind === "written" || item.kind === "fill-in" ? item.rootedIn : [])),
    ...(page.stations ?? []).flatMap((station) => [station.reading, ...station.rootedIn, ...(station.aside ? [station.aside] : [])]),
  ];
}

describe("the hub", () => {
  it("shows four groups and eight cards in order, the children's band, its introduction as the description, and fetches no verse", () => {
    renderAt("/blessings");
    expect(screen.getByRole("heading", { level: 1, name: "Blessings for the Home" })).toBeVisible();
    for (const group of GROUPS) expect(screen.getByRole("heading", { level: 2, name: group.title })).toBeVisible();
    expect([...document.querySelectorAll(".hb-grid a")].map((card) => card.getAttribute("href"))).toEqual(BLESSING_PAGES.map((page) => `/blessings/${page.slug}`));
    const band = document.querySelector(".hb-band")!;
    expect(within(band as HTMLElement).getByRole("heading", { level: 2, name: "For children" })).toBeVisible();
    expect([...band.querySelectorAll(".hb-grid a strong")].map((card) => card.textContent)).toEqual(BLESSING_PAGES.filter((page) => page.group === "children").map((page) => page.label));
    expect(descriptionParagraph()).toMatch(/^Words to bless your home/);
    expect(screen.getByRole("link", { name: /Prayers for life's occasions/ })).toHaveAttribute("href", "/prayers");
    expect(document.querySelector("div.hb-source")?.textContent).toContain(OLDER_LINE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts each card with the first words of the page's featured item", () => {
    renderAt("/blessings");
    const lines = [...document.querySelectorAll(".hb-grid a span")].map((line) => line.textContent ?? "");
    expect(lines[0]).toMatch(/^Peace to this house/);
    expect(lines[2]).toBe("Come, Lord Jesus, be our Guest…");
    expect(lines[6]).toMatch(/^Goodnight\. God made/);
    for (const line of lines) expect(line).not.toMatch(/\[name\]|[,;:]$/);
    for (const line of lines) expect(line.length).toBeGreaterThan(5);
  });
});

describe("a blessings page", () => {
  it.each(BLESSING_PAGES.map((page) => [page.slug, page] as const))("%s shows every part the design lists", async (_, page) => {
    renderAt(`/blessings/${page.slug}`);
    expect(screen.getByRole("heading", { level: 1, name: page.heading })).toBeVisible();
    expect(descriptionParagraph()).toBe(page.intro);
    for (const item of page.items) {
      const panel = section(item.id);
      expect(panel.querySelector(".hb-kind")?.textContent, item.id).toBe(kindLabel(item));
      if (item.kind === "written") expect(panel.querySelector(".hb-written")?.textContent).toBe(item.text);
      if (item.kind === "older") {
        const text = OLDER_TEXTS[item.id];
        const words = panel.querySelector("blockquote.hb-older")!;
        expect(words.getAttribute("lang")).toBe("en");
        expect([...words.querySelectorAll(".hb-line")].map((line) => line.textContent)).toEqual(text.lines.filter(Boolean));
        for (const gloss of text.glosses ?? []) expect([...panel.querySelectorAll(".hb-glosses dt")].map((dt) => dt.textContent)).toContain(gloss.word);
        expect(panel.textContent).toContain(text.source);
        if (text.note) expect(panel.textContent).toContain(text.note);
      }
      if (item.kind === "fill-in") expect([...panel.querySelectorAll(".hb-prompts li")].map((li) => li.textContent)).toEqual(item.prompts);
    }
    for (const station of page.stations ?? []) expect(section(station.id).textContent).toContain(station.prayer);
    await versesLoaded();
    for (const item of page.items) {
      if (item.kind !== "scripture") continue;
      const verse = section(item.id).querySelector("blockquote.scripture")!;
      expect(verse.getAttribute("lang")).toBe("en");
      expect(verse.textContent?.length).toBeGreaterThan(20);
      if (item.setting) expect(section(item.id).textContent).toContain(item.setting);
    }
    const roots = rootPassages(page);
    const drawn = document.querySelectorAll(".hb-root");
    expect(drawn).toHaveLength(roots.length);
    for (const root of drawn) {
      expect(root.querySelector("blockquote.scripture")?.getAttribute("lang")).toBe("en");
      expect(root.querySelector(".hb-reference a")?.getAttribute("href")).toMatch(/^\/read\/bsb\/[A-Z0-9]+\/\d+/);
    }
    for (const passage of roots) {
      expect(document.body.textContent).toContain(passage.note);
      if (passage.context) expect(document.body.textContent).toContain(passage.context);
    }
    expect(new Set([...document.querySelectorAll("[id]")].map((element) => element.id)).size).toBe(document.querySelectorAll("[id]").length);
    const source = [...document.querySelectorAll("div.hb-source")].at(-1)!.textContent!;
    expect(source).toContain(BSB_LINE);
    expect(source.includes(OLDER_LINE)).toBe(page.items.some((item) => item.kind === "older"));
    const more = screen.getByRole("region", { name: "Explore more" });
    for (const topic of page.topics) expect(within(more).getByRole("link", { name: topic.title })).toHaveAttribute("href", `/topics/${topic.slug}`);
    for (const slug of page.related) expect(within(more).getByRole("link", { name: pageBySlug(slug)!.heading })).toHaveAttribute("href", `/blessings/${slug}`);
  });

  it("shows the death-line note beside “Now I lay me down to sleep” and under Duncan's third verse", async () => {
    renderAt("/blessings/bedtime");
    expect(section("now-i-lay-me").textContent).toContain(DEATH_NOTE);
    const extra = section("duncan-shepherd").querySelector(".hb-extra")!;
    expect(extra.textContent).toContain("Take me, when I die, to heaven,");
    expect(extra.textContent).toContain(DEATH_NOTE);
    await versesLoaded();
  });

  it("puts the note for parents after the words on a children's page, and before them elsewhere", async () => {
    renderAt("/blessings/blessing-your-children");
    const how = document.querySelector(".hb-how")!;
    expect(screen.getByRole("link", { name: "The Good News" })).toHaveAttribute("href", "/study/the-good-news");
    expect(section("child-who-is-afraid").compareDocumentPosition(how) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await versesLoaded();
    cleanup();
    renderAt("/blessings/house-blessing");
    expect(document.querySelector(".hb-how")!.compareDocumentPosition(section("front-door")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await versesLoaded();
  });

  it("shows the site's not-found page for an unknown blessings page", () => {
    renderAt("/blessings/no-such-page");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nothing is written here.");
  });

  it("names the tab with its search title and puts the default back when the page is left", async () => {
    const { unmount } = renderAt("/blessings/before-meals");
    expect(document.title).toBe(`${pageBySlug("before-meals")!.searchTitle} · Bible Guide`);
    await versesLoaded();
    unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it("opens a shared link at the item it names once the verses have drawn, and ignores a malformed one", async () => {
    renderAt("/blessings/before-meals#every-day");
    await versesLoaded();
    await waitFor(() => expect(scroll).toHaveBeenCalled());
    expect(scroll.mock.contexts.at(-1)).toBe(section("every-day"));
    cleanup();
    scroll.mockClear();
    renderAt("/blessings/before-meals#%E0%A4%A");
    await versesLoaded();
    expect(scroll).not.toHaveBeenCalled();
  });

  it("offers Send only on the housewarming blessing and the Scripture blessings", async () => {
    renderAt("/blessings/house-blessing");
    await versesLoaded();
    expect(within(section("for-a-new-home")).getByRole("button", { name: "Send" })).toBeVisible();
    expect(within(section("front-door")).queryByRole("button", { name: "Send" })).toBeNull();
    expect(within(section("guiterman-house")).queryByRole("button", { name: "Send" })).toBeNull();
    expect(within(section("luke-10-5")).getByRole("button", { name: "Send" })).toBeVisible();
  });
});

describe("copying and sending", () => {
  it("copies the words, the source line and the site's own address with the item's anchor", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderAt("/blessings/before-meals");
    await versesLoaded();
    fireEvent.click(within(section("cennick-table")).getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toBe(`${OLDER_TEXTS["cennick-table"].lines.join("\n")}\n\n— John Cennick, 1741\nhttps://bibleguide.io/blessings/before-meals#cennick-table`);
  });

  it("builds the housewarming message with the typed name, keeping the name out of the address, storage and requests", async () => {
    renderAt("/blessings/house-blessing");
    await versesLoaded();
    const panel = section("for-a-new-home");
    fireEvent.click(within(panel).getByRole("button", { name: "Send" }));
    const preview = panel.querySelector(".hb-preview")!;
    expect(preview.textContent).toMatch(/^So glad for you and your new home\.\n\nMay God bless your new home, \[name\], and everyone/);
    fireEvent.change(within(panel).getByLabelText(/Their name/), { target: { value: "Grace" } });
    expect(preview.textContent).toContain("May God bless your new home, Grace, and everyone");
    expect(preview.getAttribute("translate")).toBe("no");
    expect(preview.textContent).toMatch(/— A blessing for someone's new home, Bible Guide\n\nhttps:\/\/bibleguide\.io\/blessings\/house-blessing#for-a-new-home$/);
    expect(within(panel).getByRole("link", { name: "Email" }).getAttribute("href")).toContain(encodeURIComponent("your new home, Grace,"));
    expect(within(panel).getByRole("link", { name: "Text message" }).getAttribute("href")).toMatch(/^sms:\?&body=/);
    expect(window.location.href).not.toContain("Grace");
    expect(JSON.stringify({ ...localStorage })).not.toContain("Grace");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("Grace");
    expect(fetchMock.mock.calls.flat().join(" ")).not.toContain("Grace");
  });
});

describe("printing", () => {
  it("prints one item on the paper chosen, with the name heading drawn apart from the words", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/blessings/bedtime");
    await versesLoaded();
    const panel = section("wesley-gentle");
    fireEvent.click(within(panel).getByRole("button", { name: "Print…" }));
    fireEvent.click(within(panel).getByLabelText("Colouring page"));
    fireEvent.click(within(panel).getByLabelText("A4"));
    fireEvent.change(within(panel).getByLabelText(/A heading above the words/), { target: { value: "For Lily" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Print now" }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    const sheets = document.querySelectorAll(".print-sheet-portal .hbs-sheet");
    expect(sheets).toHaveLength(1);
    expect(sheets[0].getAttribute("data-layout")).toBe("colouring");
    expect(sheets[0].querySelector(".hbs-name-heading")?.textContent).toBe("For Lily");
    expect(sheets[0].querySelector(".hbs-words")?.textContent).not.toContain("Lily");
    expect(sheets[0].textContent).not.toContain("Jesus, tender shepherd");
    expect(document.getElementById("print-sheet-page")?.textContent).toContain("size: 210mm 297mm; margin: 0;");
  });

  it("prints a set of the graces ticked, four cards to a sheet", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/blessings/before-meals");
    await versesLoaded();
    const set = screen.getByRole("region", { name: "Print a set" });
    const boxes = within(set).getAllByRole("checkbox").filter((box) => box.closest(".hb-set-list"));
    for (const box of boxes.slice(0, 5)) fireEvent.click(box);
    fireEvent.click(within(set).getByRole("button", { name: "Print 5 cards" }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    const sheets = document.querySelectorAll(".print-sheet-portal .hbs-sheet");
    expect(sheets).toHaveLength(2);
    expect(document.querySelectorAll(".print-sheet-portal .hbs-card")).toHaveLength(5);
  });

  it("prints only the rooms ticked in the room-by-room order, with page margins", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderAt("/blessings/room-by-room");
    await versesLoaded();
    const order = screen.getByRole("region", { name: "Print the order" });
    fireEvent.click(within(order).getByLabelText("Where food is made and shared"));
    fireEvent.click(within(order).getByLabelText("Letter"));
    fireEvent.click(within(order).getByRole("button", { name: "Print the order" }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    const stations = [...document.querySelectorAll(".print-sheet-portal [data-station]")].map((station) => station.getAttribute("data-station"));
    const page = pageBySlug("room-by-room")!;
    expect(stations).toEqual(page.stations!.map((station) => station.id).filter((id) => id !== "where-food-is-shared"));
    expect(document.querySelector(".print-sheet-portal .hbs-closing")?.textContent).toContain("Praise Father, Son, and Holy Ghost.");
    expect(document.getElementById("print-sheet-page")?.textContent).toContain("margin: 0.75in;");
  });

  it("hides every print button where the browser cannot print, and says how to print instead", async () => {
    vi.stubGlobal("print", undefined);
    renderAt("/blessings/bedtime");
    await versesLoaded();
    expect(screen.queryByRole("button", { name: "Print…" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Print a set" })).toBeNull();
    expect(screen.getAllByText(NO_PRINT_LINE).length).toBeGreaterThan(0);
  });
});
