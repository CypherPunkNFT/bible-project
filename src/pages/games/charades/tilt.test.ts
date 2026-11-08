// Family charades: the tilt maths and the detector on recorded-style sequences (design §5.2, §5.3, §11).
import { ARM_MS, FEEDBACK_MS, afterAnswer, feed, newDetector, newTurnTracker, screenFacing, trackTurn, uprightTurn, type Detector, type Reading, type TiltEvent } from "./tilt";

/** Feeds readings every 20 ms (a 50 Hz sensor) from `start`; returns the events and the detector after them. */
function run(angles: [number | null, number | null][], start = 0, detector: Detector = newDetector()) {
  const events: TiltEvent[] = [];
  let d = detector;
  angles.forEach(([beta, gamma], i) => {
    const out = feed(d, { beta, gamma, t: start + i * 20 } as Reading);
    d = out.detector;
    if (out.event) events.push(out.event);
  });
  return { events, detector: d, end: start + angles.length * 20 };
}

const hold = (beta: number, gamma: number, ms: number): [number, number][] => Array.from({ length: Math.ceil(ms / 20) }, () => [beta, gamma]);
/** A phone sideways on a forehead (landscape: gamma ±90 is facing the room); beta tips it. */
const forehead = (ms: number) => hold(0, 90, ms);
/** Tipping the screen towards the floor or the ceiling, from sideways on a forehead, by `degrees`. */
const tippedDown = (degrees: number, ms: number) => hold(0, 90 + degrees, ms);
const tippedUp = (degrees: number, ms: number) => hold(0, 90 - degrees, ms);

describe("screenFacing", () => {
  it("is +1 face up, −1 face down and about 0 facing the room, whichever way round", () => {
    expect(screenFacing(0, 0)).toBeCloseTo(1);
    expect(screenFacing(180, 0)).toBeCloseTo(-1);
    expect(screenFacing(90, 0)).toBeCloseTo(0); // upright portrait
    expect(screenFacing(0, 90)).toBeCloseTo(0); // landscape one way
    expect(screenFacing(0, -90)).toBeCloseTo(0); // and the other
    expect(screenFacing(-90, 0)).toBeCloseTo(0); // portrait upside down
  });
});

describe("the detector", () => {
  it("arms only after the phone is held upright for 300 ms", () => {
    expect(run(forehead(ARM_MS - 40)).events).toEqual([]);
    expect(run(forehead(ARM_MS + 40)).events).toEqual(["armed"]);
  });

  it("never answers on a steady forehead with ±15° jitter", () => {
    const jitter: [number, number][] = Array.from({ length: 400 }, (_, i) => [Math.sin(i) * 15, 90 + Math.cos(i * 1.7) * 15]);
    expect(run([...forehead(400), ...jitter]).events).toEqual(["armed"]);
  });

  it("gives one Correct for a tip down past 40°, one Pass for a tip up, and one answer however long it is held", () => {
    expect(run([...forehead(400), ...tippedDown(45, 1000)]).events).toEqual(["armed", "correct"]);
    expect(run([...forehead(400), ...tippedUp(45, 1000)]).events).toEqual(["armed", "pass"]);
  });

  it("needs the tip held for 120 ms: a quick flick does not count", () => {
    expect(run([...forehead(400), ...tippedDown(60, 60), ...forehead(200)]).events).toEqual(["armed"]);
  });

  it("does not count a slow lean back that stays inside the band", () => {
    const lean: [number, number][] = Array.from({ length: 50 }, (_, i) => [0, 90 - (i / 50) * 30]); // to 30° past upright
    expect(run([...forehead(400), ...lean, ...forehead(300)]).events).toEqual(["armed"]);
  });

  it("gives nothing for a phone put down flat before arming", () => {
    expect(run([...hold(0, 0, 2000)]).events).toEqual([]);
    expect(run([...hold(10, 5, 2000)]).events).toEqual([]);
  });

  it("ignores readings with null angles", () => {
    const nulls: [null, null][] = Array.from({ length: 30 }, () => [null, null]);
    expect(run([...nulls, ...forehead(400)]).events).toEqual(["armed"]);
    expect(run([...forehead(400), ...nulls, ...tippedDown(45, 200)]).events).toEqual(["armed", "correct"]);
  });

  it("after an answer, waits 700 ms and for upright again before the next one", () => {
    const first = run([...forehead(400), ...tippedDown(45, 200)]);
    expect(first.detector.phase).toBe("answered");
    // Still tipped after the feedback: no second answer until it has been upright again.
    const still = run(tippedDown(45, FEEDBACK_MS + 600), first.end, first.detector);
    expect(still.events).toEqual([]);
    const again = run([...forehead(400), ...tippedUp(45, 200)], still.end, still.detector);
    expect(again.events).toEqual(["armed", "pass"]);
  });

  it("after a button answer, a tilt cannot answer the same scene", () => {
    const armed = run(forehead(400));
    const d = afterAnswer(armed.end);
    expect(run(tippedDown(45, 500), armed.end, d).events).toEqual([]);
  });
});

describe("keeping the card upright", () => {
  it("gives 0, 90, 180 and 270 for the four ways of holding the phone with the page unturned", () => {
    expect(uprightTurn(90, 0, 0)).toBe(0); // upright portrait
    expect(uprightTurn(0, -90, 0)).toBe(90); // right edge up
    expect(uprightTurn(-90, 0, 0)).toBe(180); // upside down
    expect(uprightTurn(0, 90, 0)).toBe(270); // left edge up
  });

  it("subtracts the turn the browser has already made", () => {
    expect(uprightTurn(0, -90, 90)).toBe(0);
    expect(uprightTurn(0, 90, 270)).toBe(0);
  });

  it("changes only after the new turn has held 400 ms near upright, and never during a tilt", () => {
    let tracker = newTurnTracker();
    const feedAt = (beta: number, gamma: number, t: number) => { tracker = trackTurn(tracker, { beta, gamma, t }, 0); };
    for (let t = 0; t <= 300; t += 20) feedAt(0, -90, t);
    expect(tracker.turn).toBe(0);
    for (let t = 320; t <= 500; t += 20) feedAt(0, -90, t);
    expect(tracker.turn).toBe(90);
    for (let t = 520; t <= 2000; t += 20) feedAt(-50, 0, t); // tipped well past upright: no change
    expect(tracker.turn).toBe(90);
  });
});
