// An occasion page (design 7.2): the heading and introduction, the status line and today's day with its card, the
// calendar, every day of the run, the church panel, and links onward. Everything about "today" is drawn in the browser.
import { Link, useLocation } from "react-router-dom";
import { OCCASIONS, type Occasion } from "@/data/countdowns";
import { plural } from "@/lib/site-format";
import { CalendarGrid } from "./CalendarGrid";
import { ChurchPanel } from "./ChurchPanel";
import { cardLook } from "./card";
import { DayCard } from "./DayCard";
import { dayCount, inDays, longDate, shortWeekday, weekdayDate } from "./format";
import { countdownPath, dayHref } from "./message";
import { CandlePanel, ExploreMore, FootLink, LoadFailed, MarkButton, SavingNote, SourceLine } from "./parts";
import { DateForm, PersonalControls } from "./Personal";
import { buildRun, currentRun, dayLine, dayName, featuredEntry, ownerSlug, panelsOn, targetIn, until, type Run, type RunState } from "./season";
import { useCountdownPassages, useReference } from "./usePassages";
import { useRun, type RunView } from "./useRun";

/** The status line (design 7.2, 6.3), for the run's state today. */
function statusLine(run: Run, state: RunState, todayN: number): string {
  const { occasion } = run;
  const title = occasion.target.kind === "chosen" ? `Your ${occasion.name.toLowerCase()} countdown` : `${occasion.name} ${run.target.year}`;
  const first = run.entries[0];
  const today = run.entries.find((entry) => entry.n === todayN);
  if (state === "coming-up") return `${title} begins on ${weekdayDate(first.date)}, ${inDays(first.n - todayN)}.`;
  if (state === "counting") {
    const left = run.targetN - todayN;
    return `${title} · ${weekdayDate(first.date)} to ${weekdayDate(run.target)} · Today${today ? ` (${dayName(occasion, today.day)})` : ""}: ${until(left, occasion.targetName)}`;
  }
  if (state === "the-day") return `${title} · Today is ${run.entries.find((entry) => entry.n === run.targetN)?.day.label ?? occasion.targetName}.`;
  if (state === "after") return `${title} · ${occasion.closing}`;
  if (state === "still-waiting") return `${title} · ${dayCount(todayN - run.targetN)} after ${occasion.targetName}.`;
  return `${title} has finished.`;
}

function Today({ view, run }: { view: RunView; run: Run }) {
  const entry = featuredEntry(run, view.todayN);
  const panels = panelsOn(run, entry.n);
  const name = `${ownerSlug(run.occasion)}:${entry.day.key}:${panels.map((panel) => panel.key).join(",")}:today`;
  const { state, retry } = useCountdownPassages(name, [entry.day.card, ...panels.map((panel) => panel.passage)]);
  const shown = state.status === "ready" ? state.value : null;
  const reference = useReference();
  const before = view.state === "coming-up";
  return (
    <section className="cd-today-block" aria-labelledby="cd-today-title">
      <h2 id="cd-today-title">{before ? "The first day" : view.state === "counting" || view.state === "the-day" ? "Today" : "The last day"}</h2>
      <div className="cd-today-grid">
        <DayCard card={shown ? {
          occasion: run.occasion.slug, key: entry.day.key, line: dayLine(run, entry), verse: shown[0].text, reference: shown[0].reference,
          look: cardLook(run.occasion, entry.day), address: `bibleguide.io${countdownPath(run.occasion.slug)}`,
        } : null} />
        <div className="cd-today-text">
          <p className="cd-kicker">{shortWeekday(entry.date)} · {dayName(run.occasion, entry.day)}</p>
          <h3>{entry.day.title}</h3>
          <p className="cd-ref">{entry.day.readings.map(reference).join(" and ")}</p>
          <div className="cd-actions">
            <Link className="cd-button cd-button-main" to={dayHref(run.occasion, entry.day.key, view.date)}>{before ? "Read it now" : "Read today's reading"}</Link>
            <MarkButton read={view.isRead(entry.day.key)} onToggle={() => view.toggleRead(entry.day.key)} />
          </div>
          {state.status === "error" && <LoadFailed retry={retry} />}
        </div>
      </div>
      {panels.map((panel, index) => <CandlePanel key={panel.key} panel={panel} shown={shown?.[index + 1]} />)}
    </section>
  );
}

/** The way on (design 6.2, 6.3): Holy Week, while Lent is still under way, links to today's Lent reading; a seasonal
 *  occasion's "afterwards" days give next year's start date. */
