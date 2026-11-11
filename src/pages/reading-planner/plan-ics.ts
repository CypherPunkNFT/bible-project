// "Add to calendar" (design 6): one all-day event per reading day, as an RFC 5545 file built in the browser. Escaping and
// line folding are the countdowns' own (countdowns/ics.ts); all-day dates carry no time zone, so each event lands on its
// own day wherever the phone is. No alarms.
import { dateKey, fromDayNumber } from "@/pages/countdowns/calendar";
import { escapeText, foldLine } from "@/pages/countdowns/ics";
import { SITE_ORIGIN } from "@/lib/page-head";

export interface PlanEvent {
  /** 1 for the first reading day: with the reading's identity, the event's stable id. */
  n: number;
  /** Day number. */
  date: number;
  /** The day's chapters, e.g. "Genesis 1–3". */
  summary: string;
  /** The day's reading time, e.g. "12 min". */
  time: string;
  /** The reader's address for the day's first chapter, from the site's root ("/read/bsb/GEN/1"). */
  path: string;
}

const compact = (day: number) => dateKey(fromDayNumber(day)).replace(/-/g, "");

/** "20261212T000000Z" for the moment the file is made. */
const stamp = (now: Date) => now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** The whole calendar file, with CRLF line ends. `reading` is the reading's identity (planner.ts readingSignature), so
 *  importing the same reading again updates its events instead of doubling them. */
export function planCalendar(name: string, reading: string, events: readonly PlanEvent[], now: Date): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bible Guide//Reading planner//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeText(name)}`];
  for (const event of events) {
    const url = `${SITE_ORIGIN}${event.path}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:reading-plan-${reading}-${event.n}@bibleguide.io`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(event.date)}`,
      `DTEND;VALUE=DATE:${compact(event.date + 1)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      `URL:${url}`,
      `DESCRIPTION:${escapeText(`${event.time}\n${url}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
