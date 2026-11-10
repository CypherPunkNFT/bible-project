// Bible twenty questions, reverse mode: the fixed question list in its seven sections, with a search box that only
// filters it (design §9.2). Asked questions stay in place, greyed, with their answer. With hints on, each open
// question carries a thin bar showing how evenly it would split the people still possible.
import { useId, useMemo, useState } from "react";
import type { Engine, ReverseAnswer } from "./engine";
import { GROUPS, REVERSE_WORDS, evenness, fold } from "./shared";

interface Props {
  engine: Engine;
  answers: ReadonlyMap<number, ReverseAnswer>;
  /** People still possible, when hints are on. */
  possible: readonly number[] | null;
  disabled: boolean;
  onAsk: (tag: number) => void;
}

export function QuestionPicker({ engine, answers, possible, disabled, onAsk }: Props) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const q = fold(query);
  const sections = useMemo(() => GROUPS.map(([group, title]) => ({
    group, title,
    tags: engine.data.tags.flatMap((tag, i) => (tag.g === group && (!q || fold(tag.q).includes(q)) ? [i] : [])),
  })).filter((s) => s.tags.length), [engine, q]);

  return <section className="tq-picker" aria-label="Questions you can ask">
    <label htmlFor={searchId} className="sr-only">Find a question</label>
    <input id={searchId} type="search" autoComplete="off" placeholder="Find a question, e.g. king" value={query} onChange={(e) => setQuery(e.target.value)} />
    {!sections.length && <p className="tq-empty">No question has that word. Try another.</p>}
    {sections.map((s) => <div key={s.group} className="tq-group">
      <h2>{s.title}</h2>
      <ul>
        {s.tags.map((t) => {
          const answer = answers.get(t);
          const bar = possible && !answer ? evenness(engine, possible, t) : null;
          return <li key={t}>
            <button type="button" className="tq-pick" disabled={disabled || answer !== undefined} onClick={() => onAsk(t)}>
              <span>{engine.data.tags[t].q}</span>
              {answer && <span className="tq-pick-answer">{REVERSE_WORDS[answer]}</span>}
              {bar !== null && <span className="tq-split" title="How evenly this question splits the people still possible">
                <span style={{ width: `${Math.round(bar * 100)}%` }} />
              </span>}
            </button>
          </li>;
        })}
      </ul>
    </div>)}
  </section>;
}
