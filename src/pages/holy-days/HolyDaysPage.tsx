// /holy-days (docs/features/holy-days/design.md): the holy days of any year from 1583 to 9999, worked out in the
// browser. The year lives in the address (?year=2027) and nothing else is kept: no storage, no requests but the Berean
// files a day's passages are read from when it is opened.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { plural } from "@/lib/site-format";
import { fromDayNumber } from "@/pages/countdowns/calendar";
import { useToday } from "@/pages/countdowns/useToday";
import { comingUp, FIRST_YEAR, holyDaysInYear, LAST_YEAR, parseYear, TRADITIONS, type HolyDay, type Standing, type Tradition } from "./dates";
import { DayRow } from "./DayRow";
import { HOLY_DAYS, TRADITION_LABELS } from "./days";
import { longDate, monthName, weekdayDate, yearText } from "./format";
import "./holy-days.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

const clampYear = (year: number) => Math.min(LAST_YEAR, Math.max(FIRST_YEAR, year));

function standingLine(standing: Standing, todayYear: number): string {
  const name = HOLY_DAYS[standing.day.key].name;
  if (standing.state === "today") return `Today is ${name}`;
  if (standing.state === "under-way") return `Under way now: ${name}, day ${standing.dayOf} of ${standing.days}`;
  const when = fromDayNumber(standing.day.start).year === todayYear ? weekdayDate(standing.day.start) : longDate(standing.day.start);
  return `Next comes ${name}, on ${when}, ${plural(standing.inDays, "tomorrow", "in {n} days")}`;
}

function ComingUp({ todayN, shown }: { todayN: number; shown: ReadonlySet<Tradition> }) {
  const standing = comingUp(todayN, shown);
  if (!standing) return null;
  return (
    <p className="hd-coming">
      <span className="hd-kicker">Coming up</span> {standingLine(standing, fromDayNumber(todayN).year)}
      {standing.day.tradition === "feast" && standing.state === "ahead" && <span className="hd-quiet"> It begins at sunset the evening before.</span>}
    </p>
  );
}

function YearControl({ year, thisYear, onYear }: { year: number; thisYear: number; onYear: (year: number | null, replace: boolean) => void }) {
  const [draft, setDraft] = useState(yearText(year));
  const [hint, setHint] = useState(false);
  // A year chosen elsewhere (the arrows, the address) replaces the draft; the hint stays until the visitor types again.
  useEffect(() => setDraft(yearText(year)), [year]);
  const apply = () => {
    const typed = /^\s*\d{1,4}\s*$/.test(draft) ? Number(draft) : NaN;
    if (Number.isNaN(typed)) { setHint(true); setDraft(yearText(year)); return; }
    const chosen = clampYear(typed);
    setHint(chosen !== typed);
    setDraft(yearText(chosen));
    if (chosen !== year) onYear(chosen, true);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); apply(); };
  const step = (by: number) => {
    const next = year + by;
    if (next >= FIRST_YEAR && next <= LAST_YEAR) onYear(next, false);
  };
  return (
    <form className="hd-year" onSubmit={submit} aria-label="Choose a year">
      <button type="button" className="hd-button hd-step" aria-label="Previous year" aria-disabled={year <= FIRST_YEAR} onClick={() => step(-1)}><span aria-hidden="true">‹</span></button>
      <label className="hd-year-field">
        <span className="sr-only">Year</span>
        <input inputMode="numeric" maxLength={4} value={draft} onChange={(event) => { setDraft(event.target.value); setHint(false); }} onBlur={apply} aria-describedby="hd-year-hint" />
      </label>
      <button type="button" className="hd-button hd-step" aria-label="Next year" aria-disabled={year >= LAST_YEAR} onClick={() => step(1)}><span aria-hidden="true">›</span></button>
      {year !== thisYear && <button type="button" className="hd-button" onClick={() => onYear(null, false)}>This year</button>}
      <span id="hd-year-hint" className={hint ? "hd-hint" : "sr-only"}>Choose a year from 1583 to 9999.</span>
    </form>
  );
}

function Filter({ shown, onToggle }: { shown: ReadonlySet<Tradition>; onToggle: (tradition: Tradition) => void }) {
  return (
    <div className="hd-filter" role="group" aria-label="Show holy days of">
      {TRADITIONS.map((tradition) => {
        const pressed = shown.has(tradition);
        const last = pressed && shown.size === 1;
        return (
          <button key={tradition} type="button" className={`hd-button hd-chip hd-${tradition}`} aria-pressed={pressed} aria-disabled={last || undefined}
            title={last ? "At least one stays shown" : undefined} onClick={() => { if (!last) onToggle(tradition); }}>
            {TRADITION_LABELS[tradition]}
          </button>
        );
      })}
    </div>
  );
}

