// The message builder and the card link (design 7.4, "Message builder"): pure functions, no browser needed.
import { describe, expect, it } from "vitest";
import { buildMessage, cardPath, cardUrl, mailtoHref, MESSAGE_LIMIT, smsBodyHref, styleFrom } from "./message";

const card = {
  key: "psalm-34-18",
  text: "The LORD is near to the brokenhearted; He saves the contrite in spirit.",
  reference: "Psalm 34:18",
  style: "olive" as const,
};

describe("sympathy: the message", () => {
  it("holds the typed words, the verse with its reference and (BSB), and the card link, in that order", () => {
    const text = buildMessage({ ...card, message: "Thinking of you, Grace." });
    expect(text).toBe([
      "Thinking of you, Grace.",
      "“The LORD is near to the brokenhearted; He saves the contrite in spirit.” — Psalm 34:18 (BSB)",
      "https://bibleguide.io/sympathy/card/psalm-34-18?style=olive",
    ].join("\n\n"));
  });

  it("leaves the typed words out when there are none, and never puts them into the link", () => {
    expect(buildMessage({ ...card, message: "   " }).startsWith("“The LORD")).toBe(true);
    const link = buildMessage({ ...card, message: "From Grace" }).split("\n\n").at(-1)!;
    expect(link).not.toMatch(/Grace/);
    expect(link.startsWith("https://bibleguide.io/sympathy/card/")).toBe(true);
  });

  it("builds the link from the public address whatever address the page is open at", () => {
    expect(window.location.origin).not.toBe("https://bibleguide.io");
    expect(cardUrl("john-11-25b", "plain")).toBe("https://bibleguide.io/sympathy/card/john-11-25b");
    expect(cardPath("john-11-25b", "lily")).toBe("/sympathy/card/john-11-25b?style=lily");
  });

  it("stops the typed words at 500 characters", () => {
    const text = buildMessage({ ...card, message: "a".repeat(MESSAGE_LIMIT + 50) });
    expect(text.split("\n\n")[0]).toHaveLength(MESSAGE_LIMIT);
  });

  it("encodes the whole message into the email and text links, with no address or number", () => {
    const text = buildMessage({ ...card, message: "Love & prayers" });
    expect(mailtoHref(text)).toBe(`mailto:?subject=Thinking%20of%20you&body=${encodeURIComponent(text)}`);
    expect(smsBodyHref(text)).toBe(`sms:?&body=${encodeURIComponent(text)}`);
    expect(decodeURIComponent(smsBodyHref(text).slice("sms:?&body=".length))).toBe(text);
    expect(mailtoHref(text).length).toBeLessThan(2000);
  });

  it("reads a style from a link, falling back to plain", () => {
    expect(styleFrom("olive")).toBe("olive");
    expect(styleFrom("Lily.")).toBe("lily");
    expect(styleFrom("neon")).toBe("plain");
    expect(styleFrom(null)).toBe("plain");
  });
});
