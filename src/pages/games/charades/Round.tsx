// Family charades: the round itself, drawn as a fixed layer over the page (design §7.2–§7.5): get ready, the 3-2-1
// countdown, the card, the answer feedback, the pause sheet and "Time's up!". Tilt, buttons and keys all answer at
// once (§5.1). The clock runs from an end time on performance.now() (game.ts), checked five times a second.
import { Check, EyeOff, Pause, Redo2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Scene } from "./deck";
import { advance, answer, leftMs, pause, resume, startRound, stopRound, tick, type Round } from "./game";
import { READINGS_STOPPED_MS, leaveFullscreen, releaseWakeLock, requestWakeLock, screenAngle, useOrientation } from "./sensors";
import { beep, buzz } from "./sound";
import type { Mode } from "./storage";
import { FEEDBACK_MS, afterAnswer, feed, newDetector, newTurnTracker, trackTurn, type Reading, type TiltEvent } from "./tilt";

export const END_SCREEN_MS = 1200;
const COUNTDOWN = [3, 2, 1, 0] as const;
const CLOCK_MS = 200;

export interface RoundProps {
  scenes: ReadonlyMap<string, Scene>;
  order: string[];
  seconds: number;
  mode: Mode;
  /** Tilt answers in this round (the Start tap's check found readings). */
  tilt: boolean;
  pictures: boolean;
  sound: boolean;
  littleOnes: boolean;
  teamName: string | null;
  /** Why tilt is off this round, from the Start tap's check (§5.4), shown on the get-ready screen. */
  notice: string | null;
  onSound: (on: boolean) => void;
  onEnd: (round: Round) => void;
}

type Stage = "ready" | "countdown" | "live" | "ending";
const now = () => performance.now();
const storyOfMap = (scenes: ReadonlyMap<string, Scene>) => (id: string) => scenes.get(id)?.story;

/** Keys typed into a form are not answers; Enter or Space on a button is its own click. */
const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("button, a, summary");

