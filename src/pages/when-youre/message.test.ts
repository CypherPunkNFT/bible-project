import { describe, expect, it } from "vitest";
import { cardDescription, emailHref, textHref, verseMessage, verseText, verseUrl } from "./message";

describe("verse messages", () => {
  const card = cardDescription("anxious", "When you're anxious", { key: "1-peter-5-7", reference: "1 Peter 5:7", text: "Cast all your anxiety on Him, because He cares for you." });
  it("uses the canonical origin, permanent verse anchor and BSB attribution", () => {
    expect(verseUrl(card)).toBe("https://bibleguide.io/when-youre/anxious#1-peter-5-7");
    expect(verseMessage(card)).toContain(verseText(card));
    expect(verseMessage(card)).toContain("1 Peter 5:7 (BSB)");
    expect(verseMessage(card)).not.toContain(window.location.origin);
  });
  it("encodes the complete body for email and text without a recipient", () => {
    const message = verseMessage(card);
    expect(emailHref(message)).toBe(`mailto:?subject=A%20verse%20for%20you&body=${encodeURIComponent(message)}`);
    expect(textHref(message)).toBe(`sms:?&body=${encodeURIComponent(message)}`);
  });
  it.each(["abused", "thinking-of-suicide"])("ends urgent %s messages with the page link and a help invitation", (page) => {
    const urgent = { ...card, page };
    expect(verseMessage(urgent)).toContain("help at the top");
    expect(verseMessage(urgent).endsWith(verseUrl(urgent))).toBe(true);
    expect(verseMessage(urgent)).not.toContain("When you're anxious");
  });
});
