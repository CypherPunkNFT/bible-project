// Family charades: reading the tilt (design §5.2, §5.3). Pure: fed one orientation reading at a time with its time
// stamp, so recorded-style sequences can be tested without a phone. The thresholds are named so they can be tuned
// after trying a real phone.

/** Within about 20° of the screen facing the room. */
export const UPRIGHT = 0.35;
/** About 37° past upright: a tip, not a nod. */
export const TIPPED = 0.6;
export const ARM_MS = 300;
export const TIP_MS = 120;
export const FEEDBACK_MS = 700;
export const TURN_HOLD_MS = 400;

export interface Reading { beta: number | null; gamma: number | null; t: number }

const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** +1 face up on a table, −1 face down, about 0 facing the room: the same whichever way round the phone is held. */
export const screenFacing = (beta: number, gamma: number) => Math.cos(rad(beta)) * Math.cos(rad(gamma));

const usable = (r: Reading): r is Reading & { beta: number; gamma: number } =>
  typeof r.beta === "number" && typeof r.gamma === "number" && Number.isFinite(r.beta) && Number.isFinite(r.gamma);

export type DetectorPhase = "waiting" | "armed" | "answered";
export type TiltEvent = "armed" | "correct" | "pass";

export interface Detector {
  phase: DetectorPhase;
  /** What the readings are holding towards, and since when. */
  holding: "upright" | "down" | "up" | null;
  since: number;
  /** When the last answer was given (phase "answered"). */
  answeredAt: number;
}

export const newDetector = (): Detector => ({ phase: "waiting", holding: null, since: 0, answeredAt: 0 });

/** After an answer from a button or key: the tilt must come back upright before it can answer again. */
export const afterAnswer = (t: number): Detector => ({ phase: "answered", holding: null, since: t, answeredAt: t });

/** One reading in; the detector after it, and what happened (if anything). Readings with null angles are ignored. */
export function feed(detector: Detector, reading: Reading): { detector: Detector; event?: TiltEvent } {
  if (!usable(reading)) return { detector };
  const { t } = reading;
  let d = detector;
  if (d.phase === "answered" && t - d.answeredAt >= FEEDBACK_MS) d = { ...d, phase: "waiting", holding: null };
  if (d.phase === "answered") return { detector: d };
  const v = screenFacing(reading.beta, reading.gamma);
  const holding = d.phase === "waiting" ? (Math.abs(v) < UPRIGHT ? "upright" : null)
    : v < -TIPPED ? "down" : v > TIPPED ? "up" : null;
  if (holding !== d.holding) return { detector: { ...d, holding, since: t } };
  if (holding === null) return { detector: d };
  if (holding === "upright" && t - d.since >= ARM_MS) return { detector: { ...d, phase: "armed", holding: null, since: t }, event: "armed" };
  if (holding !== "upright" && t - d.since >= TIP_MS) {
    return { detector: { phase: "answered", holding: null, since: t, answeredAt: t }, event: holding === "down" ? "correct" : "pass" };
  }
  return { detector: d };
}

/**
 * The quarter turn (0, 90, 180 or 270, clockwise) that keeps the card's text upright to the room, given the angle the
 * browser has already turned the page. "Up" across the screen is (−cos β · sin γ, sin β) in the phone's own frame.
 */
export function uprightTurn(beta: number, gamma: number, screenAngle: number): number {
  const x = -Math.cos(rad(beta)) * Math.sin(rad(gamma));
  const y = Math.sin(rad(beta));
  const up = (Math.atan2(x, y) * 180) / Math.PI;
  const turn = Math.round((up - screenAngle) / 90) * 90;
  return ((turn % 360) + 360) % 360;
}

export interface TurnTracker { turn: number; candidate: number; since: number }

export const newTurnTracker = (): TurnTracker => ({ turn: 0, candidate: 0, since: 0 });

/** Changes the card's turn only while the phone is near upright and the new turn has held for TURN_HOLD_MS. */
export function trackTurn(tracker: TurnTracker, reading: Reading, screenAngle: number): TurnTracker {
  if (!usable(reading) || Math.abs(screenFacing(reading.beta, reading.gamma)) >= UPRIGHT) return { ...tracker, candidate: tracker.turn, since: reading.t };
  const next = uprightTurn(reading.beta, reading.gamma, screenAngle);
  if (next === tracker.turn) return { ...tracker, candidate: next, since: reading.t };
  if (next !== tracker.candidate) return { ...tracker, candidate: next, since: reading.t };
  return reading.t - tracker.since >= TURN_HOLD_MS ? { turn: next, candidate: next, since: reading.t } : tracker;
}
