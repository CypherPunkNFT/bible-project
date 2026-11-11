// Teams and players side by side (the audits' item 9): places with competition ranking (equal scores share a place and
// the next place is skipped, the rule Hot seat's leaderboard already uses, so two tables never disagree), and the
// colour each team wears, one of the site's seven book colours in turn.

export interface Scored {
  id: string;
  score: number;
}

export type Placed<T extends Scored> = T & { place: number };

/** Each row with its place, most points first; equal scores share a place and keep their given order. */
export function placeTeams<T extends Scored>(rows: readonly T[]): Placed<T>[] {
  const placed = rows.map((row, index) => ({ row: { ...row, place: 1 + rows.filter((other) => other.score > row.score).length }, index }));
  return placed.sort((a, b) => a.row.place - b.row.place || a.index - b.index).map((entry) => entry.row);
}

/** The rows on each of the three podium steps (places 1 to 3); a shared place puts two rows on one step. */
export function podiumSteps<T extends Scored>(rows: readonly T[]): [Placed<T>[], Placed<T>[], Placed<T>[]] {
  const placed = placeTeams(rows);
  return [1, 2, 3].map((place) => placed.filter((row) => row.place === place)) as [Placed<T>[], Placed<T>[], Placed<T>[]];
}

/** The site's seven book colours, as CSS values, worn by teams in turn. */
export const TEAM_TONES: readonly string[] = ["var(--history)", "var(--poetry)", "var(--prophets)", "var(--gospels)", "var(--acts)", "var(--epistles)", "var(--revelation)"];

/** The colour for the team at `index`; a game whose own colour is one of the seven passes a table without it. */
export const teamTone = (index: number, tones: readonly string[] = TEAM_TONES): string => tones[((index % tones.length) + tones.length) % tones.length];

/** Each score as a share of the leading score (0 to 1), for bars that grow; all zero when nobody has scored. */
export function scoreShares(rows: readonly Scored[]): number[] {
  const top = Math.max(0, ...rows.map((row) => row.score));
  return rows.map((row) => (top > 0 ? Math.max(0, row.score) / top : 0));
}
