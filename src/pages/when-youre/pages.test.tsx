// The "when you're..." pages as a reader meets them: the hub and its filter, all 33 topic pages with the help each one
// carries, the fallback when the help directory cannot be read, unknown and retired addresses, the head, and sharing.
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResourceFile } from "@/data/resources";
import { GROUPS, WHEN_TOPICS, topicBySlug } from "@/data/when-youre";
import { FALLBACK_HELP } from "@/data/when-youre/help";
import { DEFAULT_TITLE } from "@/lib/page-head";
import { passageAnchors } from "./anchors";
import { descriptionParagraph, life, renderAt, serveBerean, visits } from "./test-kit";

const mocks = vi.hoisted(() => ({ load: vi.fn(), retired: {} as Record<string, string> }));
vi.mock("@/data/resources", async (original) => ({ ...(await original<object>()), loadResource: (name: ResourceFile) => mocks.load(name) }));
vi.mock("@/data/when-youre", async (original) => {
  const actual = await original<typeof import("@/data/when-youre")>();
  return { ...actual, redirectFor: (slug: string | undefined) => actual.redirectFor(slug, mocks.retired) };
});

const scroll = vi.fn();
beforeEach(() => {
  serveBerean();
  mocks.load.mockImplementation(async (name: string) => (name === "life" ? life : null));
  mocks.retired = {};
  scroll.mockClear();
  Element.prototype.scrollIntoView = scroll;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const urgentBox = () => document.querySelector(".wy-urgent");
const robots = () => document.head.querySelector('meta[name="robots"]');
const versesLoaded = () => screen.findByRole("heading", { name: "Verses to hold on to" }, { timeout: 5000 });

describe("the hub", () => {
  it("lists all 33 pages in three groups, with the quiet crisis line and the introduction as its description", async () => {
    renderAt("/when-youre");
    expect(screen.getByRole("heading", { level: 1, name: "What the Bible Says When You're…" })).toBeVisible();
    for (const group of GROUPS) expect(screen.getByRole("heading", { level: 2, name: group.title })).toBeVisible();
    const cards = document.querySelectorAll(".wy-grid a");
    expect([...cards].map((card) => card.getAttribute("href"))).toEqual(WHEN_TOPICS.map((topic) => `/when-youre/${topic.slug}`));
    expect(descriptionParagraph()).toMatch(/^Whatever you're going through/);
    expect(await screen.findByRole("link", { name: /Call\s*988/ })).toBeVisible();
    expect(urgentBox()).toBeNull();
    expect(robots()).toBeNull();
    expect(screen.getByRole("link", { name: "Comforting someone who is grieving" })).toHaveAttribute("href", "/sympathy");
  });

  it("narrows the pages to what is typed, without putting the words in the address", async () => {
    renderAt("/when-youre");
    fireEvent.change(screen.getByLabelText(/Type a word/), { target: { value: "worried" } });
    const cards = [...document.querySelectorAll(".wy-grid a strong")].map((card) => card.textContent);
    expect(cards).toContain("Anxious");
    expect(cards.length).toBeLessThan(WHEN_TOPICS.length);
    expect(document.querySelector(".wy-count")?.textContent).toBe(cards.length === 1 ? "One page matches." : `${cards.length} pages match.`);
    expect(urgentBox()).toBeNull();
    expect(visits.at(-1)?.address).toBe("/when-youre");
  });

  it("shows every page with a gentle line when nothing matches", () => {
    renderAt("/when-youre");
    fireEvent.change(screen.getByLabelText(/Type a word/), { target: { value: "zzzzqq" } });
    expect(document.querySelectorAll(".wy-grid a")).toHaveLength(WHEN_TOPICS.length);
    expect(screen.getByText("No page matches those words, so every page is shown.")).toBeInTheDocument();
  });

  it("puts help first when crisis words are typed, with the quick exit for abuse", async () => {
    renderAt("/when-youre");
    const input = screen.getByLabelText(/Type a word/);
    fireEvent.change(input, { target: { value: "I want to die" } });
    expect(screen.getByRole("region", { name: "Help right now: thoughts of suicide" })).toBeVisible();
    expect(document.querySelector('.wy-grid a[href="/when-youre/thinking-of-suicide"]')).not.toBeNull();
    fireEvent.change(input, { target: { value: "my partner hits me" } });
    const box = screen.getByRole("region", { name: "Help right now: being hurt at home" });
    expect(within(box).getByRole("button", { name: /Leave this page/ })).toBeVisible();
    expect(document.querySelector('.wy-grid a[href="/when-youre/abused"]')).not.toBeNull();
    await act(async () => {});
  });
});

describe("every topic page", () => {
  it.each(WHEN_TOPICS.map((topic) => [topic.slug, topic] as const))("%s: heading, head, passages and its own help", async (_slug, topic) => {
    renderAt(`/when-youre/${topic.slug}`);
    await versesLoaded();
    expect(screen.getByRole("heading", { level: 1, name: topic.heading })).toBeVisible();
    expect(document.title).toBe(`${topic.searchTitle} · Bible Guide`);
    expect(descriptionParagraph()).toBe(topic.intro);
    expect(document.querySelectorAll(".wy-passage")).toHaveLength(topic.passages.length);
    expect(document.querySelectorAll(".wy-featured")).toHaveLength(1);
    const level = topic.help.level;
    const intro = document.querySelector(".wy-intro")!;
    if (level === "urgent") {
      expect(urgentBox()!.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } else {
      expect(urgentBox()).toBeNull();
    }
    expect(document.querySelector(".wy-strip") !== null).toBe(level === "line");
    const foot = document.querySelector(".wy-foot-help");
    expect(foot !== null).toBe(level === "line" || level === "foot");
    if (foot) expect(foot.querySelectorAll(".wy-help-entry")).toHaveLength(topic.help.entries.length);
    expect(document.querySelector(".wy-quiet")).not.toBeNull();
    expect(screen.getByText(/Berean Standard Bible/)).toBeInTheDocument();
    if (topic.person) expect(screen.getByRole("link", { name: "Read their story" })).toHaveAttribute("href", `/people/${topic.person.id}`);
  });
});

describe("help that never goes blank", () => {
  it.each(["thinking-of-suicide", "abused"])("%s keeps the fallback, the retry and the page when the help directory fails", async (slug) => {
    mocks.load.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt(`/when-youre/${slug}`);
    await versesLoaded();
    expect(within(urgentBox() as HTMLElement).getByText(FALLBACK_HELP)).toBeVisible();
    expect(descriptionParagraph()).toBe(topicBySlug(slug)!.intro);
    const calls = mocks.load.mock.calls.length;
    fireEvent.click(within(urgentBox() as HTMLElement).getByRole("button", { name: "Retry help directory" }));
    await waitFor(() => expect(mocks.load.mock.calls.length).toBeGreaterThan(calls));
  });
});

describe("addresses", () => {
  it.each(["/when-youre/no-such-page", "/when-youre/anxious/extra"])("%s shows the hub with a gentle line, marked noindex", (path) => {
    const view = renderAt(path);
    expect(screen.getByText(/We couldn't find that page/)).toBeVisible();
    expect(document.querySelectorAll(".wy-grid a")).toHaveLength(WHEN_TOPICS.length);
    expect(robots()?.getAttribute("content")).toBe("noindex");
    view.unmount();
    expect(robots()).toBeNull();
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it("replaces a retired address with its recorded successor, keeping a shared verse", async () => {
    mocks.retired = { worry: "anxious" };
    renderAt("/when-youre/worry#psalm-94-19");
    await versesLoaded();
    expect(visits.at(-1)).toEqual({ address: "/when-youre/anxious#psalm-94-19", how: "REPLACE" });
    expect(robots()).toBeNull();
  });
});

describe("shared verses and privacy", () => {
  it("opens an ordinary page at a shared verse once the verses arrive", async () => {
    renderAt("/when-youre/anxious#psalm-94-19");
    await versesLoaded();
    await waitFor(() => expect(scroll).toHaveBeenCalled());
    expect(scroll.mock.contexts[0]).toBe(document.getElementById("psalm-94-19"));
  });

  it("never scrolls an urgent page past its help, and offers the verse as a link after it", async () => {
    const anchor = passageAnchors(topicBySlug("abused")!)[0];
    renderAt(`/when-youre/abused#${anchor}`);
    await versesLoaded();
    expect(scroll).not.toHaveBeenCalled();
    const link = screen.getByRole("link", { name: "Go to the shared verse" });
    expect(urgentBox()!.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(link);
    expect(scroll.mock.contexts[0]).toBe(document.getElementById(anchor));
  });

  it("sends no referrer while the feature is open, and opens outside help without one", async () => {
    renderAt("/when-youre/thinking-of-suicide");
    await versesLoaded();
    expect(document.head.querySelector('meta[name="referrer"]')?.getAttribute("content")).toBe("no-referrer");
    const outside = [...document.querySelectorAll<HTMLAnchorElement>('.wy-help a[href^="https:"]')];
    expect(outside.length).toBeGreaterThan(0);
    for (const link of outside) {
      expect(link.rel).toContain("noreferrer");
      expect(link.getAttribute("referrerpolicy")).toBe("no-referrer");
    }
  });
});
