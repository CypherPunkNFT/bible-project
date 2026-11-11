// The pieces of a short confetti burst (the audits' item 10), worked out from a seed so the same celebration always
// draws the same pieces and a test can check them. Gold and cream only, the site's colours; the CSS does the flying.

export interface ConfettiPiece {
  /** Where the piece lands, in pixels from the burst's centre. */
  dx: number;
  dy: number;
  /** Degrees it turns on the way. */
  turn: number;
  /** Which of the two colours. */
  tone: "gold" | "cream";
  /** Its start delay, 0 to 1 of the burst. */
  delay: number;
}

/** A small deterministic generator (mulberry32), so a burst needs no Math.random. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` pieces flying out from one point, upward and to the sides, falling a little; never more than 60. */
export function confettiPieces(count: number, seed = 1, reach = 120): ConfettiPiece[] {
  const next = seeded(seed);
  return Array.from({ length: Math.max(0, Math.min(60, Math.floor(count))) }, (_, i) => {
    const angle = -Math.PI * (0.15 + 0.7 * next()); // mostly upward, a fan of 126 degrees
    const distance = reach * (0.45 + 0.55 * next());
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance + reach * 0.35),
      turn: Math.round(-540 + 1080 * next()),
      tone: i % 3 === 0 ? "cream" : "gold",
      delay: Math.round(next() * 0.3 * 100) / 100,
    };
  });
}
