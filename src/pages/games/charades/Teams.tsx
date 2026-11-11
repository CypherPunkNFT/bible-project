// Family charades: the team screens (design §6.4, §7.5, redesigned from the visual audit). Between turns the hand-over
// names the team on turn very large in its own colour with every team's score as a chip and a bar; after the last
// turn, a podium rises third, second, first with one gold burst for the winner, and the table underneath keeps every
// team and every tie exactly as before.
import { Play, RotateCcw, Settings2 } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { formatList, plural } from "@/lib/site-format";
import { Confetti, HandOver as HandOverCard, Podium, TeamChips, teamTone, type Team } from "../kit";
import { standings, teamOnTurn, type TeamGame } from "./game";

/** The kit's rows: the team's index is its id (two teams may share a name). */
const chipsOf = (game: TeamGame): Team[] => game.teams.map((name, index) => ({ id: String(index), name, score: game.totals[index], tone: teamTone(index) }));

function Totals({ game }: { game: TeamGame }) {
  return <ol className="ch-standings" aria-label="Standings">
    {standings(game).map((row) => <li key={row.index} style={{ "--ch-team": teamTone(row.index) } as CSSProperties}>
      <span className="ch-place">{row.place}</span><span className="ch-team-name"><i className="ch-team-dot" aria-hidden="true" />{row.name}</span><strong>{row.total}</strong>
    </li>)}
  </ol>;
}

export function HandOver({ game, starting, onReady, onChangeDeck }: { game: TeamGame; starting: boolean; onReady: () => void; onChangeDeck: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [game.turn]);
  const up = teamOnTurn(game);
  const team = game.teams[up];
  const round = Math.floor(game.turn / game.teams.length) + 1;
  return <section className="ch-handover" aria-labelledby="ch-handover-title">
    <p className="ch-team-turn">{`Turn ${round} of ${game.turnsEach}`}</p>
    <HandOverCard className="ch-up" tone={teamTone(up)} name={<span className="ch-handover-team">{team}</span>}>
      <h1 id="ch-handover-title" ref={heading} tabIndex={-1}>Pass the phone to your next guesser</h1>
      <button type="button" className="ch-primary ch-go" onClick={onReady} disabled={starting}><Play size={18} aria-hidden="true" />Ready</button>
    </HandOverCard>
    <TeamChips className="ch-team-chips" teams={chipsOf(game)} upId={String(up)} label="Teams" />
    <div className="ch-recap-actions">
      <button type="button" className="ch-secondary" onClick={onChangeDeck}><Settings2 size={16} aria-hidden="true" />Change deck</button>
    </div>
  </section>;
}

export function FinalStandings({ game, onNewGame, onChangeDeck }: { game: TeamGame; onNewGame: () => void; onChangeDeck: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const rows = standings(game);
  const winners = rows.filter((r) => r.place === 1).map((r) => r.name);
  return <section className="ch-final" aria-labelledby="ch-final-title">
    <h1 id="ch-final-title" ref={heading} tabIndex={-1}>Final standings</h1>
    <p className="ch-lede"><span>{plural(winners.length, "The winner", "A tie at the top")}</span> <strong>{formatList(winners)}</strong></p>
    <Podium className="ch-podium" teams={chipsOf(game)} label="Podium" countMs={700} winnerExtra={<Confetti when count={28} reach={110} />} />
    <div className="ch-recap-actions">
      <button type="button" className="ch-primary" onClick={onNewGame}><RotateCcw size={16} aria-hidden="true" />New game</button>
      <button type="button" className="ch-secondary" onClick={onChangeDeck}><Settings2 size={16} aria-hidden="true" />Change deck</button>
    </div>
    <Totals game={game} />
  </section>;
}
