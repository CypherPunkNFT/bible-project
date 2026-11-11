// The message builder (design 6.1, 7.3): the name, the opening lines, the link and the 1662 credit line.
import { describe, expect, it } from "vitest";
import { HISTORIC_PRAYERS, occasionBySlug } from "@/data/occasion-prayers";
import {
  cleanName, copyText, emailHref, fillName, historicCard, NAME_MAX, prayerCard, prayerMessage, prayerUrl, sentenceCase, textHref,
} from "./message";

const surgery = occasionBySlug("before-surgery")!;
const forSomeone = prayerCard(surgery, surgery.prayers[1], ["Psalm 31:14–15a"]);
const forYou = prayerCard(surgery, surgery.prayers[0], []);

describe("the prayer message", () => {
  it("puts the typed name in place of every [name]", () => {
    const message = prayerMessage(forSomeone, { name: "Sam", opening: "praying" });
    expect(message).not.toContain("[name]");
    expect(message.match(/Sam/g)).toHaveLength(surgery.prayers[1].text.split("[name]").length - 1);
    expect(message.startsWith("I'm praying for you.\n\nFather, I bring Sam to you today")).toBe(true);
  });

  it("leaves [name] for the sender to fill in when no name is typed", () => {
    expect(prayerMessage(forSomeone, { name: "   " })).toContain("I bring [name] to you");
  });

  it("inserts a name holding [name], markup or emoji as plain text, cut to 40 characters", () => {
    expect(fillName("Hello [name].", "[name]")).toBe("Hello [name].");
    expect(fillName("Hello [name].", "<b>Jo</b> 🙏")).toBe("Hello <b>Jo</b> 🙏.");
    expect(fillName("Hello [name].", "$& $1")).toBe("Hello $& $1.");
    expect(cleanName("x".repeat(60))).toHaveLength(NAME_MAX);
  });

  it("offers three opening lines and none by default on a prayer for you", () => {
    expect(prayerMessage(forYou).startsWith("Father, I trust you.")).toBe(true);
    expect(prayerMessage(forSomeone, { opening: "prayed" }).startsWith("I prayed this for you today.\n\n")).toBe(true);
    expect(prayerMessage(forSomeone, { opening: "none" }).startsWith("Father,")).toBe(true);
  });

  it("links to bibleguide.io with the prayer's anchor, whatever address the page is open at", () => {
    window.history.replaceState(null, "", "/somewhere/else?x=1");
    expect(prayerUrl(forSomeone)).toBe("https://bibleguide.io/prayers/before-surgery#for-someone");
    expect(prayerMessage(forSomeone).endsWith("\n\nA prayer before surgery: https://bibleguide.io/prayers/before-surgery#for-someone")).toBe(true);
  });

  it("copies a written prayer with its source line, and an older prayer ending “BCP 1662”", () => {
    expect(copyText(forYou).endsWith("— A prayer before surgery, bibleguide.io/prayers/before-surgery")).toBe(true);
    const older = historicCard(surgery, HISTORIC_PRAYERS["bcp-perils"]);
    expect(copyText(older).endsWith("(BCP 1662)")).toBe(true);
    const sent = prayerMessage(older);
    expect(sent).toContain("Jesus Christ. Amen.\n— Book of Common Prayer (BCP 1662)\n\n");
    expect(sent.endsWith("#older-prayer")).toBe(true);
    const travel = occasionBySlug("travel")!;
    expect(copyText(historicCard(travel, HISTORIC_PRAYERS.breastplate)).endsWith("— St Patrick's Breastplate, translated by Cecil Frances Alexander")).toBe(true);
  });

  it("encodes the whole message into the email and text links, with no number", () => {
    const message = prayerMessage(forSomeone, { name: "Sam & Jo" });
    expect(emailHref(message)).toBe(`mailto:?subject=A%20prayer%20for%20you&body=${encodeURIComponent(message)}`);
    expect(textHref(message)).toBe(`sms:?&body=${encodeURIComponent(message)}`);
  });

  it("writes headings in sentence case, keeping proper words", () => {
    expect(sentenceCase("A Prayer Before Reading the Bible")).toBe("A prayer before reading the Bible");
    expect(sentenceCase("A Prayer for a Couple on Their Wedding Day")).toBe("A prayer for a couple on their wedding day");
  });
});
