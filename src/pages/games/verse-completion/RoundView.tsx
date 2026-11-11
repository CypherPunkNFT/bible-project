// A round in progress (design §10.2, §10.4): a trail of ten segments across the top, one per card, filling green, amber
// or red as each is answered, with the star total beside it and Leave round (a site-styled confirm); one card at a
// time; then the summary. Each answer is saved once, with its card index, before the result shows; a reload resumes at
// the first unanswered card. Only the tab that owns the round may answer it (§9).
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import type { Catalog } from "@/lib/types";
import type { BoxChange } from "./boxes";
import { Card } from "./Card";
import { ConfirmDialog, ProgressTrail } from "../kit";
import type { Passage } from "./model";
import { commitCard, finishRound, type Refusal } from "./progress";
import type { Done, Round, VerseRecord } from "./storage";
import { Summary } from "./Summary";
import { roundTrail } from "./view";

interface RoundProps {
  catalog: Catalog;
  pool: ReadonlyMap<string, Passage>;
  round: Round;
  record: VerseRecord;
  tab: string;
  today: number;
  streak: number;
  saving: boolean;
  apply: <T>(change: (base: VerseRecord) => { record: VerseRecord; value: T }) => T;
  onTakeOver: () => void;
  onLeave: () => void;
  onHome: () => void;
  onToggleAdd: (id: string) => void;
  onAddAll: (ids: string[]) => void;
  onAgain: () => void;
  onReviewMore: () => void;
  moreDue: number;
}

const REFUSALS: Record<Refusal, string> = {
  gone: "This round has ended or was replaced, so that answer was not saved.",
  repeat: "That card was already saved.",
  elsewhere: "This round is being played in another tab, so that answer was not saved.",
};

export function RoundView(props: RoundProps) {
  const { round, record, tab, today } = props;
  const [viewing, setViewing] = useState(round.done.length);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [leaving, setLeaving] = useState(false);
  const atEnd = viewing >= round.ids.length;
  const { apply } = props;

  useEffect(() => { // the summary counts the round once, however often it is shown
    if (atEnd && round.done.length === round.ids.length && !round.finished) apply((base) => ({ record: finishRound(base, round.id, today), value: null }));
  }, [atEnd, round, today, apply]);

  const save = (done: Done): BoxChange | null | false => {
    const value = apply((base) => {
      const outcome = commitCard(base, round.id, viewing, tab, done, today);
      return typeof outcome === "string" ? { record: base, value: outcome as Refusal | BoxChange | null } : { record: outcome.record, value: outcome.change };
    });
    if (typeof value === "string") { setRefusal(value); return false; }
    setRefusal(null);
    return value;
  };

  if (round.owner !== tab) {
    return <div className="vc-start">
      <p className="vc-note" role="alert">This round is being played in another tab.</p>
      <div className="vc-actions">
        <button type="button" className="vc-primary" onClick={props.onTakeOver}>Play it here instead</button>
        <button type="button" className="vc-link" onClick={props.onHome}>Game home</button>
      </div>
    </div>;
  }
  if (atEnd) {
    return <Summary catalog={props.catalog} pool={props.pool} round={round} record={record} saving={props.saving} moreDue={props.moreDue} streak={props.streak}
      onToggleAdd={props.onToggleAdd} onAddAll={props.onAddAll} onAgain={props.onAgain} onSettings={props.onHome} onReviewMore={props.onReviewMore} />;
  }
  const id = round.ids[viewing];
  const passage = props.pool.get(id)!;
  const stars = round.done.reduce((sum, done) => sum + done.stars, 0);
  const next = () => { setViewing((n) => n + 1); window.scrollTo?.({ top: 0 }); };
  const trailLabel = round.review ? `Review · ${viewing + 1} of ${round.ids.length}` : `Round · ${viewing + 1} of ${round.ids.length}`;
  return <div className="vc-round">
    <header className="vc-round-head">
      <ProgressTrail className="vc-trail" marks={roundTrail(round.done, round.ids.length)} label={trailLabel} />
      <span className="vc-sofar" role="img" aria-label={plural(stars, "{n} star so far", "{n} stars so far")}>
        <Star size={15} aria-hidden="true" /><span aria-hidden="true">{formatNumber(stars)}</span>
      </span>
      <button type="button" className="vc-link" onClick={() => setLeaving(true)}>Leave round</button>
    </header>
    {refusal && <p className="vc-note" role="alert">{REFUSALS[refusal]}</p>}
    <Card key={`${round.id}:${viewing}`} catalog={props.catalog} pool={props.pool} passage={passage} settings={round.settings}
      level={round.review ? "hard" : round.settings.level} seed={round.seed} saving={false}
      inMyVerses={(record.passages[id]?.box ?? 0) > 0} onToggleAdd={() => props.onToggleAdd(id)} onNext={next}
      onAnswer={(accuracy, starCount) => save({ id, status: "answered", accuracy, stars: starCount })}
      onSkip={() => { if (save({ id, status: "skipped", accuracy: 0, stars: 0 }) !== false) next(); }} />
    <ConfirmDialog open={leaving} title="Leave this round?" confirmLabel="Yes, leave" onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); props.onLeave(); }}>
      <p className="vc-note">The stars you have earned are kept.</p>
    </ConfirmDialog>
  </div>;
}
