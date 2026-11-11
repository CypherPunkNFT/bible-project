// A timer the room can read (the audits' item 8). The game owns its clock; the kit only says what tone the time left
// deserves, so nothing here drifts from the game's own count and nothing waits for an animation.

export type TimerTone = "calm" | "amber" | "red" | "over";

/** calm until twice the warning, amber until the warning, red (and pulsing) for the last `warnAt` seconds, over at 0. */
export function timerTone(secondsLeft: number, warnAt = 5): TimerTone {
  if (secondsLeft <= 0) return "over";
  if (secondsLeft <= warnAt) return "red";
  if (secondsLeft <= warnAt * 2) return "amber";
  return "calm";
}

/** The share of the time still to run, 0 to 1, safe for a total of zero. */
export const timeShare = (secondsLeft: number, total: number): number =>
  total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0;
