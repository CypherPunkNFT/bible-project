// Bible twenty questions: play every person through the real engine (design §5.5) and check that the tags can
// tell people apart. Shared by scripts/twenty-questions/check.ts (the review sheet) and data.test.ts (npm test).
// Relative imports only, so Node can load it with --experimental-strip-types.
import { prepare, simulate, type Engine, type TqData } from "./engine.ts";

/** Design §5.5's targets: share of people found within 20 turns, guesses included. */
export const TARGETS = { truthfulTier1: 0.99, truthfulPool: 0.97, dontKnowTier1: 0.95, oneSlipTier1: 0.85 } as const;

export interface PersonResult { id: string; label: string; tier: number; truthful: number | null; dontKnow: number | null; oneSlip: number | null }
export interface SimulationReport {
  people: PersonResult[];
  rates: { truthfulTier1: number; truthfulPool: number; dontKnowTier1: number; oneSlipTier1: number };
  averageTurns: number;
}

const share = (rows: PersonResult[], key: "truthful" | "dontKnow" | "oneSlip") =>
  rows.length ? rows.filter((r) => r[key] !== null).length / rows.length : 1;

/** Seeds are fixed per person so the report is the same on every run. */
export function playEveryone(data: TqData, engine: Engine = prepare(data)): SimulationReport {
  const people = data.people.map((person, p): PersonResult => {
    const seed = 1000 + p;
    return {
      id: person.id, label: person.label, tier: person.t,
      truthful: simulate(engine, p, seed),
      dontKnow: person.t === 1 ? simulate(engine, p, seed, { dontKnowDetail: true }) : null,
      oneSlip: person.t === 1 ? simulate(engine, p, seed, { wrongAt: p % 10 }) : null,
    };
  });
  const tier1 = people.filter((r) => r.tier === 1);
  const found = people.filter((r) => r.truthful !== null);
  return {
    people,
    rates: { truthfulTier1: share(tier1, "truthful"), truthfulPool: share(people, "truthful"),
      dontKnowTier1: share(tier1, "dontKnow"), oneSlipTier1: share(tier1, "oneSlip") },
    averageTurns: found.reduce((sum, r) => sum + (r.truthful ?? 0), 0) / Math.max(1, found.length),
  };
}

/** Pairs a tag never separates (design §5.5 checks 4 and 5): a tag separates only a real yes against a real no. */
export function separations(engine: Engine, a: number, b: number): number {
  const tags = engine.data.tags.length;
  let count = 0;
  for (let t = 0; t < tags; t++) {
    const x = engine.guess[a * tags + t], y = engine.guess[b * tags + t];
    if (x !== 2 && y !== 2 && x !== y) count++;
  }
  return count;
}
