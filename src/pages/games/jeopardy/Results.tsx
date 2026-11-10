// Bible Jeopardy's results (design 6.6, 9.7): teams in rank order on a simple podium for the top three, equal scores
// sharing a place, then Tie-breaker (when first place is shared), Play again and New game, and a link to the study
// test page for anyone who wants to keep going alone.
import { Link } from "react-router-dom";
import { formatList, ordinal } from "@/lib/site-format";
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
  return <div className="jp-results">
    <h2>Results</h2>
    <ol className="jp-podium">
      {places.map((place) => <li key={place.place} className={`jp-place jp-place-${Math.min(place.place, 4)}`}>
        <span className="jp-place-number">{ordinal(place.place)}</span>
        <span className="jp-place-teams">{formatList(place.teams.map((index) => teams[index].name))}</span>
        <span className="jp-place-score"><Score value={place.score} /></span>
        {winner !== null && place.teams.includes(winner) && <small>Won the tie-breaker</small>}
      </li>)}
    </ol>
    <div className="jp-results-actions">
      {canTieBreak && <button type="button" className="jp-quiet" onClick={onTieBreak}>Tie-breaker</button>}
      <button type="button" className="jp-primary" onClick={onPlayAgain}>Play again</button>
      <button type="button" className="jp-quiet" onClick={onNewGame}>New game</button>
    </div>
    <p className="jp-hint">Want to keep going alone? <Link to="/study/questions/test">Take a test from the question bank</Link>.</p>
  </div>;
}
