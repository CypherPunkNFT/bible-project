// Bible Jeopardy's results (design 6.6, 9.7; the audit's item 5): the winner's name very large in its team colour (or
// the tied teams, with Tie-breaker beside them), the kit's podium rising third, second, first in the teams' colours with
// the scores counting up and one burst of gold for the winner, the other teams in rank order under it, then Play again
// and New game, and a link to the study test page for anyone who wants to keep going alone.
import { Link } from "react-router-dom";
import { formatList, ordinal } from "@/lib/site-format";
import { Confetti, Podium, TEAM_TONES as KIT_TONES, WinnerLine, teamTone } from "../kit";
import type { Team } from "./model";
import { ranking, type Play } from "./rules";
import { Score } from "./Scoreboard";

interface Props {
  play: Play;
  teams: Team[];
  canTieBreak: boolean;
  onTieBreak: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function Results({ play, teams, canTieBreak, onTieBreak, onPlayAgain, onNewGame }: Props) {
  const places = ranking(play);
  const winner = play.tie?.winner ?? null;
  const first = places[0];
  const tied = first && first.teams.length > 1;
  const rows = teams.map((team, index) => ({ id: String(index), name: team.name, score: team.score, tone: teamTone(index, KIT_TONES), edge: index === winner ? 1 : 0 }));
  const rest = places.filter((place) => place.place > 3);
  return <div className={`jp-results${first ? ` jp-tone-${first.teams[0]}` : ""}`}>
    <WinnerLine className="jp-winner" label={tied ? "Tied for first" : "Winner"} name={first ? formatList(first.teams.map((index) => teams[index].name)) : ""}>
      {first && !tied && <Confetti when count={30} reach={160} />}
    </WinnerLine>
    <Podium className="jp-kit-podium" teams={rows} label="Podium" countMs={900} />
    {rest.length > 0 && <ol className="jp-rest" aria-label="Other places">
      {rest.map((place) => <li key={place.place} className="jp-place">
        <span className="jp-place-number">{ordinal(place.place)}</span>
        <span className="jp-place-teams">{formatList(place.teams.map((index) => teams[index].name))}</span>
        <span className="jp-place-score"><Score value={place.score} /></span>
      </li>)}
    </ol>}
    {winner !== null && <p className="jp-hint jp-tie-note">Won the tie-breaker</p>}
    <div className="jp-results-actions">
      {canTieBreak && <button type="button" className="jp-primary" onClick={onTieBreak}>Tie-breaker</button>}
      <button type="button" className={canTieBreak ? "jp-quiet" : "jp-primary"} onClick={onPlayAgain}>Play again</button>
      <button type="button" className="jp-quiet" onClick={onNewGame}>New game</button>
    </div>
    <p className="jp-hint">Want to keep going alone? <Link to="/study/questions/test">Take a test from the question bank</Link>.</p>
  </div>;
}
