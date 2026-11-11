// Hot seat: the recap after a turn (design §5.2, §6.5). The turn as a strip of tiles that fill in green, red and amber
// as the screen opens, the score counting up with a ribbon for a new best, then every question asked with its answer
// and reference and a mark that can be changed with a tap (its tile changes with it). The points are kept only when
// the reader taps Save turn, which sits in a band pinned to the bottom of a phone screen.
import { Save } from "lucide-react";
import { useEffect, useRef } from "react";
import { plural } from "@/lib/site-format";
import { FeedbackBand, NewBestRibbon, ProgressTrail, ScoreCountUp } from "../kit";
import { MARK_SIGNS, tilesOf } from "./display";
import { scoreOf, type Asked, type Mark, type Turn } from "./game";
import { groupInfo } from "./pool";
import { Reference } from "./Reference";

export function MarkBadge({ mark }: { mark: Mark | null }) {
  return mark ? <><span aria-hidden="true">{MARK_SIGNS[mark].sign}</span><span className="hs-mark-word">{MARK_SIGNS[mark].word}</span></>
    : <span className="hs-mark-word">Not answered</span>;
}

export function AskedRow({ asked }: { asked: Asked }) {
  return <div className="hs-asked">
    <p className="hs-asked-q">{asked.q.text}{asked.q.earlier && <span className="hs-earlier">Asked earlier</span>}</p>
    <p className="hs-asked-a"><strong>{asked.q.answer}</strong>{asked.q.full && <span className="hs-full">{asked.q.full}</span>} <Reference q={asked.q} /></p>
  </div>;
}

interface Props {
  turn: Turn;
  playerName: string;
  /** The phone's best for this group, turn length and style before this turn. */
  recordBefore: number;
  onFix: (index: number) => void;
  onSave: () => void;
}

export function Recap({ turn, playerName, recordBefore, onFix, onSave }: Props) {
  const heading = useRef<HTMLParagraphElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const score = scoreOf(turn.questions);
  const newBest = score > 0 && score > recordBefore;
  const answered = turn.questions.filter((a) => a.mark !== null).length;
  return <section className="hs-recap" aria-label="Recap">
    <p className="hs-name" ref={heading} tabIndex={-1}>{playerName}</p>
    {turn.questions.length > 0 && <ProgressTrail className="hs-strip" marks={tilesOf(turn.questions)} size="1.1rem"
      label={plural(answered, "{n} question answered", "{n} questions answered")} />}
    <div className="hs-recap-score">
      <ScoreCountUp value={score} label={plural(score, "{n} point", "{n} points")} className="hs-recap-count" />
      <span className="hs-recap-unit" aria-hidden="true">{plural(score, "point", "points")}</span>
      <NewBestRibbon when={newBest}>New best on this phone</NewBestRibbon>
    </div>
    {newBest && <p className="hs-best">
      <span className="hs-tag">{groupInfo(turn.group).label}</span>
      <span className="hs-tag">{plural(turn.seconds, "{n} second", "{n} seconds")}</span>
      <span className="hs-tag">{turn.style === "two" ? "Two choices" : "Open answers"}</span>
    </p>}
    {turn.questions.length === 0 ? <p className="hs-note">No questions were asked.</p> : <>
      <p className="hs-note">Tap a mark to change it.</p>
      <ol className="hs-recap-list">{turn.questions.map((asked, i) => <li key={`${asked.q.id}-${i}`} className={`hs-recap-row is-${asked.mark ?? "open"}`}>
        <button type="button" className="hs-mark-cycle" onClick={() => onFix(i)}>
          <span key={asked.mark ?? "open"} className="hs-mark-face"><MarkBadge mark={asked.mark} /></span>
        </button>
        <AskedRow asked={asked} />
      </li>)}</ol>
    </>}
    <FeedbackBand open pinned="narrow" focusAction={false} className="hs-save-band"
      verdict={<span className="hs-save-score">{plural(score, "{n} point", "{n} points")}</span>}
      action={<button type="button" className="hs-primary hs-big" onClick={onSave}><Save size={18} aria-hidden="true" />Save turn</button>} />
  </section>;
}
