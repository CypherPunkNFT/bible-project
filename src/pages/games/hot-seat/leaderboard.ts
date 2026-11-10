// Hot seat: the session leaderboard worked out from the saved turns (design §5.1, §5.3). Equal totals share a place;
// there is no tie-break. Points come only from game.ts's saved turns.
import type { Group } from "./pool";
import { scoreOf, type Player, type SavedTurn, type Session, type Style } from "./game";

export interface Standing {
  player: Player;
  total: number;
  /** Turns actually played (skipped turns do not count). */
  played: number;
  /** Points per turn, null before a first turn: shown, never used to rank (§5.3). */
  average: number | null;
  place: number;
  /** Places gained (positive) or lost (negative) on the last saved turn. */
  moved: number;
  /** Points per round, null where the player had no turn or skipped it. */
  byRound: (number | null)[];
}

const played = (turns: readonly SavedTurn[]) => turns.filter((t) => !t.skipped);

function table(s: Session, turns: readonly SavedTurn[]): Omit<Standing, "moved">[] {
  const rows = s.players
    .filter((p) => p.joinedRound <= s.rounds || turns.some((t) => t.playerId === p.id))
    .map((player) => {
      const mine = turns.filter((t) => t.playerId === player.id);
      const counted = played(mine);
      const total = counted.reduce((sum, t) => sum + scoreOf(t.questions), 0);
      const byRound = Array.from({ length: s.rounds }, (_, i) => {
        const turn = counted.find((t) => t.round === i + 1);
        return turn ? scoreOf(turn.questions) : null;
      });
      return { player, total, played: counted.length, average: counted.length ? total / counted.length : null, place: 0, byRound };
    });
  for (const row of rows) row.place = 1 + rows.filter((other) => other.total > row.total).length;
  // Most points first; equal totals keep the setup order.
  return rows.map((row, i) => ({ row, i })).sort((a, b) => b.row.total - a.row.total || a.i - b.i).map((x) => x.row);
}

/** The standings now, with each player's movement since the turn before the last saved one. */
export function standings(s: Session): Standing[] {
  const now = table(s, s.turns);
  const lastPlayed = s.turns.length ? s.turns.length - 1 : -1;
  const before = lastPlayed >= 0 && !s.turns[lastPlayed].skipped ? table(s, s.turns.slice(0, lastPlayed)) : null;
  return now.map((row) => {
    const earlier = before?.find((b) => b.player.id === row.player.id);
    return { ...row, moved: earlier ? earlier.place - row.place : 0 };
  });
}

/** Players have played different numbers of turns: the table adds turns played and the average (§5.3). */
export const unevenTurns = (rows: readonly Standing[]) => new Set(rows.map((r) => r.played)).size > 1;

/** Turns of different lengths were played: the standings say so (§4.3). */
export const mixedLengths = (s: Session) => new Set(played(s.turns).map((t) => t.seconds)).size > 1;

/** The longest run of right answers in a row within one turn. */
export function longestRun(turn: Pick<SavedTurn, "questions">): number {
  let best = 0;
  let run = 0;
  for (const asked of turn.questions) {
    run = asked.mark === "right" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export interface ShoutOut { value: number; who: { player: Player; group: Group }[] }

function bestBy(s: Session, measure: (turn: SavedTurn) => number): ShoutOut | null {
  const turns = played(s.turns);
  const value = Math.max(0, ...turns.map(measure));
  if (value === 0) return null;
  const who: ShoutOut["who"] = [];
  for (const turn of turns) {
    const player = s.players.find((p) => p.id === turn.playerId);
    if (player && measure(turn) === value && !who.some((w) => w.player.id === player.id && w.group === turn.group)) who.push({ player, group: turn.group });
  }
  return { value, who };
}

/** The final screen's two shout-outs: best single turn and longest run of right answers (§5.3). */
export const shoutOuts = (s: Session) => ({ bestTurn: bestBy(s, (t) => scoreOf(t.questions)), longestRun: bestBy(s, longestRun) });

/** The phone's record key: group, turn length and answer style, so an easier two-choice turn never sets the open record. */
export const recordKey = (group: Group, seconds: number, style: Style) => `${group}|${seconds}|${style}`;
