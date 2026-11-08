// "Add to calendar" (design 7.6): one all-day event per day of a run, as an RFC 5545 file built in the browser. All-day
// dates carry no time zone, so each event lands on its own day wherever the phone is. No alarms.
import { dateKey, dayNumber, fromDayNumber, type CalendarDate } from "./calendar";

export interface CalendarEvent {
  /** Unique and stable, so importing the file twice updates events instead of doubling them. */
  uid: string;
  date: CalendarDate;
  summary: string;
  url: string;
}

const compact = (date: CalendarDate) => dateKey(date).replace(/-/g, "");

/** Text escaped as the standard asks: backslashes, semicolons, commas and line breaks. */
export const escapeText = (text: string): string => text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** A content line folded so no line is longer than 75 bytes (continuations start with a space), never splitting a character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const pieces: string[] = [];
  let current = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    const limit = pieces.length === 0 ? 75 : 74; // a continuation line spends one byte on its leading space
    if (bytes + size > limit) {
      pieces.push(current);
      current = "";
      bytes = 0;
    }
    current += character;
    bytes += size;
  }
  pieces.push(current);
  return pieces.join("\r\n ");
}

/** "20261212T000000Z" for the moment the file is made. */
const stamp = (now: Date) => now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** The whole calendar file, with CRLF line ends. */
export function buildCalendar(name: string, events: CalendarEvent[], now: Date): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bible Guide//Countdowns//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeText(name)}`];
  for (const event of events) {
    const next = fromDayNumber(dayNumber(event.date) + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(event.date)}`,
      `DTEND;VALUE=DATE:${compact(next)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      `URL:${event.url}`,
      `DESCRIPTION:${escapeText(event.url)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
