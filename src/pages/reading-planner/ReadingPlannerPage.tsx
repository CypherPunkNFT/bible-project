// /reading-planner (docs/features/reading-planner/design.md): pick what to read and either a finish date or a pace; the
// page builds the daily plan as the visitor goes, shows the time each day and for the whole plan, prints it, saves it to
// a calendar, and keeps ticks in this browser only once the visitor ticks a day.
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useCatalog } from "@/lib/catalog";
import { formatNumber } from "@/lib/site-format";
import { dateKey, fromDayNumber } from "@/pages/countdowns/calendar";
import { useToday } from "@/pages/countdowns/useToday";
import { canPrint, defaultPaper, usePrintSheet } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import WORDS from "@/data/reading-planner/chapter-words.json";
import { DayList, type DayListHandle, type DayRow } from "./DayList";
import { PlanForm, type PlannerBook } from "./PlanForm";
import { planCalendar } from "./plan-ics";
import { buildPlan, DEFAULT_SPEED, minutesFor, planSignature, readingSignature, WORDS_PER_PAGE, type ChapterWords, type Plan, type PlanError, type PlanSettings } from "./planner";
import { PlanSheet } from "./PlanSheet";
import { toggleDay, useKeptPlan } from "./storage";
import { dayLabel, duration, fullDate, roughNumber, rowDate } from "./text";
import "./reading-planner.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

const CHAPTER_WORDS = WORDS as ChapterWords;
const BOOK_CODES = new Set(Object.keys(CHAPTER_WORDS));
const PLAN_NAME = "Bible reading plan";

const ERROR_TEXT: Record<PlanError, string> = {
  "no-books": "Choose at least one book to read.",
  "bad-start": "Enter a start date.",
  "bad-finish": "Enter a finish date.",
  "finish-before-start": "The finish date is before the start date.",
  "no-weekdays": "Tick at least one day of the week to read on.",
  "no-days-in-span": "None of your reading days fall between these dates.",
  "bad-pace": "Enter a pace as a whole number from 1 to 999.",
  "too-long": "This plan would take more than ten years. Choose a faster pace, a slower reading speed setting, or more reading days.",
};

/** A new plan: the whole Bible, from today, finishing a year on (365 days counting both ends). */
function defaultSettings(todayN: number): PlanSettings {
  return {
    books: Object.keys(CHAPTER_WORDS), mode: "finish", start: dateKey(fromDayNumber(todayN)), finish: dateKey(fromDayNumber(todayN + 364)),
    pace: 3, unit: "chapters", weekdays: [0, 1, 2, 3, 4, 5, 6], speed: DEFAULT_SPEED,
  };
}

