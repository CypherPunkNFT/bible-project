// Bible twenty questions: where the player's answers and the site's notes disagreed (design §10.2). After a win it is
// the "Your answers" list with any difference marked; after a loss each difference gets "Oh, I see" or "I still think
// your note is wrong", which softens that one value on this device (§10.3). Notes are read with slip marks undone,
// because this is where the game teaches the true value.
import type { Engine, Turn } from "./engine";
import { VerseNote } from "./parts";
import { ANSWER_WORDS, differences, type Difference, type EvidenceRefs } from "./shared";

function Note({ engine, person, difference, refs }: { engine: Engine; person: number; difference: Difference; refs: EvidenceRefs | null }) {
  const p = engine.data.people[person], tag = engine.data.tags[difference.tag];
  const verse = refs?.[p.id]?.[tag.id];
  return <>
    <p><strong>You said:</strong> {ANSWER_WORDS[difference.answer]} to “{tag.q}”</p>
    <p><strong>Our notes on {p.label}:</strong> {ANSWER_WORDS[difference.note]}.</p>
    {verse !== undefined && <VerseNote verse={verse} />}
  </>;
}

/** The won screen's list: each question and answer, differences marked and versed. */
export function YourAnswers({ engine, person, turns, refs }: { engine: Engine; person: number; turns: readonly Turn[]; refs: EvidenceRefs | null }) {
  const marked = new Map(differences(engine, person, turns).map((d) => [d.tag, d]));
  const questions = turns.flatMap((t) => (t.kind === "q" ? [t] : []));
  return <details className="tq-answers" open={marked.size > 0}>
    <summary>Your answers{marked.size ? ` (${marked.size} differed from our notes)` : ""}</summary>
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

/** The lost screen's rows (design §10.2). */
export function Lesson({ engine, person, turns, refs, disputed, accepted, onAccept, onDispute }: LessonProps) {
  const rows = differences(engine, person, turns);
  const name = engine.data.people[person].label;
  return <section className="tq-lesson" aria-label="Where we disagreed">
    {rows.length === 0 ? <p>Your answers all matched our notes on {name}; we just ran out of questions. We'll ask sharper questions next time.</p>
      : <ul>
        {rows.map((d) => {
          const id = engine.data.tags[d.tag].id;
          const done = disputed.includes(id) ? "Noted: this device will not count it against you again." : accepted.includes(id) ? "Thanks." : "";
          return <li key={id} className="tq-lesson-row">
            <Note engine={engine} person={person} difference={d} refs={refs} />
            {done ? <p className="tq-done" role="status">{done}</p> : <div className="tq-row-actions">
              <button type="button" className="tq-secondary" onClick={() => onAccept(id)}>Oh, I see</button>
              <button type="button" className="tq-secondary" onClick={() => onDispute(id)}>I still think your note is wrong</button>
            </div>}
          </li>;
        })}
      </ul>}
    <p className="tq-thanks">Thanks: this helps the game get better.</p>
  </section>;
}
