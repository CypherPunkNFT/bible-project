// Today's puzzle on screen (design §3, §8, §9): the header with its three panels, the board, the message line, the
// keyboard or, once the game is over, the result card. Every guess is saved the moment it is played, so a reload
// brings the same board back; without storage the game plays the same and only the stats are not kept.
import { BarChart3, CircleHelp, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatList, formatNumber } from "@/lib/site-format";
import { Board } from "./Board";
import { createDaily, type AnswerEntry, type Answers, type Daily } from "./daily";
import type { WordleSchedule } from "./daily-rules";
import { evaluate, guessSet, keyMarks, outcomeOf, refusalFor, type Refusal } from "./evaluate";
import { Keyboard, type KeyName } from "./Keyboard";
import { HelpPanel, SettingsPanel, StatsPanel, type PanelName } from "./Panels";
import { Result } from "./Result";
import { shareText } from "./share";
import { finishToday, markHelpSeen, readRecord, recordGuess, setContrast, setHard, startToday, STORAGE_KEY, withHint, writeRecord,
  type WordleRecord } from "./storage";
import { CATEGORY_HINT, markLabel, WIN_LINES } from "./text";

export interface WordleData { answers: Answers; schedule: WordleSchedule; guesses: { words: string } }

/** Five tiles turning 250 ms apart, plus the last one's own turn. */
const REVEAL_MS = 4 * 250 + 500;
const HINT_AFTER = 3;

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
  if (n < 1) return <p className="bw-message">{`Bible Wordle begins on ${formatDate(daily.dateOf(1), { day: "numeric", month: "long", year: "numeric" })}.`}</p>;
  const answer = daily.wordFor(n);
  const entry = answer ? data.answers[answer] : undefined;
  if (!answer || !entry) return <p className="bw-message" role="alert">The puzzle could not be loaded.</p>;
  const today = daily.numberOn(now);
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

function Puzzle({ n, answer, entry, daily, allowed, now, next, onNext }: PuzzleProps) {
  const [saved, update] = useRecord(n);
  const today = saved.record.today?.n === n ? saved.record.today : null;
  const guesses = today?.guesses ?? [];
  const hard = today?.hard ?? saved.record.settings.hard;
  const contrast = saved.record.settings.contrast;
  const outcome = outcomeOf(guesses, answer);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [shake, setShake] = useState(0);
  const [revealing, setRevealing] = useState<number | null>(null);
  const [panel, setPanel] = useState<PanelName | null>(() => (saved.record.seenHelp ? null : "help"));

  useEffect(() => { update((record) => (record.seenHelp ? record : markHelpSeen(record))); }, [update]);

  const submit = () => {
    const refusal = refusalFor(typed, guesses, answer, allowed, hard);
    if (refusal) { setMessage(refusalText(refusal)); setShake((count) => count + 1); return; }
    const index = guesses.length;
    const played = update((record) => finishToday(recordGuess(record, n, index, typed, answer), n, answer)).today?.guesses ?? [];
    if (played.length !== index + 1 || played[index] !== typed) return; // another tab played first: its board is shown
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTyped("");
    setShake(0);
    setRevealing(reduced ? null : index);
    if (!reduced) window.setTimeout(() => setRevealing(null), REVEAL_MS);
    setAnnouncement(formatList(evaluate(typed, answer).map((mark, i) => markLabel(typed[i], mark))));
    setMessage(outcomeOf(played, answer) === "won" ? WIN_LINES[played.length - 1].label : "");
  };

  const onKey = (key: KeyName) => {
    if (panel || revealing !== null || outcome !== "playing") return;
    if (key === "enter") return submit();
    setMessage("");
    if (key === "back") setTyped((value) => value.slice(0, -1));
    else setTyped((value) => (value.length < 5 ? value + key : value));
  };
  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;
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
      } else if (/^[a-zA-Z]$/.test(event.key)) onKeyRef.current(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const finished = outcome !== "playing" && revealing === null;
  const share = () => shareText({ n, rows: guesses.map((guess) => evaluate(guess, answer)), won: outcome === "won", hard, hint: today?.hint ?? false,
    dark: document.documentElement.dataset.theme !== "light", contrast });

  return <div className={`bw-game${contrast ? " bw-contrast" : ""}`}>
    <header className="bw-head">
      <div>
        <h1>Bible Wordle</h1>
        <p className="bw-date">{`#${formatNumber(n)} · ${formatDate(daily.dateOf(n), { weekday: "long", day: "numeric", month: "long" })}`}</p>
      </div>
      <div className="bw-tools">
        <button type="button" className="bw-icon" onClick={() => setPanel("help")} aria-label="How to play"><CircleHelp size={20} aria-hidden="true" /></button>
        <button type="button" className="bw-icon" onClick={() => setPanel("stats")} aria-label="Statistics"><BarChart3 size={20} aria-hidden="true" /></button>
        <button type="button" className="bw-icon" onClick={() => setPanel("settings")} aria-label="Settings"><Settings size={20} aria-hidden="true" /></button>
      </div>
    </header>
    <Board guesses={guesses} answer={answer} typed={typed} revealing={revealing} shake={shake} />
    <p className="bw-message" aria-live="polite">{message}</p>
    <p className="sr-only" aria-live="polite">{announcement}</p>
    {today?.hint && outcome === "playing" && <p className="bw-hint">{CATEGORY_HINT[entry.c].label}</p>}
    {finished
      ? <Result n={n} answer={answer} entry={entry} tries={guesses.length} won={outcome === "won"} shareText={share} record={saved.record}
          now={now} next={next} onNext={onNext} onStats={() => setPanel("stats")} />
      : <>
          {outcome === "playing" && guesses.length >= HINT_AFTER && !today?.hint && <button type="button" className="bw-link bw-hint-button"
            onClick={() => update((record) => withHint(record, n))}>Show a hint</button>}
          <Keyboard marks={keyMarks(guesses, answer)} onKey={onKey} />
        </>}
    {panel === "help" && <HelpPanel onClose={() => setPanel(null)} />}
    {panel === "stats" && <StatsPanel record={saved.record} available={saved.available} todayN={n} wonTries={outcome === "won" ? guesses.length : null} onClose={() => setPanel(null)} />}
    {panel === "settings" && <SettingsPanel hard={hard} hardLocked={guesses.length > 0} contrast={contrast} onClose={() => setPanel(null)}
      onHard={(on) => update((record) => setHard(record, n, on))} onContrast={(on) => update((record) => setContrast(record, on))} />}
  </div>;
}