/** Saves text as a file through a Blob download. */
function download(name: string, type: string, text: string) {
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReadingPlannerPage() {
  const catalog = useCatalog();
  const todayN = useToday();
  const progress = useKeptPlan(BOOK_CODES);
  const [settings, setSettings] = useState<PlanSettings>(() => progress.kept?.settings ?? defaultSettings(todayN));
  const [paceText, setPaceText] = useState(String(settings.pace));
  const listRef = useRef<DayListHandle>(null);

  const books: PlannerBook[] = useMemo(
    () => catalog.books.filter((book) => BOOK_CODES.has(book.code)).sort((a, b) => a.num - b.num).map(({ code, num, name }) => ({ code, num, name })),
    [catalog],
  );
  const nameOf = useMemo(() => {
    const names = new Map(books.map((book) => [book.code, book.name]));
    return (code: string) => names.get(code) ?? code;
  }, [books]);

  const changePace = (text: string) => {
    setPaceText(text);
    // Only digits count: "1e2" or "2.5" leave the pace invalid rather than becoming something else.
    setSettings((current) => ({ ...current, pace: /^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : NaN }));
  };

  const result = useMemo(() => buildPlan(settings, CHAPTER_WORDS), [settings]);
  const plan = result.ok ? result.plan : null;
  const signature = useMemo(() => (plan ? planSignature(plan) : ""), [plan]);
  const rows: DayRow[] = useMemo(() => (plan ? plan.days.map((day) => {
    const first = plan.chapters[day.first];
    return {
      n: day.n, date: rowDate(day.date), label: dayLabel(plan, day, nameOf, CHAPTER_WORDS),
      time: duration(minutesFor(day.words, settings.speed)), href: `/read/bsb/${first.book}/${first.chapter}`, isToday: day.date === todayN,
    };
  }) : []), [plan, nameOf, settings.speed, todayN]);

  const kept = progress.kept;
  const keptHere = kept !== null && plan !== null && kept.signature === signature;
  const read = useMemo(() => new Set(keptHere ? kept.read : []), [keptHere, kept]);

  const toggle = (n: number) => {
    if (!plan) return;
    if (kept && kept.signature !== signature && kept.read.length > 0
      && !window.confirm("Ticking a day of this plan replaces the plan saved in this browser, and its ticks. Go ahead?")) return;
    // A pace box left half-typed in "finish by a date" mode must not be saved as a broken setting.
    const saved = Number.isInteger(settings.pace) ? settings : { ...settings, pace: 3 };
    progress.update((current) => toggleDay(current, saved, signature, n));
  };
  const forget = () => {
    if (window.confirm("Forget your saved plan and ticks in this browser?")) progress.update(() => null);
  };
  const reopenKept = () => {
    if (!kept) return;
    setSettings(kept.settings);
    setPaceText(String(kept.settings.pace));
  };

  return (
    <article className="rp-page mx-auto max-w-5xl px-4 sm:px-6">
      <header className="rp-head">
        <ToolsBackLink />
        <h1>Bible reading planner</h1>
        <p className="rp-intro">Plan your Bible reading day by day: choose the books, then a finish date or a daily pace in chapters, minutes or pages. See how long each day takes, print the plan or add it to your calendar.</p>
      </header>

      {kept && !keptHere && (
        <p className="rp-kept-elsewhere">
          You have a plan saved in this browser. <button type="button" className="rp-link" onClick={reopenKept}>Open my saved plan</button>
        </p>
      )}

      <PlanForm settings={settings} books={books} paceText={paceText} onPaceText={changePace} onChange={setSettings} />

      <div aria-live="polite">
        {!result.ok && <p className="rp-error" role="alert">{ERROR_TEXT[result.error]}</p>}
      </div>

      {plan && <PlanResults plan={plan} settings={settings} rows={rows} read={read} keptHere={keptHere} saving={progress.saving}
        hasKept={kept !== null} onToggle={toggle} onForget={forget} listRef={listRef} signature={signature} />}
    </article>
  );
}

interface PlanResultsProps {
  plan: Plan;
  settings: PlanSettings;
  rows: readonly DayRow[];
  read: ReadonlySet<number>;
  keptHere: boolean;
  hasKept: boolean;
  saving: boolean;
  signature: string;
  onToggle: (n: number) => void;
  onForget: () => void;
  listRef: RefObject<DayListHandle>;
}

/** The summary, the actions and the day list for a plan that could be built. */
function PlanResults({ plan, settings, rows, read, keptHere, hasKept, saving, signature, onToggle, onForget, listRef }: PlanResultsProps) {
  const [printing, setPrinting] = useState(false);
  const [paper] = useState(defaultPaper);
  const printable = useMemo(() => canPrint(), []);
  const { print } = usePrintSheet(paper, "0.45in");
  useEffect(() => {
    if (!printing) return;
    print();
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done, { once: true });
    return () => window.removeEventListener("afterprint", done);
  }, [printing, print]);

  const days = plan.days;
  const first = days[0];
  const last = days[days.length - 1];
  const longest = Math.max(...days.map((day) => day.words));
  const totalMinutes = minutesFor(plan.totalWords, settings.speed);
  const span = first.date === last.date ? fullDate(first.date) : `${fullDate(first.date)} – ${fullDate(last.date)}`;
  const facts = [
    { label: "Reading days", value: formatNumber(days.length) },
    { label: "Finishes", value: fullDate(last.date) },
    { label: "Each day, on average", value: duration(totalMinutes / days.length) },
    { label: "Longest day", value: duration(minutesFor(longest, settings.speed)) },
    { label: "Chapters a day, on average", value: roughNumber(plan.chapters.length / days.length) },
    { label: "Pages a day, on average", value: roughNumber(plan.totalWords / WORDS_PER_PAGE / days.length) },
    { label: "The whole plan", value: duration(totalMinutes, "long") },
  ];
  const nextUnread = keptHere ? days.find((day) => !read.has(day.n)) : undefined;
  const longerThanPace = settings.mode === "pace" && settings.unit !== "chapters" && (settings.unit === "minutes"
    ? minutesFor(longest, settings.speed) > settings.pace : longest / WORDS_PER_PAGE > settings.pace);
  const fewerThanDates = settings.mode === "finish" && days.length === plan.chapters.length;

  const calendar = () => download("bible-reading-plan.ics", "text/calendar", planCalendar(PLAN_NAME, readingSignature(settings),
    rows.map((row, i) => ({ n: row.n, date: days[i].date, summary: row.label, time: row.time, path: row.href })), new Date()));

  return (
    <section className="rp-results" aria-labelledby="rp-results-title">
      <h2 id="rp-results-title">Your plan</h2>
      <p className="rp-span">{span}</p>
      <dl className="rp-facts">
        {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        {keptHere && <div className="rp-fact-progress"><dt>Days read</dt><dd>{`${formatNumber(read.size)} / ${formatNumber(days.length)}`}</dd></div>}
      </dl>
      {days.length === 1 && <p className="rp-note">The whole reading fits in one day.</p>}
      {fewerThanDates && days.length > 1 && <p className="rp-note">There are more reading days than chapters, so the plan gives one chapter a day and finishes early.</p>}
      {longerThanPace && <p className="rp-note">Some days run longer than your pace, because a chapter is never split.</p>}
      <p className="rp-note">Times are estimates at your reading speed.</p>

      <div className="rp-actions">
        {printable
          ? <button type="button" className="rp-button" onClick={() => setPrinting(true)}>Print the plan</button>
          : <p className="rp-note">To print, open this page in your phone's own browser.</p>}
        <button type="button" className="rp-button" onClick={calendar}>Add to calendar</button>
        {nextUnread && <button type="button" className="rp-button rp-button-quiet" onClick={() => listRef.current?.scrollToDay(nextUnread.n)}>Next day to read</button>}
        {hasKept && <button type="button" className="rp-link" onClick={onForget}>Forget my saved plan</button>}
      </div>
      <p className="rp-privacy">
        {saving
          ? "Tick a day to keep this plan and your ticks in this browser only. Nothing is sent anywhere: no account and no tracking."
          : "This browser won't let the site keep anything, so your ticks last only while this page is open."}
      </p>
      <p className="rp-note">The calendar file has one all-day entry for each reading day, with its chapters, its time and a link. No alarms.</p>

      <DayList ref={listRef} rows={rows} read={read} onToggle={onToggle} version={`${signature}|${settings.speed}`} />

      {/* Always mounted, so its container exists when Print is pressed and the print sees the sheet drawn. */}
      <PrintPortal label="reading-plan-sheet">
        {printing && <PlanSheet title={PLAN_NAME} span={span} facts={facts} rows={rows} />}
      </PrintPortal>
    </section>
  );
}
