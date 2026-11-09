// The round summary (design §10.4): stars out of three per answered card, one row per dealt passage with an Add
// toggle, Add all missed, Play again, Change settings, and after a review, Review the next 10 when more are due.
import { useState } from "react";
import type { Catalog } from "@/lib/types";
import { verseReference } from "@/lib/verses";
import type { Passage } from "./model";
import { PassageWords } from "./MyVerses";
import { missedIn } from "./progress";
import { Stars } from "./Result";
import type { Round, VerseRecord } from "./storage";

interface SummaryProps {
  catalog: Catalog;
  pool: ReadonlyMap<string, Passage>;
  round: Round;
  record: VerseRecord;
  saving: boolean;
  moreDue: number;
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
  const [open, setOpen] = useState<string | null>(null);
  const missed = missedIn(round).filter((id) => !(record.passages[id]?.box > 0));
  return <div className="vc-summary">
    <h1 tabIndex={-1}>{round.review ? "Review finished" : "Round finished"}</h1>
    <p className="vc-total">{`Stars: ${stars} out of ${answered.length * 3}`}</p>
    <p className="vc-note">{skipped > 0 ? `Verses dealt: ${round.ids.length} · skipped: ${skipped}` : `Verses dealt: ${round.ids.length}`}</p>
    <ul className="vc-rows">
      {round.done.map((done) => {
        const passage = props.pool.get(done.id)!;
        const added = (record.passages[done.id]?.box ?? 0) > 0;
        return <li key={done.id} className="vc-row">
          {done.status === "answered" ? <button type="button" className="vc-link vc-row-ref" aria-expanded={open === done.id} onClick={() => setOpen(open === done.id ? null : done.id)}>
            {verseReference(props.catalog, passage.from, passage.to)}
          </button> : <span className="vc-row-ref">{verseReference(props.catalog, passage.from, passage.to)}</span>}
          {done.status === "answered" ? <Stars count={done.stars} /> : <span className="vc-note">Skipped</span>}
          {props.saving && done.status === "answered" && <button type="button" className="vc-chip" aria-pressed={added} onClick={() => props.onToggleAdd(done.id)}>
            {added ? "In My verses" : "Add"}
          </button>}
          {open === done.id && <PassageWords catalog={props.catalog} passage={passage} />}
        </li>;
      })}
    </ul>
    <div className="vc-actions">
      {props.saving && missed.length > 0 && <button type="button" className="vc-secondary" onClick={() => props.onAddAll(missed)}>Add all missed to My verses</button>}
      {round.review && props.moreDue > 0 && <button type="button" className="vc-primary" onClick={props.onReviewMore}>Review the next 10</button>}
      <button type="button" className={round.review && props.moreDue > 0 ? "vc-secondary" : "vc-primary"} onClick={props.onAgain}>Play again</button>
      <button type="button" className="vc-link" onClick={props.onSettings}>Change settings</button>
    </div>
  </div>;
}
