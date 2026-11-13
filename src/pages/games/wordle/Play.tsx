// Today's puzzle on screen (design §3, §8, §9), after the start page (Start.tsx): the header with its three panels,
// the board, the message pill, the hint lamp and the keyboard or, once the game is over, the result panel. Every guess is saved the moment it is played,
// so a reload brings the same board back; without storage the game plays the same and only the stats are not kept.
// Nothing here waits for an animation: the row's turn, the hop and the panel's rise only decorate state that has
// already changed, and under reduced motion the timers are zero.
import { ArrowLeft, BarChart3, CircleHelp, Lightbulb, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatList, formatNumber, plural } from "@/lib/site-format";
import { motionMs, prefersReducedMotion, StreakFlame } from "../kit";
import { Board, REVEAL_MS } from "./Board";
import { createDaily, type AnswerEntry, type Answers, type Daily } from "./daily";
import type { WordleSchedule } from "./daily-rules";
import { evaluate, guessSet, keyMarks, outcomeOf, refusalFor, type Refusal } from "./evaluate";
import { Keyboard, type KeyName } from "./Keyboard";
import { HelpPanel, SettingsPanel, StatsPanel, type PanelName } from "./Panels";
import { Result } from "./Result";
import { Start } from "./Start";
import { shareText } from "./share";
import { currentStreak, finishToday, markHelpSeen, readRecord, recordGuess, setContrast, setHard, startToday, STORAGE_KEY, withHint, writeRecord,
  type WordleRecord } from "./storage";
import { CATEGORY_HINT, markLabel, WIN_LINES } from "./text";

export interface WordleData { answers: Answers; schedule: WordleSchedule; guesses: { words: string } }

const HINT_AFTER = 3;
/** How long a message pill stays before it fades. */
const PILL_MS = 2200;
/** The pause between the last tile settling and the result panel rising. */
const SETTLE_MS = 900;

function refusalText(refusal: Refusal): string {
  if (refusal.kind === "short") return "Not enough letters";
  if (refusal.kind === "unknown") return "Not in the word list";
  if (refusal.kind === "repeat") return "You already tried that word";
  if (refusal.kind === "position") return `Letter ${refusal.position} must be ${refusal.letter.toUpperCase()}`;
  return `Your guess must include ${refusal.letter.toUpperCase()}`;
}

/** The time now, ticking every second (so the countdown is right after the tab sleeps, and the day turns at midnight). */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function Play({ data }: { data: WordleData }) {
  const daily = useMemo(() => createDaily(data.schedule, data.answers), [data]);
  const allowed = useMemo(() => guessSet(data.guesses.words), [data]);
  const [n, setN] = useState(() => daily.numberOn(new Date())); // fixed for this game: one opened before midnight finishes as that day's
  const now = useNow();
  /** The start page shows once per visit; "Play #n" for the next day goes straight to its board. */
  const [entered, setEntered] = useState(false);
  if (n < 1) return <p className="bw-message">{`Bible Wordle begins on ${formatDate(daily.dateOf(1), { day: "numeric", month: "long", year: "numeric" })}.`}</p>;
  const answer = daily.wordFor(n);
  const entry = answer ? data.answers[answer] : undefined;
  if (!answer || !entry) return <p className="bw-message" role="alert">The puzzle could not be loaded.</p>;
  const today = daily.numberOn(now);
  if (!entered) return <Start n={n} answer={answer} daily={daily} onPlay={() => setEntered(true)} />;
  return <Puzzle key={n} n={n} answer={answer} entry={entry} daily={daily} allowed={allowed} now={now}
    next={today > n ? today : null} onNext={() => setN(daily.numberOn(new Date()))} />;
}

interface PuzzleProps { n: number; answer: string; entry: AnswerEntry; daily: Daily; allowed: ReadonlySet<string>; now: Date; next: number | null; onNext: () => void }
interface Saved { record: WordleRecord; available: boolean }

/** The stored record and a way to change it that re-reads storage first, so another tab's guesses are never overwritten. */
function useRecord(n: number) {
  const [saved, setSaved] = useState<Saved>(() => { const read = readRecord(); return { ...read, record: startToday(read.record, n) }; });
  const savedRef = useRef(saved);
  const update = useCallback((change: (record: WordleRecord) => WordleRecord): WordleRecord => {
    const fresh = readRecord();
    // After a failed write, storage is stale even when reads still succeed (for example at quota).
    const available = savedRef.current.available && fresh.available;
    const next = change(startToday(available ? fresh.record : savedRef.current.record, n));
    const value = { record: next, available: available && writeRecord(next) };
    savedRef.current = value;
    setSaved(value);
    return next;
  }, [n]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const read = readRecord();
      const value = { ...read, record: startToday(read.record, n) };
      savedRef.current = value;
      setSaved(value);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [n]);
  return [saved, update] as const;
}

