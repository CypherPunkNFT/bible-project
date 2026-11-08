// Family charades: the team screens (design §6.4, §7.5). Between turns the hand-over names the team on turn and
// shows the totals; after the last turn, the final standings, largest first, with ties shown as ties.
import { Play, RotateCcw, Settings2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatList, plural } from "@/lib/site-format";
import { standings, teamOnTurn, type TeamGame } from "./game";

function Totals({ game }: { game: TeamGame }) {
  return <ol className="ch-standings">
    {standings(game).map((row) => <li key={row.index}>
      <span className="ch-place">{row.place}</span><span className="ch-team-name">{row.name}</span><strong>{row.total}</strong>
    </li>)}
  </ol>;
}

export function HandOver({ game, starting, onReady, onChangeDeck }: { game: TeamGame; starting: boolean; onReady: () => void; onChangeDeck: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [game.turn]);
  const team = game.teams[teamOnTurn(game)];
  const round = Math.floor(game.turn / game.teams.length) + 1;
  return <section className="ch-handover" aria-labelledby="ch-handover-title">
    <p className="ch-team-turn">{`Turn ${round} of ${game.turnsEach}`}</p>
    <p className="ch-handover-team">{team}</p>
    <h1 id="ch-handover-title" ref={heading} tabIndex={-1}>Pass the phone to your next guesser</h1>
    <Totals game={game} />
    <div className="ch-recap-actions">
      <button type="button" className="ch-primary ch-go" onClick={onReady} disabled={starting}><Play size={18} aria-hidden="true" />Ready</button>
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
    <Totals game={game} />
    <div className="ch-recap-actions">
      <button type="button" className="ch-primary" onClick={onNewGame}><RotateCcw size={16} aria-hidden="true" />New game</button>
      <button type="button" className="ch-secondary" onClick={onChangeDeck}><Settings2 size={16} aria-hidden="true" />Change deck</button>
    </div>
  </section>;
}
