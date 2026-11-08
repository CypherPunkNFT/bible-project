// The hub and pack pages (design 7.3, "Page tests").
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIFE_EVENTS } from "@/data/life-events";
import { removeFonts, renderAt, serveBerean } from "./test-kit";

beforeEach(() => { removeFonts(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("life events: the hub", () => {
  it("lists every pack in its family, by reference only, without fetching any Bible text", () => {
    const fetchMock = serveBerean();
    renderAt("/life-events");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible Verses for Life's Big Moments");
    const cards = [...document.querySelectorAll("a.le-hub-card")];
    expect(cards.map((card) => card.getAttribute("href"))).toEqual(LIFE_EVENTS.map((event) => `/life-events/${event.slug}`));
    expect(cards.map((card) => card.querySelector("h3")?.textContent)).toEqual(LIFE_EVENTS.map((event) => event.short));
    for (const family of ["Love and marriage", "New life", "Faith", "Growing and working"]) expect(screen.getByRole("heading", { level: 2, name: family })).toBeInTheDocument();
    expect(cards[1].textContent).toContain("Ecclesiastes 4:12b");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("life events: a pack page", () => {
  it("shows the heading, the introduction as the first long paragraph, every passage's reference, and its context notes", async () => {
    serveBerean();
    const { container } = renderAt("/life-events/wedding");
    const wedding = LIFE_EVENTS.find((event) => event.slug === "wedding")!;
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bible Verses for a Wedding");
    const firstLong = [...container.querySelectorAll("p")].find((paragraph) => (paragraph.textContent ?? "").length >= 60);
    expect(firstLong?.textContent).toBe(wedding.intro);
    await screen.findByRole("heading", { level: 2, name: "Readings for the ceremony" });
    const references = [...container.querySelectorAll(".le-reference")].map((link) => link.textContent);
    expect(references).toHaveLength(16);
    for (const reference of ["Genesis 2:18–24", "1 Corinthians 13:4–8a", "Ecclesiastes 4:12b", "Mark 10:9", "Numbers 6:24–26"]) expect(references).toContain(reference);
    expect(screen.getByText(/Ruth spoke these words to her mother-in-law Naomi/)).toBeInTheDocument();
    expect(container.querySelector('a.le-reference[href="/read/bsb/GEN/2?hl=18-24"]')).not.toBeNull();
    expect(screen.getByText("Scripture quotations are from the Berean Standard Bible (public domain).")).toBeInTheDocument();
  });

  it("shows Berean text inside .scripture with lang=en, tidied where it was cut from a speech", async () => {
    serveBerean();
    const { container } = renderAt("/life-events/wedding");
    await screen.findByRole("heading", { level: 2, name: "Verses for a card" });
    expect([...container.querySelectorAll(".le-text")].map((verse) => verse.textContent)).toContain("Therefore what God has joined together, let man not separate.");
    for (const verse of container.querySelectorAll(".le-text")) {
      expect(verse.classList.contains("scripture")).toBe(true);
      expect(verse.getAttribute("lang")).toBe("en");
    }
    expect([...container.querySelectorAll(".le-text")].map((verse) => verse.textContent)).toContain("A cord of three strands is not quickly broken.");
  });

  it("leaves out a role section that has no passages, heading and all", async () => {
    serveBerean();
    renderAt("/life-events/back-to-school");
    await screen.findByRole("heading", { level: 2, name: "Verses for a card" });
    expect(screen.queryByRole("heading", { level: 2, name: "Readings for the ceremony" })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "A blessing to speak" })).toBeInTheDocument();
    cleanup();
    renderAt("/life-events/new-believer");
    await screen.findByRole("heading", { level: 2, name: "Verses for a card" });
    expect(screen.queryByRole("heading", { level: 2, name: "A blessing to speak" })).toBeNull();
  });

  it("shows the explainer and the deacon sub-heading on the ordination page", async () => {
    serveBerean();
    renderAt("/life-events/ordination");
    expect(screen.getByRole("heading", { level: 2, name: "What ordination is in a Baptist church" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 3, name: "For deacons" })).toBeInTheDocument();
  });

  it("links to its topic pages and sibling packs", () => {
    serveBerean();
    renderAt("/life-events/wedding");
    const more = screen.getByRole("region", { name: "Explore more" });
    expect(within(more).getByRole("link", { name: "Topic: Marriage" }).getAttribute("href")).toBe("/topics/marriage");
    expect(within(more).getByRole("link", { name: "Bible Verses for an Engagement" }).getAttribute("href")).toBe("/life-events/engagement");
  });

  it("shows the site's own not-found page for an unknown pack", () => {
    serveBerean();
    renderAt("/life-events/no-such-pack");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nothing is written here.");
  });

  it("says when the verses cannot load, and loads them on Retry", async () => {
    serveBerean({ fail: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt("/life-events/graduation");
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByRole("alert").textContent).toMatch(/could not be loaded/);
    expect(screen.getByRole("button", { name: "Waiting for the verses…" })).toBeDisabled();
    serveBerean();
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { level: 2, name: "Verses for a card" })).toBeInTheDocument();
  });

  it("selects a verse in the card maker with its Use on card button", async () => {
    serveBerean();
    renderAt("/life-events/wedding");
    const button = await screen.findByRole("button", { name: "Use 1 John 4:19 on the card" });
    expect(screen.queryByRole("button", { name: "Use Genesis 2:18–24 on the card" })).toBeNull();
    fireEvent.click(button);
    const picker = screen.getByRole("combobox", { name: "Verse" }) as HTMLSelectElement;
    await waitFor(() => expect(picker.selectedOptions[0].textContent).toBe("1 John 4:19"));
  });
});