/** A message that clears itself after a moment, so the pill fades; "" clears it at once. */
function useFadingMessage(): [string, (text: string) => void] {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), PILL_MS);
    return () => window.clearTimeout(timer);
  }, [message]);
  return [message, setMessage];
}

function Puzzle({ n, answer, entry, daily, allowed, now, next, onNext }: PuzzleProps) {
  const [saved, update] = useRecord(n);
  const today = saved.record.today?.n === n ? saved.record.today : null;
  const guesses = useMemo(() => today?.guesses ?? [], [today]);
  const hard = today?.hard ?? saved.record.settings.hard;
  const contrast = saved.record.settings.contrast;
  const outcome = outcomeOf(guesses, answer);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useFadingMessage();
  const [announcement, setAnnouncement] = useState("");
  const [shake, setShake] = useState(0);
  const [revealing, setRevealing] = useState<number | null>(null);
  const [hopping, setHopping] = useState<number | null>(null);
  /** The result may rise: true from the start for a game already over, else after the last row's turn and a pause. */
  const [settled, setSettled] = useState(() => outcome !== "playing");
  /** The player can close the result and come back to the board; Show result reopens it. */
  const [resultOpen, setResultOpen] = useState(true);
  /** Whether the result should take focus when it appears: not at a plain reload. */
  const [resultFocus, setResultFocus] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const justPlayed = useRef(false);
  const [panel, setPanel] = useState<PanelName | null>(() => (saved.record.seenHelp ? null : "help"));

  useEffect(() => { update((record) => (record.seenHelp ? record : markHelpSeen(record))); }, [update]);

  // The row's turn: the keyboard colours and the game goes on once it is over.
  useEffect(() => {
    if (revealing === null) return;
    const timer = window.setTimeout(() => setRevealing(null), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [revealing]);

  // After the last row has turned: the cheer or the answer in the pill, the hop, and the result after a pause.
  useEffect(() => {
    if (revealing !== null || outcome === "playing" || !justPlayed.current) return;
    justPlayed.current = false;
    const won = outcome === "won";
    setMessage(won ? WIN_LINES[guesses.length - 1].label : answer.toUpperCase());
    if (won) { setHopping(guesses.length - 1); setCelebrate(true); }
    setResultFocus(true);
    const pause = motionMs(SETTLE_MS);
    if (pause === 0) { setSettled(true); return; }
    const timer = window.setTimeout(() => { setSettled(true); setMessage(""); }, pause); // the panel carries the line from here
    return () => window.clearTimeout(timer);
  }, [revealing, outcome, guesses, answer, setMessage]);

  // While a game is in progress the page says so, and its stylesheet keeps the site's floating button clear of the keys.
  useEffect(() => {
    if (outcome !== "playing") return;
    document.body.classList.add("bw-playing");
    return () => document.body.classList.remove("bw-playing");
  }, [outcome]);

  const submit = () => {
    const refusal = refusalFor(typed, guesses, answer, allowed, hard);
    if (refusal) { setMessage(refusalText(refusal)); setShake((count) => count + 1); return; }
    const index = guesses.length;
    const played = update((record) => finishToday(recordGuess(record, n, index, typed, answer), n, answer)).today?.guesses ?? [];
    if (played.length !== index + 1 || played[index] !== typed) return; // another tab played first: its board is shown
    justPlayed.current = true;
    setTyped("");
    setShake(0);
    setMessage("");
    setRevealing(prefersReducedMotion() ? null : index);
    setAnnouncement(formatList(evaluate(typed, answer).map((mark, i) => markLabel(typed[i], mark))));
  };

  const onKey = (key: KeyName) => {
    if (key === "escape") { if (outcome !== "playing") setResultOpen(false); return; }
    if (panel || revealing !== null || outcome !== "playing") return;
    if (key === "enter") return submit();
    setMessage("");
    if (key === "back") setTyped((value) => value.slice(0, -1));
    else setTyped((value) => (value.length < 5 ? value + key : value));
  };
  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;
  const pressKey = useCallback((key: KeyName) => onKeyRef.current(key), []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && (target.isContentEditable || target.closest("input, textarea, select, dialog"))) return;
      if (event.key === "Enter") {
        if (target?.closest("button, a")) return; // Enter presses the focused button only
        event.preventDefault();
        onKeyRef.current("enter");
      } else if (event.key === "Backspace") {
        event.preventDefault();
        onKeyRef.current("back");
      } else if (event.key === "Escape") onKeyRef.current("escape");
      else if (/^[a-zA-Z]$/.test(event.key)) onKeyRef.current(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const finished = outcome !== "playing" && revealing === null;
  const showResult = finished && resultOpen && (settled || prefersReducedMotion());
  const rows = useMemo(() => guesses.map((guess) => evaluate(guess, answer)), [guesses, answer]);
  // The keyboard learns a row only once that row has turned.
  const marks = useMemo(() => keyMarks(revealing === null ? guesses : guesses.slice(0, revealing), answer), [guesses, revealing, answer]);
  const share = shareText({ n, rows, won: outcome === "won", hard, hint: today?.hint ?? false, dark: document.documentElement.dataset.theme !== "light", contrast });
  const streak = currentStreak(saved.record, n);
  const hintReady = guesses.length >= HINT_AFTER;
  const openResult = () => { setResultFocus(true); setResultOpen(true); };

  return <div className={`bw-game${contrast ? " bw-contrast" : ""}${outcome === "playing" ? " bw-live" : ""}`}>
    <header className="bw-head">
      <Link className="bw-back" to="/games"><ArrowLeft size={18} aria-hidden="true" /><span className="bw-back-text">All games</span></Link>
      <div className="bw-title">
        <h1>Bible Wordle</h1>
        <p className="bw-date">{`#${formatNumber(n)} · ${formatDate(daily.dateOf(n), { weekday: "long", day: "numeric", month: "long" })}`}</p>
        <p className="bw-date-short" aria-hidden="true">{`#${formatNumber(n)} · ${formatDate(daily.dateOf(n), { weekday: "short", day: "numeric", month: "short" })}`}</p>
        {streak > 0 && <StreakFlame className="bw-flame" count={streak} label={plural(streak, "{n} day in a row", "{n} days in a row")} />}
      </div>
      <div className="bw-tools">
        <button type="button" className="bw-icon" onClick={() => setPanel("help")} aria-label="How to play"><CircleHelp size={20} aria-hidden="true" /></button>
        <button type="button" className="bw-icon" onClick={() => setPanel("stats")} aria-label="Statistics"><BarChart3 size={20} aria-hidden="true" /></button>
        <button type="button" className="bw-icon" onClick={() => setPanel("settings")} aria-label="Settings"><Settings size={20} aria-hidden="true" /></button>
      </div>
    </header>
    <div className="bw-stage">
      <p className={`bw-pill${message ? " bw-pill-on" : ""}`} aria-live="polite">{message}</p>
      <Board guesses={guesses} answer={answer} typed={typed} shake={shake} hopping={hopping} />
    </div>
    <p className="sr-only" aria-live="polite">{announcement}</p>
    <div className="bw-slot">
      {today?.hint && outcome === "playing" && <p className="bw-ribbon">{CATEGORY_HINT[entry.c].label}</p>}
      {outcome === "playing" && !today?.hint && <>
        <button type="button" className={`bw-lamp${hintReady ? " bw-lamp-lit" : ""}`} aria-label="Show a hint" aria-disabled={!hintReady}
          aria-describedby="bw-lamp-note" onClick={() => { if (hintReady) update((record) => withHint(record, n)); }}>
          <Lightbulb size={20} aria-hidden="true" />
        </button>
        <span id="bw-lamp-note" className="sr-only">A hint comes after three guesses</span>
      </>}
    </div>
    {showResult && <Result answer={answer} entry={entry} rows={rows} won={outcome === "won"} shareText={share} record={saved.record} streak={streak}
      celebrate={celebrate} focus={resultFocus} now={now} next={next} onNext={onNext} onStats={() => setPanel("stats")}
      onClose={() => setResultOpen(false)} />}
    {finished && settled && !resultOpen && <div className="bw-reopen">
      <button type="button" className="bw-button bw-primary" onClick={openResult} autoFocus={resultFocus}>Show result</button>
    </div>}
    {!finished && <Keyboard marks={marks} onKey={pressKey} />}
    {panel === "help" && <HelpPanel onClose={() => setPanel(null)} />}
    {panel === "stats" && <StatsPanel record={saved.record} available={saved.available} todayN={n} wonTries={outcome === "won" ? guesses.length : null} dateOf={daily.dateOf} onClose={() => setPanel(null)} />}
    {panel === "settings" && <SettingsPanel hard={hard} hardLocked={guesses.length > 0} contrast={contrast} onClose={() => setPanel(null)}
      onHard={(on) => update((record) => setHard(record, n, on))} onContrast={(on) => update((record) => setContrast(record, on))} />}
  </div>;
}
