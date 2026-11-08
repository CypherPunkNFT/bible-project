// Sharing a countdown day (design 7.5), on the sympathy pattern: the verse in the text itself so the message stands on
// its own, the day's title, and a link built from SITE_ORIGIN that carries only the occasion, the day key and, for a
// personal occasion, a checked date. Nothing a visitor types goes into a link.
import type { Occasion } from "@/data/countdowns";
import { SITE_ORIGIN } from "@/lib/page-head";
import { ownerSlug } from "./season";

export const COUNTDOWNS_PATH = "/countdowns";

/** "/countdowns/advent", "/countdowns/advent/dec-12", "/countdowns/wedding/d-30?date=2027-06-12". */
export function countdownPath(occasion: string, key?: string, date?: string): string {
  const day = key ? `/${encodeURIComponent(key)}` : "";
  return `${COUNTDOWNS_PATH}/${encodeURIComponent(occasion)}${day}${date ? `?date=${date}` : ""}`;
}

/** A day page's address: Holy Week's days open on Lent's pages; a personal countdown keeps its ?date=. */
export const dayHref = (occasion: Occasion, key: string, date?: string): string => countdownPath(ownerSlug(occasion), key, date);

/** The public address, whatever address the page happens to be open at. */
export const countdownUrl = (occasion: string, key?: string, date?: string): string => `${SITE_ORIGIN}${countdownPath(occasion, key, date)}`;

export interface DayMessage { verse: string; reference: string; heading: string; url: string }

/** The verse with its reference, the day's heading, and the link. */
export const buildDayMessage = (message: DayMessage): string =>
  [`“${message.verse}” — ${message.reference} (BSB)`, `${message.heading}\n${message.url}`].join("\n\n");

/** A mailto: link with the day's heading as its subject and no address. */
export const mailtoHref = (subject: string, body: string): string => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** An sms: link with no number; `?&body=` is read by iPhone and Android. */
export const smsBodyHref = (body: string): string => `sms:?&body=${encodeURIComponent(body)}`;
