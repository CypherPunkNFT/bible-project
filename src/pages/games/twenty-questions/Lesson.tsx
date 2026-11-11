// Bible twenty questions: where the player's answers and the site's notes disagreed (design §10.2). After a win it is
// the "Your answers" list with any difference marked; after a loss the differences come one card at a time (the
// audit's item 7), each with "Oh, I see" or "I still think your note is wrong", which softens that one value on this
// device (§10.3). Notes are read with slip marks undone, because this is where the game teaches the true value.
import { formatNumber } from "@/lib/site-format";
import type { Engine, Turn } from "./engine";
import { VerseNote } from "./parts";
import { ANSWER_WORDS, differences, nextToReview, type Difference, type EvidenceRefs } from "./shared";

function Note({ engine, person, difference, refs }: { engine: Engine; person: number; difference: Difference; refs: EvidenceRefs | null }) {
  const p = engine.data.people[person], tag = engine.data.tags[difference.tag];
  const verse = refs?.[p.id]?.[tag.id];
  return <>
    <p className="tq-note-q">{tag.q}</p>
    <p className="tq-note-row"><strong>You said</strong> <span className="tq-note-said">{ANSWER_WORDS[difference.answer]}</span></p>
    <p className="tq-note-row"><strong>Our notes say</strong> <span className="tq-note-note">{ANSWER_WORDS[difference.note]}</span></p>
    {verse !== undefined && <VerseNote verse={verse} />}
  </>;
}

/** The won screen's list: each question and answer, differences marked and versed. */
export function YourAnswers({ engine, person, turns, refs }: { engine: Engine; person: number; turns: readonly Turn[]; refs: EvidenceRefs | null }) {
  const marked = new Map(differences(engine, person, turns).map((d) => [d.tag, d]));
  const questions = turns.flatMap((t) => (t.kind === "q" ? [t] : []));
  return <details className="tq-answers" open={marked.size > 0}>
    <summary>{marked.size ? `Your answers (${formatNumber(marked.size)} differed from our notes)` : "Your answers"}</summary>
    <ol>
      {questions.map((t) => {
        const difference = marked.get(t.tag);
        return <li key={t.tag} className={difference ? "is-different" : ""}>
          {difference ? <Note engine={engine} person={person} difference={difference} refs={refs} />
            : <p>{engine.data.tags[t.tag].q} <strong>{ANSWER_WORDS[t.answer]}</strong></p>}
        </li>;
      })}
    </ol>
  </details>;
}

interface LessonProps {
  engine: Engine;
  person: number;
  turns: readonly Turn[];
  refs: EvidenceRefs | null;
  /** Tag ids the player has disputed; their rows show as recorded. */
  disputed: readonly string[];
  accepted: readonly string[];
  onAccept: (tagId: string) => void;
  onDispute: (tagId: string) => void;
}

/** The lost screen's cards (design §10.2), one disagreement at a time. */
export function Lesson({ engine, person, turns, refs, disputed, accepted, onAccept, onDispute }: LessonProps) {
  const rows = differences(engine, person, turns);
  const ids = rows.map((d) => engine.data.tags[d.tag].id);
  const name = engine.data.people[person].label;
  const at = nextToReview(ids, accepted, disputed);
  const done = ids.filter((id) => accepted.includes(id) || disputed.includes(id));
  const lastDone = done[done.length - 1];
  const status = lastDone === undefined ? "" : disputed.includes(lastDone) ? "Noted: this device will not count it against you again." : "Thanks for telling us.";
  return <section className="tq-lesson" aria-label="Where we disagreed">
    {rows.length === 0 ? <p className="tq-lede">{`Your answers all matched our notes on ${name}; we just ran out of questions. We'll ask sharper questions next time.`}</p>
      : <>
        <p className="tq-lesson-head">
          <span>Where we disagreed</span>
          <span className="tq-lesson-count">{at < 0 ? `${formatNumber(rows.length)} of ${formatNumber(rows.length)}` : `${formatNumber(at + 1)} of ${formatNumber(rows.length)}`}</span>
        </p>
        {at >= 0 && <div className="tq-lesson-card" key={ids[at]}>
          <Note engine={engine} person={person} difference={rows[at]} refs={refs} />
          <div className="tq-row-actions">
            <button type="button" className="tq-secondary" onClick={() => onAccept(ids[at])}>Oh, I see</button>
            <button type="button" className="tq-secondary" onClick={() => onDispute(ids[at])}>I still think your note is wrong</button>
          </div>
        </div>}
        {at < 0 && <details className="tq-answers">
          <summary>What we went over</summary>
          <ol>
            {rows.map((d, i) => <li key={ids[i]} className="is-different"><Note engine={engine} person={person} difference={d} refs={refs} /></li>)}
          </ol>
        </details>}
      </>}
    <p className="tq-done" role="status">{status}</p>
    {(rows.length === 0 || at < 0) && <p className="tq-thanks">Thanks: this helps the game get better.</p>}
  </section>;
}
