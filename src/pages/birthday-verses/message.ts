// The birthday text message (design 7.3), on the countdowns and sympathy pattern but with its own words: a greeting, the
// verse in the text itself so the message stands on its own where a link shows no preview, and the date page's address.
// The friend's name goes into the message text only, never into the link.
import { cleanLine } from "@/lib/verse-card/spec";

export const MAX_NAME = 40;
export const MESSAGE_SUBJECT = "Happy birthday";

export interface BirthdayMessage {
  /** The friend's name as typed, or empty. */
  name: string;
  /** The verse's words; empty when they could not be loaded, so the message carries the reference and link alone. */
  text: string;
  reference: string;
  url: string;
}

/** The name as it goes into the greeting: one line, spaces tidied, at most MAX_NAME characters. */
export const cleanName = (name: string): string => [...cleanLine(name)].slice(0, MAX_NAME).join("").trim();

export function birthdayMessage({ name, text, reference, url }: BirthdayMessage): string {
  const friend = cleanName(name);
  const greeting = friend ? `Happy birthday, ${friend}! A verse for your day:` : "Happy birthday! A verse for your day:";
  const verse = text ? `“${text}” ${reference} (BSB)` : `${reference} (BSB)`;
  return [greeting, verse, url].join("\n\n");
}

/** A mailto: link with the subject and no address. */
export const mailtoHref = (subject: string, body: string): string => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** An sms: link with no number; `?&body=` is read by iPhone and Android. */
export const smsHref = (body: string): string => `sms:?&body=${encodeURIComponent(body)}`;
