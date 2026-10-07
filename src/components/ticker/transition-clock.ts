/**
 * Debug clock for the Atlas and study page transitions: slows them down, pauses, seeks and steps them in 20 ticks,
 * and holds the last frame so it can be inspected. It drives the browser's own view-transition animations
 * (the ::view-transition-* pseudo-elements), so what you see is the real transition, not a re-enactment.
 * Modelled on Lookingglass's flight ticker.
 */
export const TICKS = 20;
export const SPEEDS = [1, 0.5, 0.25, 0.1, 0.05] as const;

export type TickerState = {
  open: boolean;
  speed: number;
  active: boolean;
  paused: boolean;
  held: boolean;
  progress: number;
  elapsed: number;
  total: number;
  label: string;
  moving: string[];
};

// Plain names for the parts of a transition, matched against each animation's pseudo-element.
const PART_NAMES: [RegExp, string][] = [
  [/^::view-transition-old\(places-page\)$/, "Page you are leaving"],
  [/^::view-transition-new\(places-page\)$/, "Page you are arriving at"],
  [/^::view-transition-group\(places-card-/, "Cards changing size and place"],
  [/^::view-transition-old\(places-card-/, "Cards' old contents fading out"],
  [/^::view-transition-new\(places-card-/, "Cards' new contents fading in"],
  [/^::view-transition-old\(study-panel\)$/, "Section you are leaving"],
  [/^::view-transition-new\(study-panel\)$/, "Section you are arriving at"],
];
const HOLD_MARGIN_MS = 1;
const STORAGE_KEY = "atlas-transition-ticker";

/**
 * The ticker is a tool for tuning the transitions, not for visitors: it shows on the local preview (127.0.0.1 or
 * localhost; the preview is a production build, so a dev-mode check would hide it there too) or with ?ticker in the
 * address of the first page opened. Owner, 2026-10-07: keep it off the live site.
 */
export function tickerAllowed(hostname: string, search: string): boolean {
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
  return local || new URLSearchParams(search).has("ticker");
}

export const TICKER_ENABLED = typeof window !== "undefined" && tickerAllowed(window.location.hostname, window.location.search);

function loadSettings(): Pick<TickerState, "open" | "speed"> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<TickerState>;
    const speed = SPEEDS.includes(saved.speed as (typeof SPEEDS)[number]) ? (saved.speed as number) : 0.1;
    // Where the ticker is hidden, a panel left open on an earlier visit must not slow or hold the transitions.
    return { open: TICKER_ENABLED && saved.open === true, speed };
  } catch {
    return { open: false, speed: 0.1 };
  }
}

function saveSettings({ open, speed }: TickerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, speed }));
  } catch {
    // Storage blocked (private window): the ticker still works for this visit.
  }
}

let state: TickerState = { ...loadSettings(), active: false, paused: false, held: false, progress: 0, elapsed: 0, total: 0, label: "", moving: [] };
let animations: Animation[] = [];
let attachedRun = 0;
let frame = 0;
const listeners = new Set<(s: TickerState) => void>();

function emit(patch: Partial<TickerState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

const endTime = (a: Animation) => Number(a.effect?.getComputedTiming().endTime ?? 0);
const timeOf = (a: Animation) => Number(a.currentTime ?? 0);
const effectiveSpeed = () => (state.open ? state.speed : 1);

function movingParts(time: number) {
  const names = new Set<string>();
  for (const a of animations) {
    const pseudo = (a.effect as KeyframeEffect | null)?.pseudoElement ?? "";
    const timing = a.effect?.getComputedTiming();
    const start = Number(timing?.delay ?? 0), end = start + Number(timing?.activeDuration ?? 0);
    if (time < start || time > end) continue;
    const name = PART_NAMES.find(([pattern]) => pattern.test(pseudo))?.[1];
    if (name) names.add(name);
  }
  return [...names];
}

function seekTime(time: number) {
  const clamped = Math.max(0, Math.min(time, state.total - HOLD_MARGIN_MS));
  animations.forEach((a) => { a.currentTime = clamped; });
  emit({ held: false });
  sample();
}

function sample() {
  const time = animations.length ? Math.max(...animations.map(timeOf)) : 0;
  emit({ elapsed: time, progress: state.total ? Math.min(1, time / state.total) : 0, moving: movingParts(time) });
  return time;
}

function loop() {
  cancelAnimationFrame(frame);
  if (!state.active) return;
  const time = sample();
  // While the ticker is open, stop one millisecond short of the end so the last frame stays on screen.
  if (state.open && !state.paused && time >= state.total - HOLD_MARGIN_MS * 2) {
    animations.forEach((a) => { a.pause(); a.currentTime = state.total - HOLD_MARGIN_MS; });
    emit({ paused: true, held: true });
    sample();
  }
  frame = requestAnimationFrame(loop);
}

export const transitionTicker = {
  get state() { return state; },
  subscribe(listener: (s: TickerState) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  /** Called once the view transition's animations exist. */
  attach(run: number, label: string) {
    animations = document.getAnimations().filter((a) => ((a.effect as KeyframeEffect | null)?.pseudoElement ?? "").startsWith("::view-transition"));
    if (!animations.length) return;
    attachedRun = run;
    animations.forEach((a) => { a.playbackRate = effectiveSpeed(); });
    emit({ active: true, paused: false, held: false, total: Math.max(...animations.map(endTime)), label });
    loop();
  },
  detach(run: number) {
    if (run !== attachedRun) return;
    animations = [];
    cancelAnimationFrame(frame);
    emit({ active: false, paused: false, held: false, progress: 0, elapsed: 0, moving: [] });
  },
  setOpen(open: boolean) {
    if (open && !TICKER_ENABLED) return;
    emit({ open });
    saveSettings(state);
    animations.forEach((a) => { a.playbackRate = effectiveSpeed(); });
  },
  setSpeed(speed: number) {
    emit({ speed });
    saveSettings(state);
    animations.forEach((a) => { a.playbackRate = effectiveSpeed(); });
  },
  play() {
    if (state.held) seekTime(0);
    animations.forEach((a) => a.play());
    emit({ paused: false, held: false });
    loop();
  },
  pause() {
    animations.forEach((a) => a.pause());
    emit({ paused: true });
    sample();
  },
  seekTick(tick: number) {
    this.pause();
    seekTime((Math.max(0, Math.min(TICKS, tick)) / TICKS) * state.total);
  },
  stepTicks(delta: number) {
    this.seekTick(Math.round(state.progress * TICKS) + delta);
  },
  restart() {
    seekTime(0);
    this.play();
  },
  /** Lets the transition end so the page becomes usable again. */
  finish() {
    animations.forEach((a) => a.finish());
  },
};
