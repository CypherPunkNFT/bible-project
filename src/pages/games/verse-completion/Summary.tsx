// The round's ending (design §10.4) as the kit's result panel: a title that changes with the score, the stars counting
// up from zero out of three per answered card, the day streak's flame, the round's trail, Play again right there, then
// the dealt passages as small cards with their stars (tap one to read it, Add on each), and Add all missed as one card
// carrying the count. A perfect round gets one gold burst, once: a finished round reopened after a reload is still.
import { Star } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import type { Catalog } from "@/lib/types";
import { verseReference } from "@/lib/verses";
import { Confetti, ProgressTrail, RankLine, ResultPanel, ScoreCountUp, StreakFlame } from "../kit";
import type { Passage } from "./model";
import { PassageWords } from "./MyVerses";
import { missedIn } from "./progress";
import { Stars } from "./Result";
import type { Round, VerseRecord } from "./storage";
import { ROUND_RANKS } from "./text";
import { perfectRound, roundTrail } from "./view";

interface SummaryProps {
  catalog: Catalog;
  pool: ReadonlyMap<string, Passage>;
  round: Round;
  record: VerseRecord;
  saving: boolean;
  moreDue: number;
  streak: number;
  onToggleAdd: (id: string) => void;
  onAddAll: (ids: string[]) => void;
  onAgain: () => void;
  onSettings: () => void;
  onReviewMore: () => void;
}

export function Summary(props: SummaryProps) {
  const { round, record } = props;
  const answered = round.done.filter((done) => done.status === "answered");
  const skipped = round.done.length - answered.length;
  const stars = answered.reduce((sum, done) => sum + done.stars, 0);
  const best = answered.length * 3;
  const [open, setOpen] = useState<string | null>(null);
  const [fresh] = useState(() => !round.finished); // first shown now, not reopened after a reload
  const missed = missedIn(round).filter((id) => !(record.passages[id]?.box > 0));
  const perfect = perfectRound(round.done);
  return <ResultPanel className={`vc-summary${perfect ? " is-perfect" : ""}`}
    trail={<ProgressTrail className="vc-trail is-done" marks={roundTrail(round.done, round.ids.length)} label={plural(round.ids.length, "{n} verse dealt", "{n} verses dealt")} size="1rem" />}
    actions={<>
      {round.review && props.moreDue > 0 && <button type="button" className="vc-primary" onClick={props.onReviewMore}>Review the next 10</button>}
      <button type="button" className={round.review && props.moreDue > 0 ? "vc-secondary" : "vc-primary"} onClick={props.onAgain}>Play again</button>
      <button type="button" className="vc-link" onClick={props.onSettings}>Change settings</button>
    </>}
    reading={<>
      <ul className="vc-dealt" aria-label="The verses of this round">
        {round.done.map((done, i) => {
          const passage = props.pool.get(done.id)!;
          const added = (record.passages[done.id]?.box ?? 0) > 0;
          const reference = verseReference(props.catalog, passage.from, passage.to);
          const opened = open === done.id;
          return <li key={done.id} className={`vc-dealt-card is-${done.status === "skipped" ? "skipped" : done.stars === 3 ? "right" : done.stars === 0 ? "wrong" : "part"}${opened ? " is-open" : ""}`} style={{ "--kit-i": i } as CSSProperties}>
            {done.status === "answered" ? <button type="button" className="vc-dealt-head" aria-expanded={opened} onClick={() => setOpen(opened ? null : done.id)}>
              <span className="vc-dealt-ref">{reference}</span>
              <Stars count={done.stars} />
            </button> : <span className="vc-dealt-head">
              <span className="vc-dealt-ref">{reference}</span>
              <span className="vc-note">Skipped</span>
            </span>}
            {props.saving && done.status === "answered" && <button type="button" className="vc-chip" aria-pressed={added} onClick={() => props.onToggleAdd(done.id)}>
              {added ? "In My verses" : "Add"}
            </button>}
            {opened && <PassageWords catalog={props.catalog} passage={passage} />}
          </li>;
        })}
        {props.saving && missed.length > 0 && <li className="vc-dealt-card is-all">
          <button type="button" className="vc-dealt-head" onClick={() => props.onAddAll(missed)}>
            <span className="vc-dealt-ref">Add all missed to My verses</span>
            <span className="vc-dealt-count" aria-label={plural(missed.length, "{n} verse", "{n} verses")}>{formatNumber(missed.length)}</span>
          </button>
        </li>}
      </ul>
    </>}>
    <h1 tabIndex={-1}>{round.review ? "Review finished" : "Round finished"}</h1>
    <RankLine className="vc-rank" score={stars} best={best} ranks={ROUND_RANKS} />
    <div className="vc-total">
      <Confetti when={fresh && perfect} count={32} reach={150} />
      <Star size={28} aria-hidden="true" className="vc-total-star" />
      <ScoreCountUp value={stars} of={best} ms={fresh ? 900 : 0} label={`Stars: ${stars} out of ${best}`} />
    </div>
    <p className="vc-note">{skipped > 0 ? `Verses dealt: ${round.ids.length} · skipped: ${skipped}` : `Verses dealt: ${round.ids.length}`}</p>
    {props.saving && props.streak > 0 && <span className="vc-streak">
      <StreakFlame className="vc-flame" count={props.streak} litFrom={1} label={`Day streak: ${props.streak}`} />
      <span className="vc-streak-words" aria-hidden="true">Day streak</span>
    </span>}
  </ResultPanel>;
}
