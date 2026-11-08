// A day page (design 7.3): the heading, the date this year, the reading in full, the reflection, prayer, question and
// hymn, the candle panel on its Sundays, the day card and its sharing, the read mark, and the way on. Never locked.
import { Link, Navigate, useLocation } from "react-router-dom";
import { HYMN_TITLES, KEY_ALIASES, OCCASIONS, type Occasion } from "@/data/countdowns";
import { cardLook } from "./card";
import { DayCard } from "./DayCard";
import { longDate } from "./format";
import { buildDayMessage, countdownPath, countdownUrl, dayHref } from "./message";
import { CandlePanel, FootLink, LoadFailed, MarkButton, SavingNote, SourceLine } from "./parts";
import { dayHeading, dayLine, daysOf, entryDay, ownerSlug, panelsOn } from "./season";
import { fromDayNumber } from "./calendar";
import { SharePanel } from "./SharePanel";
import { useCountdownPassages } from "./usePassages";
import { useRun } from "./useRun";

/** Sends a mistyped or retired key to the right page, replacing the address so search engines never see a duplicate. */
export function DayRoute({ occasion, dayKey }: { occasion: Occasion; dayKey: string }) {
  const { search } = useLocation();
  const days = daysOf(occasion, OCCASIONS);
  const known = days.some((day) => day.key === dayKey);
  if (known && !Array.isArray(occasion.days)) return <Navigate to={`${countdownPath(ownerSlug(occasion), dayKey)}${search}`} replace />;
  if (known) return <DayPage key={dayKey} occasion={occasion} dayKey={dayKey} />;
  // Own keys only, so an address like ".../constructor" never finds a built-in and redirects to nonsense.
  const aliases = KEY_ALIASES[occasion.slug];
  const alias = aliases && Object.prototype.hasOwnProperty.call(aliases, dayKey) ? aliases[dayKey] : undefined;
  if (alias) return <Navigate to={`${countdownPath(occasion.slug, alias)}${search}`} replace />;
  return <Navigate to={`${countdownPath(occasion.slug)}${search}`} replace state={{ missingDay: true }} />;
}

function DayPage({ occasion, dayKey }: { occasion: Occasion; dayKey: string }) {
  const view = useRun(occasion);
  const days = daysOf(occasion, OCCASIONS);
  const index = days.findIndex((day) => day.key === dayKey);
  const day = days[index];
  const run = view.run;
  const inRun = run?.entries.find((entry) => entry.day.key === dayKey);
  const n = run ? entryDay(day, run.target, run.targetN) : 0;
  const entry = inRun ?? (run ? { day, n, date: fromDayNumber(n) } : null);
  const panels = run && inRun ? panelsOn(run, inRun.n) : [];
  const passages = [...day.readings, day.card, ...panels.map((panel) => panel.passage)];
  const panelKeys = panels.map((panel) => panel.key).join(",");
  const { state, retry } = useCountdownPassages(`${occasion.slug}:${dayKey}:${panelKeys}`, passages);
  const shown = state.status === "ready" ? state.value : null;
  const heading = dayHeading(occasion, day);
  const card = shown && run && entry ? {
    occasion: occasion.slug, key: day.key, line: dayLine(run, entry), verse: shown[day.readings.length].text,
    reference: shown[day.readings.length].reference, look: cardLook(occasion, day), address: `bibleguide.io${countdownPath(occasion.slug)}`,
  } : null;
  const message = card ? buildDayMessage({ verse: card.verse, reference: card.reference, heading, url: countdownUrl(occasion.slug, day.key, view.date) }) : "";
  const previous = days[index - 1];
  const next = days[index + 1];

  return (
    <article className={`cd-page cd-day cd-style-${occasion.style} mx-auto max-w-3xl px-4 sm:px-6`}>
      <p className="cd-crumbs"><Link to="/countdowns">Countdowns</Link> / <Link to={countdownPath(occasion.slug, undefined, view.date)}>{occasion.name}</Link></p>
      <h1>{heading}</h1>
      {run && entry && (
        <div className="cd-status">
          {inRun ? <>{entry.n === view.todayN ? "Today" : "This reading is for"}: {longDate(entry.date)} · {dayLine(run, entry)}</>
            : `This reading opens ${occasion.name} in years when it begins by this date; it is not in this year's plan.`}
        </div>
      )}
      <section className="cd-readings" aria-label="Today's reading">
        {state.status === "loading" && <div className="cd-quiet">Loading the reading…</div>}
        {state.status === "error" && <LoadFailed retry={retry} />}
        {shown && day.readings.map((_, position) => (
          <div key={position} className="cd-reading">
            <h2><a href={shown[position].readHref}>{shown[position].reference}</a></h2>
            <blockquote className="scripture cd-text" lang="en">{shown[position].text}</blockquote>
          </div>
        ))}
      </section>
      <section className="cd-reflection" aria-labelledby="cd-reflection-title">
        <h2 id="cd-reflection-title">Reflection</h2>
        <p>{day.reflection}</p>
      </section>
      <section className="cd-prayer" aria-labelledby="cd-prayer-title"><h2 id="cd-prayer-title">Prayer</h2><p>{day.prayer}</p></section>
      {day.question && <section className="cd-question" aria-labelledby="cd-question-title"><h2 id="cd-question-title">Talk about it</h2><p>{day.question}</p></section>}
      {day.hymn && HYMN_TITLES[day.hymn] && <section className="cd-hymn" aria-labelledby="cd-hymn-title"><h2 id="cd-hymn-title">Sing</h2><p><Link to={`/study/hymns/${day.hymn}`}>{HYMN_TITLES[day.hymn]}</Link></p></section>}
      {panels.map((panel, position) => <CandlePanel key={panel.key} panel={panel} shown={shown?.[day.readings.length + 1 + position]} />)}
      <section className="cd-day-card" aria-labelledby="cd-card-title">
        <h2 id="cd-card-title">The day's card</h2>
        <DayCard card={card} />
        <SharePanel subject={heading} body={message} disabledReason={card ? null : !run ? "Choose a date first to share this day." : "Sharing waits until the verse loads."} />
      </section>
      <div className="cd-actions cd-day-actions">
        <MarkButton read={view.isRead(day.key)} onToggle={() => view.toggleRead(day.key)} />
      </div>
      <SavingNote saving={view.saving} />
      <nav className="cd-day-nav" aria-label="Other days">
        {previous ? <Link to={dayHref(occasion, previous.key, view.date)}>← {previous.title}</Link> : <span />}
        <Link to={countdownPath(occasion.slug, undefined, view.date)}>Back to the plan</Link>
        {next ? <Link to={dayHref(occasion, next.key, view.date)}>{next.title} →</Link> : <span />}
      </nav>
      <SourceLine />
      <FootLink occasion={occasion} />
    </article>
  );
}
