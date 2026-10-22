// Three alternatives to the question panel, for the owner to compare on the same questions (mock-up, 2026-10-22: "make
// alternatives… be creative"). All sit on the dusk band and keep the score wheel; they differ in how you answer.
// Styles: test-variants.css.
import { Eye } from "lucide-react";
import type { CSSProperties } from "react";
import { LETTERS } from "../model";
import { choiceState, promptSize } from "./controls";
import { scoreOf, type Run } from "./engine";
import { Choices, KeyHint, NextButton, OpenAnswer, Tick, Verdict, VerseWords } from "./parts";
import { Ring } from "./Ring";

export interface VariantProps { run: Run; bookNames: Record<string, string>; kinds: Record<string, string> }

function Head({ run, kinds }: Pick<VariantProps, "run" | "kinds">) {
  const { q } = run.item;
  return <div className="tv-head"><span>Question {run.index + 1} of {run.items.length}</span><span className="tp-meta">{kinds[q.kind] ?? q.kind} · {q.collection}</span></div>;
}

function Prompt({ run }: { run: Run }) {
  return <h2 className={`tp-prompt ${promptSize(run.item.prompt)}`}>{run.item.prompt}</h2>;
}

/** The line under a question: what happened and the verse, with the next button. */
function After({ run, bookNames }: Pick<VariantProps, "run" | "bookNames">) {
  return <div className="tv-after">
    <div aria-live="polite">{run.answered ? <><Verdict run={run} /><VerseWords q={run.item.q} bookNames={bookNames} /></>
      : <p className="tp-verdict is-waiting">{run.item.format === "open" ? "Answer in your head first." : "Choose an answer."}</p>}</div>
    <NextButton run={run} />
  </div>;
}

function Tally({ run }: { run: Run }) {
  const answered = run.results.filter(Boolean).length, score = scoreOf(run.results);
  return <p className="tv-tally"><span className="is-right">{score} right</span><span className="is-wrong">{answered - score} missed</span><span>{run.items.length - answered} to go</span></p>;
}

/** Floating pills: the options float gently as rounded pills, two by two, like the "I knew it" buttons. */
export function PillsVariant({ run, bookNames, kinds }: VariantProps) {
  const answered = run.results.filter(Boolean).length;
  return <div className="tv-pills">
    <div className="tv-pills-main" key={run.index}>
      <Head run={run} kinds={kinds} />
      <div className="tv-pills-body"><Prompt run={run} /><Choices run={run} /><OpenAnswer run={run} /></div>
      <After run={run} bookNames={bookNames} />
    </div>
    <aside className="tv-side" aria-label="How the test is going">
      <Ring results={run.results} current={run.index}><strong>{scoreOf(run.results)}</strong><small>right of {answered}</small></Ring>
      <Tally run={run} />
      <KeyHint run={run} />
    </aside>
  </div>;
}

/** Around the wheel: the wheel in the middle, the options on either side of it, each joined to it by a line. */
export function OrbitVariant({ run, bookNames, kinds }: VariantProps) {
  const { item, answered, revealed } = run;
  const open = item.format === "open";
  const sides = open ? null : [item.choices!.filter((_, i) => i % 2 === 0), item.choices!.filter((_, i) => i % 2 === 1)];
  const letterOf = (option: string) => item.format === "truefalse" ? option[0] : LETTERS[item.choices!.indexOf(option)];
  const option = (text: string, side: "left" | "right") => {
    const state = choiceState(text, item.q.answer, answered);
    return <button key={text} type="button" className={`tv-orbit-option on-${side} ${state}`} disabled={Boolean(answered)} onClick={() => run.choose(text)}>
      <span className="tp-letter">{letterOf(text)}</span><span>{text}</span>{state === "is-right" && <Tick right />}{state === "is-wrong" && <Tick right={false} />}
    </button>;
  };
  const mark = (right: boolean, side: "left" | "right") => <button type="button" className={`tv-orbit-option on-${side} ${answered ? (answered.right === right ? (right ? "is-right" : "is-wrong") : "is-dim") : ""}`}
    disabled={Boolean(answered)} onClick={() => run.mark(right)}><span>{right ? "I knew it" : "I missed it"}</span></button>;
  const centre = open && !revealed && !answered
    ? <button type="button" className="tv-orbit-reveal" onClick={run.reveal}><Eye size={18} strokeWidth={1.6} aria-hidden />Show the answer</button>
    : <><strong>{scoreOf(run.results)}</strong><small>right of {run.results.filter(Boolean).length}</small></>;
  return <div className="tv-orbit" key={run.index}>
    <Head run={run} kinds={kinds} />
    <Prompt run={run} />
    <div className="tv-orbit-stage">
      <div className="tv-orbit-side on-left">{sides ? sides[0].map((t) => option(t, "left")) : (revealed || answered) && mark(false, "left")}</div>
      <Ring results={run.results} current={run.index}>{centre}</Ring>
      <div className="tv-orbit-side on-right">{sides ? sides[1].map((t) => option(t, "right")) : (revealed || answered) && mark(true, "right")}</div>
    </div>
    {open && (revealed || answered) && <p className="tv-orbit-answer">{item.q.answer}</p>}
    <After run={run} bookNames={bookNames} />
    <div className="tv-orbit-foot"><Tally run={run} /><KeyHint run={run} /></div>
  </div>;
}

/** Tiles at dawn: the options as tall tiles in a row, and the sunrise behind the band grows with every right answer. */
export function TilesVariant({ run, bookNames, kinds }: VariantProps) {
  const score = scoreOf(run.results);
  const dawn = 0.12 + 0.88 * (score / run.items.length);
  return <div className="tv-tiles">
    <span className="tv-dawn" style={{ opacity: dawn } as CSSProperties} aria-hidden />
    <div className="tv-tiles-top">
      <div className="tv-tiles-copy"><Head run={run} kinds={kinds} /><Prompt run={run} /></div>
      <div className="tv-tiles-score">
        <Ring results={run.results} current={run.index}><strong>{score}</strong></Ring>
        <p>Every right answer<br />brings the dawn up.</p>
      </div>
    </div>
    <div className="tv-tiles-body" key={run.index}><Choices run={run} /><OpenAnswer run={run} /></div>
    <After run={run} bookNames={bookNames} />
    <div className="tv-tiles-foot"><Tally run={run} /><KeyHint run={run} /></div>
  </div>;
}