function Onward({ view, run }: { view: RunView; run: Run }) {
  const { occasion } = run;
  if (occasion.target.kind === "chosen") return null;
  if (view.state === "coming-up" && !Array.isArray(occasion.days)) {
    const lender = OCCASIONS.find((item) => item.slug === ownerSlug(occasion));
    const today = lender ? currentRun(lender, view.todayN, OCCASIONS).entries.find((entry) => entry.n === view.todayN) : undefined;
    if (!lender || !today) return null;
    return <p className="cd-onward">{`${lender.name} is under way: `}<Link to={dayHref(lender, today.day.key)}>{`today's reading, ${today.day.title}`}</Link></p>;
  }
  if (view.state !== "after") return null;
  const next = buildRun(occasion, targetIn(occasion, run.target.year + 1), OCCASIONS);
  return <p className="cd-onward">{`${occasion.name} ${next.target.year} begins on ${longDate(next.entries[0].date)}.`}</p>;
}

function CatchUp({ view, run }: { view: RunView; run: Run }) {
  const unread = run.entries.filter((entry) => entry.n < view.todayN && !view.isRead(entry.day.key));
  if (!unread.length || view.state === "coming-up") return null;
  return <p className="cd-catch-up"><Link to={dayHref(run.occasion, unread[0].day.key, view.date)}>{plural(unread.length, "{n} earlier day you haven't read", "{n} earlier days you haven't read")}</Link></p>;
}

function PlanList({ view, run }: { view: RunView; run: Run }) {
  const reference = useReference();
  return (
    <section className="cd-plan" aria-labelledby="cd-plan-title">
      <h2 id="cd-plan-title">Every day</h2>
      <ol className="cd-plan-rows">
        {run.entries.map(({ day, date, n }) => (
          <li key={day.key} className={n === view.todayN ? "cd-plan-today" : undefined}>
            <span className="cd-plan-date">{weekdayDate(date)}</span>
            <Link to={dayHref(run.occasion, day.key, view.date)} className="cd-plan-title">
              {day.label && <span className="cd-plan-label">{day.label} · </span>}{day.title}
            </Link>
            <span className="cd-plan-ref">{day.readings.map(reference).join("; ")}</span>
            <span className="cd-plan-mark" aria-label={view.isRead(day.key) ? "read" : "not read"}>{view.isRead(day.key) ? "✓" : ""}</span>
          </li>
        ))}
      </ol>
      {run.occasion.note && <p className="cd-quiet">{run.occasion.note}</p>}
    </section>
  );
}

export function OccasionPage({ occasion }: { occasion: Occasion }) {
  const view = useRun(occasion);
  const reference = useReference();
  const location = useLocation();
  const missing = Boolean((location.state as { missingDay?: boolean } | null)?.missingDay);
  const { run, state } = view;
  const chosen = occasion.target.kind === "chosen";
  return (
    <article className={`cd-page cd-style-${occasion.style} mx-auto max-w-5xl px-4 sm:px-6`}>
      <p className="cd-crumbs"><Link to="/countdowns">Countdowns</Link></p>
      <h1>{occasion.heading}</h1>
      <p className="cd-intro">{occasion.intro}</p>
      {missing && <p className="cd-gentle" role="status">We couldn't find that day; here is today's reading.</p>}
      {chosen && (!run || view.dateError) && <DateForm occasion={occasion} view={view} />}
      {run && state && (
        <>
          <p className="cd-status">{statusLine(run, state, view.todayN)}</p>
          <Onward view={view} run={run} />
          {/* Before the season the church panel comes first, because churches plan weeks ahead (design 6.3). */}
          {!chosen && state === "coming-up" && <ChurchPanel key={run.id} run={run} owner={ownerSlug(occasion)} />}
          {chosen && <PersonalControls occasion={occasion} view={view} run={run} />}
          {state === "finished" ? <p className="cd-gentle">This countdown has finished.</p> : <Today view={view} run={run} />}
          <SavingNote saving={view.saving} />
          <CalendarGrid run={run} todayN={view.todayN} isRead={view.isRead} hrefOf={(key) => dayHref(occasion, key, view.date)} reference={reference} />
          <CatchUp view={view} run={run} />
          <PlanList view={view} run={run} />
          {!chosen && state !== "coming-up" && <ChurchPanel key={run.id} run={run} owner={ownerSlug(occasion)} />}
          {state === "coming-up" && <p className="cd-quiet">{`This year's dates: ${longDate(run.entries[0].date)} to ${longDate(run.target)}.`}</p>}
        </>
      )}
      <ExploreMore occasion={occasion} />
      <SourceLine />
      <FootLink occasion={occasion} />
    </article>
  );
}
