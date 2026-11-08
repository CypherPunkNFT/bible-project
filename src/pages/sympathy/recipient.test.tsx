// The recipient card page (design 7.4, "Recipient page"): what someone grieving sees when they open a card link.
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderAt, serveBerean } from "./test-kit";

const robots = () => document.head.querySelector('meta[name="robots"]');

// The card names its own tab (it is drawn outside the site layout), and jsdom has no innerText for that to read.
beforeAll(() => { Object.defineProperty(HTMLElement.prototype, "innerText", { configurable: true, get() { return this.textContent; } }); });
afterAll(() => { Reflect.deleteProperty(HTMLElement.prototype, "innerText"); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("sympathy: the recipient card page", () => {
  it("shows the verse for a known key in the given style, its reference as the heading, and the quiet line", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/card/john-11-25b?style=lily");
    expect(await screen.findByText("I am the resurrection and the life. Whoever believes in Me will live, even though he dies.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("John 11:25b");
    expect(screen.getByText("Sent to you with sympathy.")).toBeInTheDocument();
    expect(container.querySelector(".sy-recipient-lily .sy-ornament-lily")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Read it in the Bible" }).getAttribute("href")).toBe("/read/bsb/JHN/11?hl=25-25");
    expect(screen.getByRole("link", { name: "More words of comfort" }).getAttribute("href")).toBe("/sympathy#verses");
    expect(container.querySelector(".sy-recipient-verse")?.getAttribute("lang")).toBe("en");
  });

  it("shows Psalm 34:18 with a gentle line for an unknown key, never the not-found page", async () => {
    serveBerean();
    renderAt("/sympathy/card/psalm-34-19-typo");
    expect(await screen.findByText("The LORD is near to the brokenhearted; He saves the contrite in spirit.")).toBeInTheDocument();
    expect(screen.getByText("We couldn't find the exact verse this link pointed to. Here are words of comfort from Psalm 34:18.")).toBeInTheDocument();
    expect(screen.queryByText("Nothing is written here.")).toBeNull();
  });

  it("still shows a card for a link cut off before its key, or changed by a chat app", async () => {
    serveBerean();
    renderAt("/sympathy/card");
    expect(await screen.findByText(/We couldn't find the exact verse/)).toBeInTheDocument();
    cleanup();
    renderAt("/sympathy/card/Psalm-147-3.");
    expect(await screen.findByText("He heals the brokenhearted and binds up their wounds.")).toBeInTheDocument();
    expect(screen.queryByText(/We couldn't find the exact verse/)).toBeNull();
  });

  it("falls back to the plain style for an unknown style", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/card/psalm-34-18?style=balloons");
    await screen.findByText(/near to the brokenhearted/);
    expect(container.querySelector(".sy-recipient-plain .sy-ornament-plain")).not.toBeNull();
  });

  it("keeps itself out of search results, and removes the tag when it closes", () => {
    serveBerean();
    const view = renderAt("/sympathy/card/psalm-34-18");
    expect(robots()?.getAttribute("content")).toBe("noindex");
    view.unmount();
    expect(robots()).toBeNull();
  });

  it("shows no card maker, no help strip and no list of other pages", async () => {
    serveBerean();
    const { container } = renderAt("/sympathy/card/romans-8-26");
    await screen.findByText(/the Spirit helps us in our weakness/);
    expect(container.querySelector("#card-maker")).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("offers Retry when the verse cannot load", async () => {
    serveBerean({ fail: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // A verse no other test here has loaded, so nothing is answered from the page's cache.
    renderAt("/sympathy/card/1-peter-5-7");
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("1 Peter 5:7");
    serveBerean();
    fireEvent.click(retry);
    expect(await screen.findByText(/He cares for you/)).toBeInTheDocument();
  });
});
