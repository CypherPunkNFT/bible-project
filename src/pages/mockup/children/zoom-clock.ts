// MOCK-UP: the clock of the children's page zoom (LessonStage.tsx) and the state of its ticker (ZoomTicker.tsx; owner,
// 2026-10-24: "bring the ticker and the animation thing back"). One move (zooming into a lesson, or back out) runs on
// one clock: an empty animation whose time every part follows. Each part is a real animation started on it, so
// pausing, slowing, stepping and seeking act on the whole move at once, as on the home page map's ticker.
export const TICKS = 20;
export const SLOWER = [1, 5, 10] as const;
/** How long a lesson's circle takes to be pressed, before the zoom (LessonStage.tsx); the road's wave comes to it meanwhile. */
export const CLICK_MS = 250;

/** How long a part takes: nothing when the visitor asks for less motion. */
export const ms = (time: number) => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : time);

export interface ClockState {
  open: boolean; slow: number; paused: boolean;
  active: boolean; time: number; total: number; label: string; moving: string[];
}

let state: ClockState = { open: true, slow: 1, paused: false, active: false, time: 0, total: 0, label: "", moving: [] };
const listeners = new Set<() => void>();
const emit = (patch: Partial<ClockState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };

let master: Animation | null = null, parts: Animation[] = [], named: { name: string; from: number; to: number }[] = [];
let frame = 0;

const now = () => Number(master?.currentTime ?? 0);
const everything = () => (master ? [master, ...parts] : parts);

function loop() {
  if (!master) return;
  const t = Math.min(now(), state.total);
  emit({ time: t, moving: named.filter((p) => t >= p.from && t <= p.to).map((p) => p.name) });
  if (t < state.total || state.paused) frame = requestAnimationFrame(loop);
}

export const zoomClock = {
  get state() { return state; },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },

  /** Starts a move `total` ms long; resolves once it has played to its end. */
  start(label: string, total: number) {
    zoomClock.end();
    master = document.documentElement.animate(null, { duration: total, fill: "forwards" });
    master.playbackRate = 1 / state.slow;
    if (state.paused) master.pause();
    emit({ active: true, time: 0, total, label, moving: [] });
    frame = requestAnimationFrame(loop);
    return master.finished.then(() => undefined, () => undefined);
  },
  /** Puts an animation on the move's clock, under a plain name shown on the ticker while it moves. */
  add(animation: Animation, name: string) {
    const timing = animation.effect?.getComputedTiming();
    const from = Number(timing?.delay ?? 0);
    named.push({ name, from, to: from + Number(timing?.activeDuration ?? 0) });
    animation.playbackRate = 1 / state.slow;
    animation.currentTime = now();
    if (state.paused) animation.pause();
    parts.push(animation);
    return animation;
  },
  /** Lets the move's animations go without undoing them (they hold their last frame). */
  end() {
    cancelAnimationFrame(frame);
    master?.cancel();
    master = null; parts = []; named = [];
    emit({ active: false, time: 0, total: 0, label: "", moving: [] });
  },

  setOpen(open: boolean) { emit({ open }); },
  setSlow(slow: number) { emit({ slow }); everything().forEach((a) => { a.playbackRate = 1 / slow; }); },
  play() {
    everything().forEach((a) => a.play());
    emit({ paused: false });
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  },
  pause() {
    everything().forEach((a) => a.pause());
    emit({ paused: true });
  },
  seekTick(tick: number) {
    zoomClock.pause();
    const t = (Math.max(0, Math.min(TICKS, tick)) / TICKS) * state.total;
    everything().forEach((a) => { a.currentTime = t; });
    emit({ time: t, moving: named.filter((p) => t >= p.from && t <= p.to).map((p) => p.name) });
  },
  stepTicks(delta: number) { zoomClock.seekTick(Math.round((state.total ? state.time / state.total : 0) * TICKS) + delta); },
};