export function RoundLayer(props: RoundProps) {
  const { scenes, order, seconds, mode, tilt, sound, onEnd } = props;
  const storyOf = useCallback((id: string) => storyOfMap(scenes)(id), [scenes]);
  const [stage, setStage] = useState<Stage>("ready");
  const [count, setCount] = useState(0); // index into COUNTDOWN
  const [round, setRoundState] = useState<Round | null>(null);
  const [clock, setClock] = useState(now);
  const [feedback, setFeedback] = useState<"correct" | "pass" | null>(null);
  const [hidden, setHidden] = useState(false);
  const [tiltLost, setTiltLost] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [turn, setTurn] = useState(0);

  const roundRef = useRef<Round | null>(null);
  const setRound = (next: Round | null) => { roundRef.current = next; setRoundState(next); };
  const detector = useRef(newDetector());
  const turnTracker = useRef(newTurnTracker());
  const lastReading = useRef(now());
  const awaitingNext = useRef(false);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const tiltOn = tilt && !tiltLost;
  const tiltOnRef = useRef(tiltOn);
  tiltOnRef.current = tiltOn;
  const resumingRef = useRef(resuming);
  resumingRef.current = resuming;
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const layer = useRef<HTMLDivElement>(null);
  const play = (kind: Parameters<typeof beep>[0]) => { if (soundRef.current) beep(kind); };

  useLayerFocus(layer);

  const end = useCallback((finished: Round) => {
    setRound(finished);
    if (finished.ended === "stopped") { onEnd(finished); return; }
    setStage("ending");
    if (finished.ended === "time") play("buzzer");
    window.setTimeout(() => onEnd(finished), END_SCREEN_MS);
  }, [onEnd]);

  const nextScene = useCallback(() => {
    const current = roundRef.current;
    if (!current || current.phase !== "playing" || current.current) return;
    awaitingNext.current = false;
    const next = advance(current, now(), storyOf);
    if (next.phase === "over") end(next); else setRound(next);
  }, [storyOf, end]);

  const respond = useCallback((mark: "correct" | "pass", byTilt: boolean) => {
    const current = roundRef.current;
    if (stageRef.current !== "live" || !current || current.phase !== "playing" || !current.current) return;
    const t = now();
    const next = answer(current, mark, t);
    if (next.phase === "over") { end(next); return; }
    if (next === current) return;
    setRound(next);
    if (!byTilt) detector.current = afterAnswer(t);
    setFeedback(mark);
    play(mark);
    buzz();
    window.setTimeout(() => {
      setFeedback(null);
      awaitingNext.current = true;
      if (!tiltOnRef.current) nextScene(); // with tilt, the next scene waits for the phone to be upright again
    }, FEEDBACK_MS);
  }, [end, nextScene]);

  const go = useCallback(() => {
    const started = startRound(order, seconds, now(), storyOf);
    setStage("live");
    if (started.phase === "over") end(started); else setRound(started);
  }, [order, seconds, storyOf, end]);

  const beginCountdown = useCallback(() => { if (stageRef.current === "ready") { setCount(0); setStage("countdown"); } }, []);

  const carryOn = useCallback(() => {
    const current = roundRef.current;
    if (!current || current.phase !== "paused") return;
    setResuming(false);
    setRound(resume(current, now()));
    if (awaitingNext.current || !current.current) nextScene();
  }, [nextScene]);

  const onTilt = useCallback((event: TiltEvent) => {
    if (event === "armed") {
      if (stageRef.current === "ready") beginCountdown();
      else if (resumingRef.current) carryOn();
      else if (awaitingNext.current) nextScene();
    } else respond(event, true);
  }, [beginCountdown, carryOn, nextScene, respond]);

  useOrientation(tilt, (reading: Reading) => {
    if (typeof reading.beta !== "number" || typeof reading.gamma !== "number") return;
    lastReading.current = reading.t;
    if (tiltLost) setTiltLost(false);
    const tracked = trackTurn(turnTracker.current, reading, screenAngle());
    turnTracker.current = tracked;
    if (tracked.turn !== turn) setTurn(tracked.turn);
    const fed = feed(detector.current, reading);
    detector.current = fed.detector;
    if (fed.event) onTilt(fed.event);
  });

  // The countdown: 3, 2, 1, Go! a second apart; the first scene shows at Go!
  useEffect(() => {
    if (stage !== "countdown") return;
    if (COUNTDOWN[count] === 0) { const timer = window.setTimeout(go, 600); return () => window.clearTimeout(timer); }
    const timer = window.setTimeout(() => setCount((n) => n + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [stage, count, go]);

  // The clock: checked five times a second; the last five seconds tick.
  const lastSecond = useRef(-1);
  useEffect(() => {
    if (stage !== "live") return;
    const timer = window.setInterval(() => {
      const t = now();
      setClock(t);
      const current = roundRef.current;
      if (!current || current.phase !== "playing") return;
      const timed = tick(current, t);
      if (timed.phase === "over") { end(timed); return; }
      const secondsLeft = Math.ceil(leftMs(current, t) / 1000);
      if (secondsLeft <= 5 && secondsLeft !== lastSecond.current) play("tick");
      lastSecond.current = secondsLeft;
      if (tilt && !tiltLost && document.visibilityState === "visible" && t - lastReading.current > READINGS_STOPPED_MS) {
        setTiltLost(true);
        if (awaitingNext.current) nextScene();
      }
    }, CLOCK_MS);
    return () => window.clearInterval(timer);
  }, [stage, end, tilt, tiltLost, nextScene]);

  const pauseNow = useCallback(() => {
    const current = roundRef.current;
    if (stageRef.current !== "live" || !current || current.phase !== "playing") return;
    setRound(pause(current, now()));
    leaveFullscreen();
  }, []);

  const askResume = () => {
    if (!tiltOnRef.current) { carryOn(); return; }
    detector.current = newDetector();
    setResuming(true);
  };

  // A call, a notification or another app: the page is hidden, so the round pauses and the scene is covered (§6.1).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseNow();
      else void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pauseNow]);

  useEffect(() => () => { leaveFullscreen(); releaseWakeLock(); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      if (event.key === "Escape") { event.preventDefault(); if (roundRef.current?.phase === "paused") askResume(); else pauseNow(); return; }
      if (roundRef.current?.phase !== "playing") return;
      if (event.key === "ArrowRight" || (event.key === " " && !isControl(event.target))) { event.preventDefault(); respond("correct", false); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); respond("pass", false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bound every render, so it always sees the current round

  const paused = round?.phase === "paused";
  return <div ref={layer} className="ch-layer" role="dialog" aria-modal="true" aria-label="Family charades round" tabIndex={-1} data-mode={mode}>
    {stage === "ready" && <Ready {...props} tilt={tiltOn} onStart={beginCountdown} />}
    {stage === "countdown" && <div className="ch-countdown" aria-live="assertive"><span>{COUNTDOWN[count] || "Go!"}</span></div>}
    {stage === "live" && round && !paused && <Live {...props} round={round} clock={clock} feedback={feedback} hidden={hidden} tiltOn={tiltOn}
      tiltLost={tilt && tiltLost} turn={turn} onAnswer={(mark) => respond(mark, false)} onPause={pauseNow} onHide={() => setHidden((h) => !h)} />}
    {stage === "live" && paused && <PauseSheet sound={sound} resuming={resuming} onResume={askResume}
      onStop={() => { const current = roundRef.current; if (current) end(stopRound(current, now())); }} onSound={props.onSound} />}
    {stage === "ending" && <div className="ch-ending" role="status">
      <strong>{round?.ended === "deck" ? "You got through the whole deck!" : "Time's up!"}</strong>
    </div>}
  </div>;
}

/** The layer takes focus and stops the page behind it scrolling; on close, focus goes back where it was. */
function useLayerFocus(layer: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    layer.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [layer]);
}

function Ready({ mode, tilt, littleOnes, teamName, notice, onStart }: RoundProps & { onStart: () => void }) {
  return <div className="ch-ready">
    {teamName && <p className="ch-team-turn">{`${teamName}'s turn`}</p>}
    {notice && <p className="ch-notice" role="status">{notice}</p>}
    {mode === "guess" && tilt ? <>
      <h2>Hold the phone to your forehead, screen facing out.</h2>
      <p>Tip down when you get it. Tip up to pass.</p>
      <p className="ch-ready-wait">The countdown starts when the phone is upright.</p>
      <button type="button" className="ch-secondary" onClick={onStart}>Start round</button>
    </> : <>
      <h2>{mode === "guess" ? "Hold the phone on your forehead, or give it to a helper who holds it facing the actors. Tap Got it or Pass."
        : "Read your scene, then act it out. No talking! Tap Got it when someone guesses."}</h2>
      {mode === "act" && littleOnes && <p>Can't read it yet? Look at the picture, or ask a grown-up to whisper it.</p>}
      <button type="button" className="ch-primary ch-go" onClick={onStart} autoFocus>Start round</button>
    </>}
  </div>;
}

interface LiveProps extends RoundProps {
  round: Round; clock: number; feedback: "correct" | "pass" | null; hidden: boolean; tiltOn: boolean; tiltLost: boolean; turn: number;
  onAnswer: (mark: "correct" | "pass") => void; onPause: () => void; onHide: () => void;
}

function Live({ scenes, round, clock, feedback, hidden, tiltOn, tiltLost, turn, pictures, mode, onAnswer, onPause, onHide }: LiveProps) {
  const scene = round.current ? scenes.get(round.current) : undefined;
  const secondsLeft = Math.ceil(leftMs(round, clock) / 1000);
  const score = round.rows.filter((r) => r.mark === "correct").length;
  const big = !tiltOn;
  return <div className="ch-live" data-feedback={feedback ?? undefined}>
    <div className="ch-card" data-turn={turn}>
      <div className="ch-card-inner">
        <span className={`ch-timer${secondsLeft <= 10 ? " is-low" : ""}`} aria-label={`${secondsLeft} seconds left`}>{secondsLeft}</span>
        <span className="ch-score" aria-label={`Score ${score}`}>{score}</span>
        {feedback ? <p className="ch-feedback" aria-live="polite">{feedback === "correct" ? "✓ Correct!" : "↷ Pass"}</p>
          : scene && !hidden ? <SceneCard scene={scene} picture={pictures} />
          : hidden ? <p className="ch-hidden-note">Card hidden</p> : null}
      </div>
    </div>
    {tiltLost && <p className="ch-tilt-lost" role="status">Tilt stopped; use the buttons</p>}
    <div className={`ch-answer${big ? " is-big" : ""}`}>
      <button type="button" className="ch-pass" onClick={() => onAnswer("pass")} disabled={!!feedback || !scene}><Redo2 size={20} aria-hidden="true" />Pass</button>
      <button type="button" className="ch-got" onClick={() => onAnswer("correct")} disabled={!!feedback || !scene}><Check size={20} aria-hidden="true" />Got it</button>
    </div>
    <div className="ch-tools">
      {mode === "act" && <button type="button" className="ch-tool" aria-pressed={hidden} onClick={onHide}><EyeOff size={16} aria-hidden="true" />{hidden ? "Show card" : "Hide card"}</button>}
      <button type="button" className="ch-tool" onClick={onPause} aria-label="Pause"><Pause size={16} aria-hidden="true" /></button>
    </div>
  </div>;
}

/** The scene as large as fits in three lines, never below 28 px (§7.3). Not a live region: it is never read aloud by itself. */
function SceneCard({ scene, picture }: { scene: Scene; picture: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useFitText(box, title, scene.id);
  return <div ref={box} className="ch-scene">
    {picture && scene.picture && <span className="ch-picture" aria-hidden="true">{scene.picture}</span>}
    <h2 ref={title} className="ch-title">{scene.title}</h2>
  </div>;
}

const MIN_TEXT_PX = 28;
const MAX_TEXT_PX = 160;

/** Largest font size between 28 px and the cap at which the title fits its box in at most three lines. */
function useFitText(box: RefObject<HTMLElement>, text: RefObject<HTMLElement>, key: string) {
  useLayoutEffect(() => {
    const fit = () => {
      const el = text.current;
      const area = box.current;
      if (!el || !area) return;
      let low = MIN_TEXT_PX;
      let high = MAX_TEXT_PX;
      const fits = (size: number) => {
        el.style.fontSize = `${size}px`;
        const lines = el.scrollHeight / (size * 1.15);
        return lines <= 3.2 && el.scrollWidth <= area.clientWidth + 1 && el.scrollHeight <= area.clientHeight;
      };
      if (!area.clientWidth) { el.style.fontSize = ""; return; } // no layout (tests): the CSS size stands
      while (high - low > 1) { const mid = Math.floor((low + high) / 2); if (fits(mid)) low = mid; else high = mid; }
      el.style.fontSize = `${low}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [box, text, key]);
}

function PauseSheet({ sound, resuming, onResume, onStop, onSound }: { sound: boolean; resuming: boolean; onResume: () => void; onStop: () => void; onSound: (on: boolean) => void }) {
  return <div className="ch-pause">
    <h2>Paused</h2>
    {resuming ? <p role="status">Hold the phone upright to carry on.</p>
      : <button type="button" className="ch-primary" onClick={onResume} autoFocus>Resume</button>}
    <button type="button" className="ch-secondary" onClick={onStop}>End round now</button>
    <button type="button" className="ch-secondary" aria-pressed={sound} onClick={() => onSound(!sound)}>{sound ? "Sound on" : "Sound off"}</button>
  </div>;
}
