// Hot seat: the turn itself (design §4.3, §6.4), the screen that matters most. The reader sees the question and its
// answer on a card in the middle of the screen and taps Right, Wrong or Pass; the card is thrown off with its mark
// stamped on it (right to the right, wrong to the left, a pass drops away) while the next card, already drawn, settles
// up at once. The clock is a dial the room can read, running from an end time on performance.now(), checked five times
// a second, so a slow phone never gives extra time; it pulses for the last five seconds and "Time!" stamps over it at
// the buzzer, so the question never moves while the reader is mid-sentence. The question on screen at the buzzer may
// still be marked; a pause (or the page being hidden) stops the clock and hides question and answer.
import { Check, Menu, Pause, Redo2, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { plural } from "@/lib/site-format";
import { beep, buzz } from "../charades/sound";
import { StreakFlame } from "../kit";
import { MARK_SIGNS } from "./display";
import { IDLE_CLOSE_MS, currentRun, scoreOf, type Asked, type Mark, type Turn } from "./game";
import { groupInfo } from "./pool";
import { Reference } from "./Reference";

const CLOCK_MS = 200;
/** The time left is saved this often during a live turn, besides every mark and pause. */
const SAVE_EVERY_MS = 5000;
/** How long the thrown card stays in the layer while it slides off (the animation is a little shorter). */
const LEAVE_MS = 320;
/** From how many right answers in a row the flame lights beside the score. */
const STREAK_FROM = 3;

export interface TurnProps {
  turn: Turn;
  playerName: string;
  paused: boolean;
  sound: boolean;
  /** Whether Resume can be offered; false while the questions are still loading after a reload. */
  canResume: boolean;
  /** Shown on the pause screen when Resume cannot be offered yet. */
  waiting: ReactNode;
  onMark: (mark: Mark, leftMs: number) => void;
  onUndo: (leftMs: number) => void;
  onTime: (leftMs: number) => void;
  onTimeUp: () => void;
  onClose: () => void;
  onPause: (leftMs: number) => void;
  onResume: () => void;
  onMenu: () => void;
}

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
const KEYS: Record<string, Mark> = { ArrowRight: "right", ArrowLeft: "wrong", ArrowDown: "pass" };

interface Leaving { asked: Asked; mark: Mark; key: number }

export function TurnScreen(props: TurnProps) {
  const { turn, paused } = props;
  const endAt = useRef<number | null>(null);
  const [clock, setClock] = useState(() => performance.now());
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const [plus, setPlus] = useState(0);
  const [announce, setAnnounce] = useState("");
  const latest = useRef(props);
  latest.current = props;
  const running = !paused && turn.phase === "live";
  const play = (kind: Parameters<typeof beep>[0]) => { if (latest.current.sound) beep(kind); };

  const leftNow = () => (endAt.current === null ? latest.current.turn.leftMs : Math.max(0, endAt.current - performance.now()));

  // The clock: an end time set when the turn runs, cleared when it pauses or time is up.
  useEffect(() => {
    if (!running) { endAt.current = null; return; }
    const start = performance.now();
    endAt.current = start + latest.current.turn.leftMs;
    let lastSecond = -1;
    let lastSave = start;
    const timer = window.setInterval(() => {
      const t = performance.now();
      setClock(t);
      const left = Math.max(0, (endAt.current ?? t) - t);
      if (left <= 0) {
        window.clearInterval(timer);
        endAt.current = null;
        if (latest.current.sound) beep("buzzer");
        setAnnounce("Time");
        latest.current.onTimeUp();
        return;
      }
      const seconds = Math.ceil(left / 1000);
      if (seconds <= 5 && seconds !== lastSecond && latest.current.sound) beep("tick");
      lastSecond = seconds;
      if (t - lastSave >= SAVE_EVERY_MS) { lastSave = t; latest.current.onTime(left); }
    }, CLOCK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  // After the buzzer: if the reader does nothing for 15 seconds, the open question is left unmarked (§4.3).
  useEffect(() => {
    if (paused || turn.phase !== "overtime") return;
    const timer = window.setTimeout(() => latest.current.onClose(), IDLE_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [paused, turn.phase]);

  // A call, a notification or a locked phone: the turn pauses and the question is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !latest.current.paused) latest.current.onPause(leftNow());
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onVisibility); };
  });

  // The thrown card is taken down after its slide; the next card is on screen from the mark itself.
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  const current = turn.questions.at(-1);
  const open = current && current.mark === null ? current : null;
  useEffect(() => { if (open && !paused) setAnnounce(open.q.text); }, [open, paused]);

  const mark = (value: Mark) => {
    if (paused || !open) return;
    if (value === "right") { play("correct"); setPlus((n) => n + 1); }
    else if (value === "pass") play("pass");
    buzz(30);
    setLeaving({ asked: open, mark: value, key: turn.questions.length });
    props.onMark(value, leftNow());
  };
  const undo = () => { if (!paused && turn.phase === "live") { setLeaving(null); props.onUndo(leftNow()); } };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      if (event.key === "Escape") { event.preventDefault(); if (!paused) props.onPause(leftNow()); return; }
      if (paused) return;
      if (KEYS[event.key]) { event.preventDefault(); mark(KEYS[event.key]); }
      else if (event.key === "Backspace") { event.preventDefault(); undo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bound every render, so it always sees the current question

  const left = running && endAt.current !== null ? Math.max(0, endAt.current - clock) : turn.leftMs;
  const secondsLeft = turn.phase === "live" ? Math.ceil(left / 1000) : 0;
  const score = scoreOf(turn.questions);
  const run = currentRun(turn.questions);
  const canUndo = turn.phase === "live" && turn.questions.some((a) => a.mark !== null);

  return <div className={`hs-turn is-${turn.phase}`}>
    <div className="hs-topbar">
      <div className="hs-score-box">
        <p className="hs-score" aria-label={plural(score, "{n} point", "{n} points")}><span aria-hidden="true">✓</span> <strong>{score}</strong></p>
        {plus > 0 && <span key={plus} className="hs-plus" aria-hidden="true">+1</span>}
        <StreakFlame count={run} litFrom={STREAK_FROM} label={plural(run, "{n} in a row", "{n} in a row")} className="hs-streak" />
      </div>
      <Clock secondsLeft={secondsLeft} total={turn.seconds} over={turn.phase !== "live"} />
      <button type="button" className="hs-icon" onClick={() => props.onPause(leftNow())} aria-label="Pause" disabled={paused}><Pause size={20} aria-hidden="true" /></button>
      {turn.phase === "overtime" && !paused && <div className="hs-time-stamp" role="status">
        <span className="hs-time-word">Time!</span>
        <span className="hs-time-note">Finish this question.</span>
      </div>}
    </div>
    <p className="sr-only" aria-live="polite">{paused ? "" : announce}</p>
    {paused ? <div className="hs-paused">
      <h2>Paused</h2>
      <p>The question is hidden until you carry on.</p>
      {props.canResume ? <button type="button" className="hs-primary hs-big" onClick={props.onResume} autoFocus>Resume</button> : props.waiting}
      <button type="button" className="hs-secondary" onClick={props.onMenu}><Menu size={16} aria-hidden="true" />Menu</button>
    </div> : <>
      <div className="hs-seat"><span className="hs-label">In the hot seat</span> <span className="hs-seat-name">{props.playerName}</span>
        <span className="hs-seat-group">{groupInfo(turn.group).label}</span></div>
      <div className="hs-deck">
        {open && <QuestionCard key={`${open.q.id}-${turn.questions.length}`} asked={open} />}
        {leaving && <QuestionCard key={`leaving-${leaving.key}`} asked={leaving.asked} leaving={leaving.mark} />}
      </div>
      <div className="hs-buttons">
        <button type="button" className="hs-undo" onClick={undo} disabled={!canUndo}><Undo2 size={16} aria-hidden="true" />Undo</button>
        <button type="button" className="hs-mark is-wrong" onClick={() => mark("wrong")} disabled={!open}><X size={22} aria-hidden="true" />Wrong</button>
        <button type="button" className="hs-mark is-pass" onClick={() => mark("pass")} disabled={!open}><Redo2 size={22} aria-hidden="true" />Pass</button>
        <button type="button" className="hs-mark is-right" onClick={() => mark("right")} disabled={!open}><Check size={24} aria-hidden="true" />Right</button>
      </div>
    </>}
  </div>;
}

/** One question on its card: the question, the two choices if any, and the answer band. A card being thrown carries
 * its mark stamped on it and is hidden from readers; the next card is the live one. */
function QuestionCard({ asked, leaving }: { asked: Asked; leaving?: Mark }) {
  const { q } = asked;
  return <div className={`hs-card${leaving ? ` is-leaving is-${leaving}` : ""}`} aria-hidden={leaving ? "true" : undefined}>
    {leaving && <span className="hs-stamp" aria-hidden="true">{MARK_SIGNS[leaving].sign}</span>}
    <p className="hs-question">{q.text}</p>
    {q.choices && <p className="hs-choices">
      <span className={q.choices[0] === q.answer ? "is-right" : undefined}>{q.choices[0]}</span>
      <span className="hs-or">or</span>
      <span className={q.choices[1] === q.answer ? "is-right" : undefined}>{q.choices[1]}<span className="hs-q-mark" aria-hidden="true">?</span></span>
    </p>}
    <div className="hs-answer">
      <span className="hs-label">Answer</span>
      <strong>{q.answer}</strong>
      {q.full && <span className="hs-full">{q.full}</span>}
      {q.reference && <Reference q={q} plain />}
    </div>
  </div>;
}

/** Large digits inside a ring that drains once a second; the last five seconds change colour and pulse (and the digits
 * say it too). At zero the ring is gone, so no stub of the rounded stroke is left at the top. */
function Clock({ secondsLeft, total, over }: { secondsLeft: number; total: number; over: boolean }) {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const share = Math.max(0, Math.min(1, secondsLeft / total));
  const low = !over && secondsLeft <= 5;
  return <div className={`hs-clock${low ? " is-low" : ""}${over || share === 0 ? " is-over" : ""}`} role="timer" aria-label={plural(secondsLeft, "{n} second left", "{n} seconds left")}>
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r={radius} className="hs-ring-back" />
      <circle cx="30" cy="30" r={radius} className="hs-ring" strokeDasharray={length} strokeDashoffset={length * (1 - share)} />
    </svg>
    <span aria-hidden="true">{secondsLeft}</span>
  </div>;
}
