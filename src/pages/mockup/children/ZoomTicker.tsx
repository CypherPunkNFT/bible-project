// MOCK-UP: the ticker of the children's page zoom, for checking it (owner, 2026-10-24), as on the home page map: speed,
// a 20-tick track to click, pause and one-tick steps, and what is moving at this moment. Pausing before choosing a
// lesson starts the zoom paused on tick 0. Styled with the site's transition ticker (transition-ticker.css).
import { Gauge, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { SLOWER, TICKS, zoomClock } from "./zoom-clock";
import "@/components/ticker/transition-ticker.css";

export function ZoomTicker() {
  const s = useSyncExternalStore(zoomClock.subscribe, () => zoomClock.state);
  if (!s.open) return <button type="button" className="transition-ticker-unfold ck-ticker" onClick={() => zoomClock.setOpen(true)}><Gauge size={15} aria-hidden />Zoom ticker</button>;

  const progress = s.total ? Math.min(1, s.time / s.total) : 0, tick = progress * TICKS;
  const status = !s.active ? (s.paused ? "Paused · choose a lesson to start on tick 0" : "Waiting · choose a lesson") : s.paused ? "Paused" : "Playing";
  return <section className="transition-ticker ck-ticker" aria-label="Zoom ticker">
    <div className="transition-ticker-head">
      <strong>ZOOM TICKER</strong>
      <span>{s.label}</span>
      <button type="button" aria-label="Fold the ticker away" onClick={() => zoomClock.setOpen(false)}><X size={14} /></button>
    </div>
    <div className="transition-ticker-speed" role="group" aria-label="Speed">
      {SLOWER.map((n) => <button type="button" key={n} aria-pressed={s.slow === n} onClick={() => zoomClock.setSlow(n)}>{n === 1 ? "Normal speed" : `${n}× slower`}</button>)}
    </div>
    <div className="transition-ticker-readout">
      <b>Tick {Math.floor(tick)}<small>/{TICKS}</small></b>
      <span>{Math.round(s.time)} ms of {Math.round(s.total)} ms (real time)</span>
      <span className="transition-ticker-status">{status}</span>
    </div>
    <div className="transition-ticker-track">
      <div className="transition-ticker-fill" style={{ width: `${progress * 100}%` }} />
      {Array.from({ length: TICKS + 1 }, (_, i) => <button type="button" key={i} disabled={!s.active} className={`transition-ticker-mark ${s.active && i <= tick ? "passed" : ""}`}
        style={{ left: `${(i / TICKS) * 100}%` }} aria-label={`Go to tick ${i}`} onClick={() => zoomClock.seekTick(i)}><span>{i}</span></button>)}
    </div>
    <p className="transition-ticker-moving">{s.active ? (s.moving.length ? `Moving now: ${s.moving.join(" · ")}` : "Nothing moving at this tick") : " "}</p>
    <div className="transition-ticker-controls">
      <button type="button" disabled={!s.active} onClick={() => zoomClock.stepTicks(-1)} aria-label="Back one tick"><SkipBack size={14} /></button>
      <button type="button" className="primary" onClick={() => (s.paused ? zoomClock.play() : zoomClock.pause())}>
        {s.paused ? <Play size={15} /> : <Pause size={15} />}{s.paused ? "Play" : "Pause"}
      </button>
      <button type="button" disabled={!s.active} onClick={() => zoomClock.stepTicks(1)} aria-label="Forward one tick"><SkipForward size={14} /></button>
    </div>
  </section>;
}
