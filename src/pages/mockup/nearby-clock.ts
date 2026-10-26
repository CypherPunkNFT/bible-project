// MOCK-UP (home_mockup, home_mockup2): the clock of the "Close to home" zoom (NearbyStage.tsx) and the state of its
// ticker (NearbyTicker.tsx). One move (opening a city, or going back to all cities) runs on one clock: an empty
// animation on the stage whose time every other part follows. The parts are real animations started in step with it,
// and the USA map's flight is drawn from its time each frame, so pausing, stepping and seeking act on the whole move at
// once (owner, 2026-10-23: a ticker and a pause button, to screenshot any moment). While the city's files are still on
// their way the move has no end yet: its length grows with the clock until they arrive.
export const TICKS = 20;
export const SLOWER = [1, 5, 10] as const;
/** The simulated slow connection: how long the city's files take to arrive. */
export const SLOW_NET_MS = 4000;

export interface ZoomTicker {
  open: boolean; slow: number; paused: boolean; slowNet: boolean;
  active: boolean; waiting: boolean; time: number; total: number; label: string; moving: string[];
  /** The city whose files are being read before its move starts. */
  loading: string | null;
}

let state: ZoomTicker = { open: true, slow: 1, paused: false, slowNet: false, active: false, waiting: false, time: 0, total: 0, label: "", moving: [], loading: null };
const listeners = new Set<() => void>();
const emit = (patch: Partial<ZoomTicker>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };

let master: Animation | null = null, parts: Animation[] = [], named: { name: string; from: number; to: number }[] = [];
let draw: ((time: number) => void) | null = null, ended: (() => void) | null = null, waits: { at: number; done: () => void }[] = [];
let frame = 0, drawnAt = -1;

const now = () => Number(master?.currentTime ?? 0);
const everything = () => (master ? [master, ...parts] : parts);
const endOf = (a: Animation) => Number(a.effect?.getComputedTiming().endTime ?? 0);

function loop() {
  if (!master) return;
  const t = now(), total = state.waiting ? Math.max(state.total, t) : state.total, shown = Math.min(t, total);
  if (shown !== drawnAt) { drawnAt = shown; draw?.(shown); }
  waits = waits.filter((w) => (t >= w.at ? (w.done(), false) : true));
  emit({ time: shown, total, moving: named.filter((p) => shown >= p.from && shown <= p.to).map((p) => p.name) });
  if (!state.waiting && t >= total && !state.paused) { ended?.(); return; }
  frame = requestAnimationFrame(loop);
}

export const zoomClock = {
  get state() { return state; },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  now,

  /** Starts a move on a clock kept by `host`; `onTime` draws the flight at a time. Resolves once it has played to its end. */
  start(host: Element, label: string, onTime: (time: number) => void) {
    zoomClock.end();
    master = host.animate(null, { duration: 1e9 });
    master.playbackRate = 1 / state.slow;
    if (state.paused) master.pause();
    draw = onTime;
    drawnAt = -1;
    emit({ active: true, waiting: true, time: 0, total: 0, label, moving: [] });
    return new Promise<void>((done) => { ended = done; frame = requestAnimationFrame(loop); });
  },
  /** Runs animations on the move's clock: each one's delay is a time on the clock. */
  add(...list: (Animation | null | undefined)[]) {
    for (const a of list) {
      if (!a) continue;
      a.playbackRate = 1 / state.slow;
      a.currentTime = now();
      if (state.paused || !master || master.playState === "paused") a.pause();
      parts.push(a);
    }
  },
  /** A plain name for what moves between two times, shown on the ticker. */
  name(name: string, from: number, to: number) { named.push({ name, from, to }); },
  /** The move's end is known: it lasts `total` ms of the clock. */
  plan(total: number) { emit({ waiting: false, total }); },
  /** Resolves once the clock has passed `time` (not while it is paused short of it). */
  reach(time: number) { return new Promise<void>((done) => { if (now() >= time) done(); else waits.push({ at: time, done }); }); },
  end() {
    cancelAnimationFrame(frame);
    parts.forEach((a) => a.cancel());
    master?.cancel();
    master = null; parts = []; named = []; draw = null; ended = null; waits = [];
    emit({ active: false, waiting: false, time: 0, total: 0, label: "", moving: [] });
  },

  setOpen(open: boolean) { emit({ open }); },
  setSlow(slow: number) { emit({ slow }); everything().forEach((a) => { a.playbackRate = 1 / slow; }); },
  setSlowNet(slowNet: boolean) { emit({ slowNet }); },
  setLoading(loading: string | null) { emit({ loading }); },
  play() {
    // A part already past its end stays put: play() would rewind it to its start.
    everything().forEach((a) => { if (now() < endOf(a) || a === master) a.play(); });
    emit({ paused: false });
    if (master) { cancelAnimationFrame(frame); frame = requestAnimationFrame(loop); }
  },
  pause() {
    everything().forEach((a) => a.pause());
    emit({ paused: true });
  },
  seek(time: number) {
    zoomClock.pause();
    const t = Math.max(0, Math.min(time, state.waiting ? Math.max(state.total, now()) : state.total));
    everything().forEach((a) => { a.currentTime = t; });
  },
  seekTick(tick: number) { zoomClock.seek((Math.max(0, Math.min(TICKS, tick)) / TICKS) * state.total); },
  stepTicks(delta: number) { zoomClock.seekTick(Math.round((state.total ? state.time / state.total : 0) * TICKS) + delta); },
};
