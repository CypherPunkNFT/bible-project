// The hub and loss pages, the help strip, and the link from the life-event "expecting" pack (design 7.4, "Page tests",
// "Life-event link").
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOSS_SETS } from "@/data/sympathy";
import { removeFonts, renderAt, serveBerean } from "./test-kit";

beforeEach(() => { removeFonts(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("sympathy: the hub", () => {
  it("lists the funeral readings first, then the twelve loss pages by reference only", async () => {
    const fetchMock = serveBerean();
    renderAt("/sympathy");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible Verses for Sympathy Cards");
    const losses = screen.getByRole("region", { name: "Choose the loss" });
    const links = within(losses).getAllByRole("link");
    expect(links[0].getAttribute("href")).toBe("/sympathy/funeral-readings");
    expect(links.slice(1).map((link) => link.getAttribute("href"))).toEqual(LOSS_SETS.map((set) => `/sympathy/${set.slug}`));
    expect(links[1].textContent).toContain("Psalm 34:18");
    // The menu itself fetches no Bible text: only the hub's own verses (Psalms, Matthew, ...) are requested.
    await screen.findByRole("heading", { level: 2, name: "Verses for any loss" });
    expect(fetchMock.mock.calls.map(([url]) => String(url)).some((url) => url.includes("/SNG.json"))).toBe(false);
  });

  it("shows the guide to what to write, with what to leave out and why", () => {
    serveBerean();
    renderAt("/sympathy");
    const guide = screen.getByRole("region", { name: "What to write in a sympathy card" });
    expect(guide.id).toBe("what-to-write");
    expect(within(guide).getByText("God needed another angel.")).toBeInTheDocument();
    expect(within(guide).getByText(/1 Corinthians 10:13 is about temptation/)).toBeInTheDocument();
    expect(within(guide).getByText("I'll always remember [their name]'s laugh.")).toBeInTheDocument();
  });
});

describe("sympathy: a loss page", () => {
  it("shows the heading, the introduction as the first long paragraph, every reference, context notes and labels", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/loss-of-mother");
    const mother = LOSS_SETS.find((set) => set.slug === "loss-of-mother")!;
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible Verses for the Loss of a Mother");
    const firstLong = [...container.querySelectorAll("p")].find((paragraph) => (paragraph.textContent ?? "").length >= 60);
    expect(firstLong?.textContent).toBe(mother.intro);
    await screen.findByRole("heading", { level: 2, name: "Passages to read" });
    const references = [...container.querySelectorAll(".sy-reference")].map((link) => link.textContent);
    expect(references).toHaveLength(12);
    for (const reference of ["Psalm 34:18", "Isaiah 66:13a", "Proverbs 31:25–31", "1 Thessalonians 4:13–14", "John 14:1–3"]) expect(references).toContain(reference);
    expect(screen.getByText(/do not grieve like the rest, who are without hope/)).toBeInTheDocument();
    const labelled = [...container.querySelectorAll(".sy-passage")].filter((item) => item.querySelector(".sy-label"));
    expect(labelled.map((item) => item.querySelector(".sy-reference")?.textContent)).toEqual(["1 Thessalonians 4:13–14", "John 14:1–3"]);
    expect(within(container.querySelector("#verses")!).getByRole("heading", { level: 2 }).textContent).toBe("Verses for a card");
  });

  it("shows Berean text inside .scripture with lang=en, tidied where it was cut from a verse", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/loss-of-mother");
    await screen.findByRole("heading", { level: 2, name: "Passages to read" });
    const texts = [...container.querySelectorAll(".sy-text")];
    for (const verse of texts) {
      expect(verse.classList.contains("scripture")).toBe(true);
      expect(verse.getAttribute("lang")).toBe("en");
    }
    expect(texts.map((verse) => verse.textContent)).toContain("As a mother comforts her son, so will I comfort you…");
  });

  it("shows the help strip on the suicide page only, built from the help directory's data", async () => {
    serveBerean();
    renderAt("/sympathy/loss-to-suicide");
    const strip = await screen.findByRole("complementary", { name: "Help if you are struggling" });
    expect(within(strip).getByText("If you're struggling yourself, you can call or text 988, any time, day or night.")).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "Call 988" }).getAttribute("href")).toBe("tel:988");
    expect(within(strip).getByRole("link", { name: "Text 988" }).getAttribute("href")).toBe("sms:988");
    expect(within(strip).getByRole("link", { name: "Outside the US: find a helpline" }).getAttribute("href")).toBe("https://findahelpline.com/");
    expect(within(strip).getByRole("link", { name: "Groups for people who have lost someone to suicide" }).getAttribute("href")).toBe("https://afsp.org/find-a-support-group/");
    expect(screen.getByRole("heading", { level: 2, name: "For those left behind" })).toBeInTheDocument();
    cleanup();
    for (const slug of ["loss-of-child", "faith-unknown"]) {
      renderAt(`/sympathy/${slug}`);
      await screen.findByRole("heading", { level: 2, name: "Verses for a card" });
      expect(screen.queryByRole("complementary", { name: "Help if you are struggling" })).toBeNull();
      cleanup();
    }
  });

  it("puts the explainer after the verses on the baby page", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/loss-of-baby");
    await screen.findByRole("heading", { level: 2, name: "Passages to read" });
    const explainer = screen.getByRole("heading", { level: 2, name: "Where is my baby now?" }).closest("section")!;
    const verses = container.querySelector("#verses")!;
    expect(verses.compareDocumentPosition(explainer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(explainer.textContent).toMatch(/does not rule on the question/);
  });

  it("links to its topics, sibling loss pages, the funeral readings, grief support and the writing guide", () => {
    serveBerean();
    renderAt("/sympathy/loss-of-spouse");
    const more = screen.getByRole("region", { name: "Explore more" });
    expect(within(more).getByRole("link", { name: "Topic: Widows" }).getAttribute("href")).toBe("/topics/widows");
    expect(within(more).getByRole("link", { name: "Bible readings for a funeral" }).getAttribute("href")).toBe("/sympathy/funeral-readings");
    expect(within(more).getByRole("link", { name: "Bible Verses for the Loss of a Mother" }).getAttribute("href")).toBe("/sympathy/loss-of-mother");
    expect(within(more).getByRole("link", { name: "Grief support near you" }).getAttribute("href")).toBe("/resources/life");
    expect(screen.getByRole("link", { name: /short guide to what to write/ }).getAttribute("href")).toBe("/sympathy#what-to-write");
  });

  it("shows the site's own not-found page for an unknown loss page", () => {
    serveBerean();
    renderAt("/sympathy/no-such-loss");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nothing is written here.");
  });

  it("says when the verses cannot load, keeps sending disabled with the reason, and loads them on Retry", async () => {
    serveBerean({ fail: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt("/sympathy/sudden-loss");
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByRole("alert").textContent).toMatch(/could not be loaded/);
    expect(screen.getAllByRole("button", { name: /could not be loaded/ })[0]).toBeDisabled();
    serveBerean();
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { level: 2, name: "Verses for a card" })).toBeInTheDocument();
  });

  it("selects a card verse in the card maker with its Use on card button; readings have none", async () => {
    serveBerean();
    renderAt("/sympathy/loss-of-father");
    const button = await screen.findByRole("button", { name: "Use Psalm 103:13 on the card" });
    expect(screen.queryByRole("button", { name: "Use Psalm 121:1–8 on the card" })).toBeNull();
    fireEvent.click(button);
    const picker = screen.getByRole("combobox", { name: "Verse" }) as HTMLSelectElement;
    await waitFor(() => expect(picker.selectedOptions[0].textContent).toBe("Psalm 103:13"));
  });
});

describe("sympathy: the link from the life-event expecting pack", () => {
  it("shows \"If you have lost a baby\" in the expecting pack's Explore more, pointing at the baby page", () => {
    serveBerean();
    renderAt("/life-events/expecting");
    const more = screen.getByRole("region", { name: "Explore more" });
    expect(within(more).getByRole("link", { name: "If you have lost a baby" }).getAttribute("href")).toBe("/sympathy/loss-of-baby");
    cleanup();
    renderAt("/life-events/new-baby");
    expect(within(screen.getByRole("region", { name: "Explore more" })).queryByRole("link", { name: "If you have lost a baby" })).toBeNull();
  });
});
