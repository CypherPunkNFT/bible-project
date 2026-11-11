// A rank line for the result panel (the audits' item 6): "Well read", "Scribe". The titles are the game's own words,
// passed in as a table, so each game keeps its voice and the translation collector reads them in the game's file.

/** A rank: the title shown once the score reaches `from` as a share of the best possible (0 to 1). */
export interface Rank {
  from: number;
  title: string;
}

/** The highest rank whose `from` the score reaches; the lowest rank when none does; null for an empty table or a best
 * of zero. Ranks may be given in any order. */
export function rankFor(score: number, best: number, ranks: readonly Rank[]): Rank | null {
  if (!ranks.length || best <= 0 || !Number.isFinite(score)) return null;
  const share = Math.max(0, Math.min(1, score / best));
  const ordered = [...ranks].sort((a, b) => a.from - b.from);
  let found = ordered[0];
  for (const rank of ordered) if (share >= rank.from) found = rank;
  return found;
}
