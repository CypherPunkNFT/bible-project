// Bible Jeopardy's answer screen (design 5.3, 9.5): the answer in large type, the question above it, the verse from
// the BSB, who scored, the team buttons for teams not yet marked while no team is right (so a host who did not know
// the answer can show it first and then mark), and Back to board.
import { formatNumber } from "@/lib/site-format";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import { Choices, TeamMarks } from "./ClueScreen";
import type { Team } from "./model";
import type { Mark } from "./rules";
import { Verse } from "./Verse";

interface Props {
  category: string;
  q: QuizQuestion;
  choices: boolean;
  teams: Team[];
  marks: Mark[];
  /** What the right team scored: the tile's value or the bet; null for a tie-breaker, which scores nothing. */
  stake: number | null;
  order: number[];
  first?: number | null;
  canMark: (team: number) => boolean;
  onMark: (team: number, right: boolean) => void;
  onBack: () => void;
  backLabel?: string;
}

export function AnswerScreen({ category, q, choices, teams, marks, stake, order, first = null, canMark, onMark, onBack, backLabel = "Back to board" }: Props) {
  const right = marks.indexOf("right");
  const open = right < 0 && order.some(canMark);
  const nobody = right < 0 && !open && marks.includes("wrong") ? "Nobody got it right" : "No points yet";
  return <div className="jp-answer">
    <p className="jp-clue-head"><span>{category}</span></p>
    <p className="jp-answer-question">{q.text}</p>
    <h2 className="jp-answer-text">{q.options[q.correct]}</h2>
    {choices && <Choices q={q} reveal />}
    <Verse q={q} />
    <p className={`jp-scored${right < 0 ? "" : " is-scored"}`} role="status">{right < 0 ? nobody : stake === null ? `${teams[right].name} wins the tie-breaker` : `${teams[right].name} +${formatNumber(stake)}`}</p>
    <div className="jp-clue-foot">
      {open && <TeamMarks teams={teams} marks={marks} order={order} first={first} canMark={canMark} onMark={onMark} />}
      <button type="button" className="jp-primary" onClick={onBack}>{backLabel}</button>
    </div>
  </div>;
}
