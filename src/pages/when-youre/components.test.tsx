import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import { sp } from "@/data/sympathy/types";
import type { WhenTopic } from "@/data/when-youre/types";
import { DEFAULT_TITLE } from "@/lib/page-head";
import { catalog, serveBerean } from "@/pages/life-events/test-kit";
import { passageAnchors, sharedVerseId } from "./anchors";
import { Passages } from "./Passages";
import { cardDescription, verseMessage } from "./message";
import { SendVerse } from "./SendVerse";
import { useFeatureHead } from "./useFeatureHead";

const topic: WhenTopic = {
  slug: "anxious", group: "heart", label: "Anxious", searchTitle: "Bible Verses for Anxiety and Worry", heading: "What the Bible Says When You're Anxious",
  intro: "A fixture introduction", note: "A fixture note", words: ["worried"], help: { level: "foot", entries: [] }, topics: [], related: [],
  passages: [sp("PSA 4:8", "card", "Rest can be received as a gift."), sp("PSA 4:8", "blessing", "Bring the night to God.")],
};
beforeEach(() => { serveBerean(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("passage display", () => {
  it("gives repeated roles unique IDs and safely rejects malformed fragments", () => {
    expect(passageAnchors(topic)).toEqual(["psalm-4-8", "psalm-4-8-pray"]);
    expect(sharedVerseId("#psalm-4-8")).toBe("psalm-4-8");
    for (const hash of ["#%", "#<script>", "#a/b"]) expect(sharedVerseId(hash)).toBeNull();
  });
  it("loads the actual Berean text and resolves an ordinary fragment after loading", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<CatalogContext.Provider value={catalog}><MemoryRouter initialEntries={["/when-youre/anxious#psalm-4-8"]}><Passages topic={topic} /></MemoryRouter></CatalogContext.Provider>);
    await waitFor(() => expect(screen.getAllByText(/I will lie down and sleep in peace/).length).toBe(2));
    expect(document.querySelectorAll('.scripture[lang="en"]')).toHaveLength(2);
    expect(scroll).toHaveBeenCalled();
    expect(document.querySelectorAll('[id="psalm-4-8"]')).toHaveLength(1);
    expect(document.querySelectorAll('[id="psalm-4-8-pray"]')).toHaveLength(1);
  });
  it("never automatically scrolls an urgent shared link beyond help", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<CatalogContext.Provider value={catalog}><MemoryRouter initialEntries={["/when-youre/abused#psalm-4-8"]}><Passages topic={{ ...topic, slug: "abused", help: { level: "urgent", entries: [] } }} /></MemoryRouter></CatalogContext.Provider>);
    await screen.findAllByText(/I will lie down and sleep in peace/);
    expect(scroll).not.toHaveBeenCalled();
  });
});

describe("explicit sharing", () => {
  const card = cardDescription("abused", "Someone at home is hurting you", { key: "psalm-9-9", reference: "Psalm 9:9", text: "A fixture verse." });
  it("hides unsupported Share, warns about revealing the subject and encodes the message", () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    render(<SendVerse card={card} />);
    fireEvent.click(screen.getByRole("button", { name: "Send this to a friend" }));
    expect(screen.queryByRole("button", { name: "Share…" })).not.toBeInTheDocument();
    expect(screen.getByText(/can reveal this subject/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Email" }).getAttribute("href")).toContain(encodeURIComponent(verseMessage(card)));
    expect(screen.getByRole("link", { name: "Text message" }).getAttribute("href")).toContain(encodeURIComponent(verseMessage(card)));
  });
  it("selects the message for manual copying if clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    render(<SendVerse card={card} />);
    fireEvent.click(screen.getByRole("button", { name: "Send this to a friend" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    const field = await screen.findByRole("textbox", { name: "Press and hold to copy" }) as HTMLTextAreaElement;
    expect(field.value).toBe(verseMessage(card));
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(field.value.length);
  });
  it("silently accepts a cancelled native share", async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error("cancelled"), { name: "AbortError" }));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<SendVerse card={card} />);
    fireEvent.click(screen.getByRole("button", { name: "Send this to a friend" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Share…" })); });
    expect(share).toHaveBeenCalledWith({ title: "A verse for you", text: verseMessage(card) });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

function Head({ title, unknown }: { title: string | null; unknown: boolean }) { useFeatureHead(title, unknown); return null; }
describe("route metadata cleanup", () => {
  it("updates titles and removes unknown-path noindex on valid navigation, restoring the prior policy", () => {
    const policy = Object.assign(document.createElement("meta"), { name: "referrer", content: "same-origin" });
    document.head.append(policy);
    const view = render(<Head title="Missing topic" unknown />);
    expect(document.title).toBe("Missing topic · Bible Guide");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(policy.content).toBe("no-referrer");
    view.rerender(<Head title="Anxiety and worry" unknown={false} />);
    expect(document.title).toBe("Anxiety and worry · Bible Guide");
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    view.unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
    expect(policy.content).toBe("same-origin");
    policy.remove();
  });
});
