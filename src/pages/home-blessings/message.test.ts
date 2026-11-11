// Copy and send (design 8.1, 9.3): the copied text and the message end with the right source line and the site's public
// address with the item's anchor, whatever address the page is open at; a typed name fills "[name]" for that one message.
import { describe, expect, it } from "vitest";
import { OLDER_TEXTS, pageBySlug, type BlessingItem } from "@/data/home-blessings";
import { SITE_ORIGIN } from "@/lib/page-head";
import { pageAnchors, sharedAnchor } from "./anchors";
import { blessingMessage, cleanName, copyText, emailHref, fillName, itemUrl, sendable, sourceLine, subjectFor, textHref, verseCopy } from "./message";

const page = (slug: string) => pageBySlug(slug)!;
const item = (slug: string, id: string) => page(slug).items.find((entry) => entry.id === id) as BlessingItem;
const NUMBERS = { text: "The LORD bless you and keep you;", reference: "Numbers 6:24–26" };

describe("copying", () => {
  it("ends a written blessing with its label and Bible Guide, then its address on the site's origin", () => {
    const text = copyText(page("before-meals"), item("before-meals", "every-day"));
    expect(text.startsWith((item("before-meals", "every-day") as Extract<BlessingItem, { kind: "written" }>).text)).toBe(true);
    expect(text).toMatch(/\n\n— A grace for every day, Bible Guide\nhttps:\/\/bibleguide\.io\/blessings\/before-meals#every-day$/);
    expect(window.location.origin).not.toBe(SITE_ORIGIN);
  });

  it("ends an older text with its author and year, keeping its line breaks", () => {
    const text = copyText(page("bedtime"), item("bedtime", "wesley-gentle"));
    expect(text).toBe(`${OLDER_TEXTS["wesley-gentle"].lines.join("\n")}\n\n— Charles Wesley, 1742\nhttps://bibleguide.io/blessings/bedtime#wesley-gentle`);
    expect(sourceLine(item("graces-for-kids", "god-is-great"))).toBe("— Traditional children's grace (printed by 1882)");
  });

  it("ends Scripture with its reference and the Berean name", () => {
    const blessing = page("scripture-blessings").items[0];
    expect(copyText(page("scripture-blessings"), blessing, NUMBERS)).toBe(`${NUMBERS.text}\n\n— Numbers 6:24–26 (BSB)\n${SITE_ORIGIN}/blessings/scripture-blessings#${blessing.id}`);
    expect(verseCopy(NUMBERS)).toBe("The LORD bless you and keep you; — Numbers 6:24–26 (BSB)");
  });
});

describe("sending", () => {
  const home = item("house-blessing", "for-a-new-home");

  it("is offered only for the housewarming blessing and the Scripture blessings", () => {
    expect(sendable(home)).toBe(true);
    expect(sendable(page("scripture-blessings").items[3])).toBe(true);
    expect(sendable(item("house-blessing", "front-door"))).toBe(false);
    expect(sendable(item("bedtime", "duncan-shepherd"))).toBe(false);
    expect(subjectFor(home)).toBe("A blessing for your home");
    expect(subjectFor(page("scripture-blessings").items[0])).toBe("A blessing for you");
  });

  it("fills the name where typed and leaves [name] where not, with the opening line chosen", () => {
    const named = blessingMessage(page("house-blessing"), home, { name: "  Grace ", opening: "home" });
    expect(named).toMatch(/^So glad for you and your new home\.\n\nMay God bless your new home, Grace, and everyone/);
    expect(named.endsWith("\n— A blessing for someone's new home, Bible Guide\n\nhttps://bibleguide.io/blessings/house-blessing#for-a-new-home")).toBe(true);
    expect(blessingMessage(page("house-blessing"), home)).toMatch(/^May God bless your new home, \[name\], and everyone/);
    expect(fillName("Goodnight, [name].", "")).toBe("Goodnight, [name].");
    expect(cleanName("x".repeat(60))).toHaveLength(40);
  });

  it("builds email and text links with the message encoded", () => {
    expect(emailHref("A blessing for you", "Peace & joy")).toBe("mailto:?subject=A%20blessing%20for%20you&body=Peace%20%26%20joy");
    expect(textHref("Peace & joy")).toBe("sms:?&body=Peace%20%26%20joy");
    expect(itemUrl({ slug: "bedtime" }, "all-today")).toBe("https://bibleguide.io/blessings/bedtime#all-today");
  });
});

describe("anchors", () => {
  it("gives every verse on a page its passage key, numbering a repeat", () => {
    const anchors = pageAnchors(page("house-blessing"));
    const all = [...page("house-blessing").items.map((entry) => entry.id), ...anchors.roots.flat()];
    expect(new Set(all).size).toBe(all.length);
    expect(anchors.roots.flat()).toContain("psalm-127-1-2");
  });

  it("reads a shared fragment, refusing a malformed or unsafe one", () => {
    expect(sharedAnchor("#Every-Day")).toBe("every-day");
    expect(sharedAnchor("#%E0%A4%A")).toBeNull();
    expect(sharedAnchor("#<script>")).toBeNull();
    expect(sharedAnchor("")).toBeNull();
  });
});