function byMonth(days: HolyDay[]): { month: number; first: number; days: HolyDay[] }[] {
  const groups: { month: number; first: number; days: HolyDay[] }[] = [];
  for (const day of days) {
    const month = fromDayNumber(day.start).month;
    const group = groups[groups.length - 1];
    if (group?.month === month) group.days.push(day);
    else groups.push({ month, first: day.start, days: [day] });
  }
  return groups;
}

export default function HolyDaysPage() {
  const todayN = useToday();
  const thisYear = clampYear(fromDayNumber(todayN).year);
  const [params, setParams] = useSearchParams();
  const raw = params.get("year");
  const year = parseYear(raw) ?? thisYear;
  const [shown, setShown] = useState<ReadonlySet<Tradition>>(() => new Set(TRADITIONS));
  const [open, setOpen] = useState<{ year: number; id: string } | null>(null);

  // A year the page cannot show is cleaned out of the address, so a shared link says what the page shows.
  useEffect(() => {
    if (raw !== null && parseYear(raw) === null) setParams((current) => { current.delete("year"); return current; }, { replace: true });
  }, [raw, setParams]);

  const all = useMemo(() => holyDaysInYear(year), [year]);
  const days = all.filter((day) => shown.has(day.tradition));
  const openId = open?.year === year ? open.id : null;

  const chooseYear = (next: number | null, replace: boolean) => setParams((current) => {
    if (next === null) current.delete("year");
    else current.set("year", String(next));
    return current;
  }, { replace });
  const toggleTradition = (tradition: Tradition) => setShown((current) => {
    const next = new Set(current);
    if (next.has(tradition)) next.delete(tradition);
    else next.add(tradition);
    return next;
  });
  const toggleDay = (id: string) => setOpen(openId === id ? null : { year, id });

  return (
    <article className="hd-page mx-auto max-w-4xl px-4 sm:px-6">
      <ToolsBackLink />
      <h1>Holy days calendar</h1>
      <p className="hd-intro">
        The dates of Easter in the Western and Orthodox churches, Lent, Advent, Pentecost and the feasts God gave Israel,
        for any year from 1583 to 9999. Open a day to read what it remembers, how its date is set, and the key passages.
      </p>
      <ComingUp todayN={todayN} shown={shown} />
      <div className="hd-controls">
        <YearControl year={year} thisYear={thisYear} onYear={chooseYear} />
        <Filter shown={shown} onToggle={toggleTradition} />
      </div>
      <h2 className="hd-year-heading">{`Holy days in ${yearText(year)}`}</h2>
      <p className="hd-quiet" aria-live="polite">{`Showing ${days.length} of ${all.length}`}</p>
      {byMonth(days).map((group) => (
        <section key={`${group.month}`} className="hd-month">
          <h3 className="hd-month-name">{monthName(group.first)}</h3>
          <ul>
            {group.days.map((day) => <DayRow key={day.id} day={day} open={openId === day.id} onToggle={() => toggleDay(day.id)} />)}
          </ul>
        </section>
      ))}
      <aside className="hd-note" aria-labelledby="hd-note-title">
        <h2 id="hd-note-title">Keeping these days</h2>
        <p>
          Scripture does not command Christians to keep these days. Paul leaves each believer free to honour a day or not
          (Romans 14:5–6), and calls the feasts of the Law a shadow of what was to come, whose substance is Christ
          (Colossians 2:16–17; Hebrews 10:1). The day Christians do keep is the Lord's Day,
          the first day of the week, the day of his resurrection. Many Baptist churches observe Christmas, Easter and
          Advent; some believers keep Lent and others do not.
        </p>
        <p>
          Dates for the biblical feasts follow the Hebrew calendar fixed in the fourth century and kept by Jewish
          communities today. In Bible times each month began when the new moon was seen, so the day itself could differ by
          a day or so; and that calendar slowly falls behind ours, by about a day every two centuries, so far in the
          future some feasts move into the next month or year. Read the feasts in <Link to="/read/bsb/LEV/23">Leviticus 23</Link>.
        </p>
      </aside>
    </article>
  );
}
