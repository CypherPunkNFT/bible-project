// The calendar (design 7.4): Advent as doors numbered by date, Lent as a seven-column week grid from Ash Wednesday with
// Sundays set apart. An ordered list, so it works with ordinary Tab navigation. A door still to come shows its date first,
// with a small "Read it now" link: families keep the surprise and a pastor can still look ahead. Nothing is locked.
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { OCCASIONS } from "@/data/countdowns";
import type { LifeEventPassage } from "@/data/life-events";
import { weekday } from "./calendar";
import { monthDay, shortWeekday, weekdayDate } from "./format";
import type { Run } from "./season";

/** One week from a Sunday (January 7, 2001), for the weekday headings. */
const WEEK = Array.from({ length: 7 }, (_, index) => ({ year: 2001, month: 1, day: 7 + index }));

interface CalendarGridProps {
  run: Run;
  todayN: number;
  isRead: (key: string) => boolean;
  hrefOf: (key: string) => string;
  reference: (passage: LifeEventPassage) => string;
}

/** The occasions that borrow a run of this one's days, by the key they start from: Lent's Holy Week row from Palm Sunday. */
const rowsBorrowedFrom = (slug: string): Map<string, string> =>
  new Map(OCCASIONS.flatMap((item) => (!Array.isArray(item.days) && item.days.borrow === slug ? [[item.days.fromKey, item.name] as const] : [])));

export function CalendarGrid({ run, todayN, isRead, hrefOf, reference }: CalendarGridProps) {
  const [opened, setOpened] = useState<string | null>(null);
  const weeks = run.occasion.calendar === "weeks";
  const lead = weeks && run.entries.length ? weekday(run.entries[0].date) : 0;
  const read = run.entries.filter((entry) => isRead(entry.day.key)).length;
  const peek = run.entries.find((entry) => entry.day.key === opened);
  const rows = weeks ? rowsBorrowedFrom(run.occasion.slug) : new Map<string, string>();
  return (
    <section className="cd-calendar" aria-labelledby="cd-calendar-title">
      <h2 id="cd-calendar-title">The calendar</h2>
      <p className="cd-count">{`${read} of ${run.entries.length} read`}</p>
      {weeks && <div className="cd-weekdays" aria-hidden="true">{WEEK.map((date) => <span key={date.day}>{shortWeekday(date)}</span>)}</div>}
      <ol className={weeks ? "cd-grid cd-grid-weeks" : "cd-grid cd-grid-doors"}>
        {run.entries.map((entry, index) => {
          const { day, n, date } = entry;
          const done = isRead(day.key);
          const sunday = weekday(date) === 0;
          const row = rows.get(day.key);
          const label = `${monthDay(date)}${day.label ? `, ${day.label}` : ""}${row ? `, ${row} begins` : ""}, ${reference(day.readings[0])}${done ? ", read" : ""}`;
          const className = ["cd-door", n === todayN && "cd-today", done && "cd-read", n > todayN && "cd-closed", weeks && sunday && "cd-sunday"].filter(Boolean).join(" ");
          const style = index === 0 && lead ? { gridColumnStart: lead + 1 } : undefined;
          const face = <><span className="cd-door-number">{date.day}</span>{weeks && sunday && <span className="cd-door-tag">Sunday</span>}{done && <span className="cd-tick" aria-hidden="true">✓</span>}</>;
          return (
            <Fragment key={day.key}>
              {row && <li className="cd-row-label" aria-hidden="true">{row}</li>}
              <li style={style} className={n === todayN ? "cd-today-cell" : undefined}>
                {n > todayN
                  ? <button type="button" className={className} aria-label={label} aria-expanded={opened === day.key} onClick={() => setOpened(opened === day.key ? null : day.key)}>{face}</button>
                  : <Link to={hrefOf(day.key)} className={className} aria-label={label} aria-current={n === todayN ? "date" : undefined}>{face}</Link>}
              </li>
            </Fragment>
          );
        })}
      </ol>
      {peek && (
        <p className="cd-peek" role="status">
          {`This one opens on ${weekdayDate(peek.date)}.`} <Link to={hrefOf(peek.day.key)}>Read it now</Link>
        </p>
      )}
    </section>
  );
}
