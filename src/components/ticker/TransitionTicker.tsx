import { useEffect, useRef, useState } from "react";
import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward, X } from "lucide-react";
import { SPEEDS, TICKER_ENABLED, TICKS, transitionTicker, type TickerState } from "./transition-clock";
import "./transition-ticker.css";

const speedLabel = (speed: number) => (speed === 1 ? "Normal speed" : `${Math.round(1 / speed)}× slower`);

/** The ticker on the local preview (or with ?ticker); nothing on the live site. See tickerAllowed in transition-clock.ts. */
export function TransitionTicker() {
  return TICKER_ENABLED ? <TickerPanel /> : null;
}

/**
 * Debug panel for the Atlas and study page transitions: speed, a 20-tick timeline you can click, pause,
 * one-tick steps, restart and finish, plus which parts are moving at the current tick.
 */
function TickerPanel() {
  const [s, setS] = useState<TickerState>(transitionTicker.state);
  useEffect(() => transitionTicker.subscribe(setS), []);
  const panel = useRef<HTMLElement>(null);

  // While a view transition plays, the browser stops pointer hits reaching page elements, ticker included.
  // So catch the real click on the page and press whichever ticker button sits under the pointer.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const { placesSlide, studySlide } = document.documentElement.dataset;
      if (!event.isTrusted || !(placesSlide || studySlide) || !panel.current) return;
      const hit = [...panel.current.querySelectorAll<HTMLButtonElement>("button")].find((button) => {
        const box = button.getBoundingClientRect();
        return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      });
      if (!hit) return;
      event.preventDefault();
      event.stopPropagation();
      if (!hit.disabled) hit.click();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  if (!s.open) return <button type="button" className="transition-ticker-unfold" onClick={() => transitionTicker.setOpen(true)} title="Open the transition ticker: slow motion and tick-by-tick playback">
    <Gauge size={15} aria-hidden />Ticker
  </button>;

  const tick = s.held ? TICKS : s.progress * TICKS;
  const running = s.active && !s.paused;
  const status = !s.active ? "Waiting · click a card" : s.held ? "Held on the last frame" : s.paused ? "Paused" : "Playing";
  return <section ref={panel} className="transition-ticker" aria-label="Transition ticker">
    <div className="transition-ticker-head">
      <strong>TRANSITION TICKER</strong>
      <span>{s.active ? s.label : ""}</span>
      <button type="button" aria-label="Close the ticker (back to normal speed)" onClick={() => transitionTicker.setOpen(false)}><X size={14} /></button>
    </div>
    <div className="transition-ticker-speed" role="group" aria-label="Speed">
      {SPEEDS.map((speed) => <button type="button" key={speed} aria-pressed={s.speed === speed} onClick={() => transitionTicker.setSpeed(speed)}>{speedLabel(speed)}</button>)}
    </div>
    <div className="transition-ticker-readout">
      <b>Tick {Math.floor(tick)}<small>/{TICKS}</small></b>
      <span>{Math.round(s.elapsed)} ms of {Math.round(s.total)} ms (real time)</span>
      <span className="transition-ticker-status">{status}</span>
    </div>
    <div className="transition-ticker-track">
      <div className="transition-ticker-fill" style={{ width: `${s.progress * 100}%` }} />
      {Array.from({ length: TICKS + 1 }, (_, i) => <button type="button" key={i} disabled={!s.active} className={`transition-ticker-mark ${s.active && i <= tick ? "passed" : ""}`}
        style={{ left: `${(i / TICKS) * 100}%` }} aria-label={`Go to tick ${i}`} onClick={() => transitionTicker.seekTick(i)}><span>{i}</span></button>)}
    </div>
    <p className="transition-ticker-moving">{s.active ? (s.moving.length ? `Moving now: ${s.moving.join(" · ")}` : "Nothing moving at this tick") : " "}</p>
    <div className="transition-ticker-controls">
      <button type="button" disabled={!s.active} onClick={() => transitionTicker.stepTicks(-1)} aria-label="Back one tick"><SkipBack size={14} /></button>
      <button type="button" className="primary" disabled={!s.active} onClick={() => (running ? transitionTicker.pause() : transitionTicker.play())}>
        {running ? <Pause size={15} /> : <Play size={15} />}{running ? "Pause" : s.held ? "Replay" : "Play"}
      </button>
      <button type="button" disabled={!s.active} onClick={() => transitionTicker.stepTicks(1)} aria-label="Forward one tick"><SkipForward size={14} /></button>
      <button type="button" disabled={!s.active} onClick={() => transitionTicker.restart()}><RotateCcw size={14} />Restart</button>
      <button type="button" disabled={!s.active} onClick={() => transitionTicker.finish()}>Finish</button>
    </div>
  </section>;
}
