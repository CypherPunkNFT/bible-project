// Memory card match: the track above the grid (the audit's item 4). One pip per pair, filling in each pair's colour
// as it is found; in solo play the move count that pops when it grows, the three stars still in hand (they dim one by
// one as the move thresholds pass, design 9), the streak of pairs in a row and the timer; in pass and play each
// player's chip with its bar, the one whose turn it is lifted (the kit's TeamChips).
import { Star } from "lucide-react";
import { formatNumber, plural } from "@/lib/site-format";
import { ProgressTrail, StreakFlame, TeamChips, useGrew, type TrailMark } from "../kit";
import { toneColor } from "./tones";
import { foundCount, formatTime, isSolo, pairCount, scores, starThresholds, stars, type GameState } from "./game";
import type { Settings } from "./storage";

interface TrackProps {
  game: GameState;
  toneOf: ReadonlyMap<string, number>;
  settings: Settings;
  elapsedMs: number;
  /** Pairs found in a row without a miss (solo). */
  streak: number;
  onSettings: (settings: Settings) => void;
}

export function Track({ game, toneOf, settings, elapsedMs, streak, onSettings }: TrackProps) {
  const total = pairCount(game);
  const found = foundCount(game);
  const marks: TrailMark[] = Array.from({ length: total }, (_, n) => (n < found ? "right" : "empty"));
  const tones = game.found.map((id) => toneColor(toneOf.get(id) ?? 0));
  const held = stars(game.moves, total);
  const { three, two } = starThresholds(total);
  const movesPulse = useGrew(game.moves);
  const solo = isSolo(game);
  const totals = scores(game);
  return <div className="mm-track">
    <ProgressTrail className="mm-pips" marks={marks} tones={tones} shape="dots" size=".7rem"
      label={`${formatNumber(found)} of ${formatNumber(total)} pairs found`} />
    {solo ? <>
      <span className="mm-moves" key={movesPulse}>{plural(game.moves, "{n} move", "{n} moves")}</span>
      <span className="mm-held" role="img" aria-label={plural(held, "{n} star still in hand", "{n} stars still in hand")}
        title={`Three stars up to ${formatNumber(three)} moves, two up to ${formatNumber(two)}`}>
        {[1, 2, 3].map((n) => <Star key={n} size={15} className={n <= held ? "is-on" : undefined} aria-hidden="true" />)}
      </span>
      {streak >= 2 && <StreakFlame className="mm-streak" count={streak} label={plural(streak, "{n} pair in a row", "{n} pairs in a row")} />}
      <span className="mm-clock">
        {settings.timerHidden ? null : <span className="mm-timer" aria-label={`Time ${formatTime(elapsedMs)}`}>{formatTime(elapsedMs)}</span>}
        <button type="button" className="mm-link" onClick={() => onSettings({ ...settings, timerHidden: !settings.timerHidden })}>
          {settings.timerHidden ? "Show timer" : "Hide timer"}
        </button>
      </span>
    </> : <TeamChips className="mm-chips" label="Pairs per player" upId={String(game.turn)}
      teams={game.players.map((name, n) => ({ id: String(n), name, score: totals[n] }))} />}
  </div>;
}
