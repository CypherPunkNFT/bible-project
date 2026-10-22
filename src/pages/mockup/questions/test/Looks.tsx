// The four looks of a question, for the owner to try and choose from (mock-up). They share the engine and the pieces
// in parts.tsx; only the arrangement and the styling (test-looks.css) differ.
import { useEffect, useState, type CSSProperties } from "react";
import { scoreOf, type Run } from "./engine";
import { promptSize } from "./controls";
import { Choices, KeyHint, Marks, NextButton, OpenAnswer, Verdict, VerseWords } from "./parts";
import { Ring } from "./Ring";

export interface LookProps { run: Run; bookNames: Record<string, string>; kinds: Record<string, string> }

const pad = (n: number) => String(n).padStart(2, "0");

function Meta({ run, kinds }: Pick<LookProps, "run" | "kinds">) {
  const { q } = run.item;
  return <span className="tp-meta">{kinds[q.kind] ?? q.kind} · {q.collection}</span>;
}

function Prompt({ run }: { run: Run }) {
  const { item } = run;
  return <>
    {item.q.lesson && <p className="tp-lesson">{item.q.lesson}</p>}
    <h2 className={`tp-prompt ${promptSize(item.prompt)}`}>{item.prompt}</h2>
  </>;
}

/** 1. The exam paper: a printed page, a big numeral behind each question, and the marks drawn in like a teacher's. */
export function LookPaper({ run, bookNames, kinds }: LookProps) {
  const done = run.index + (run.answered ? 1 : 0);
  return <div className="tp-paper">
    <div className="tp-paper-head"><span>Question <strong>{pad(run.index + 1)}</strong> of {run.items.length}</span><Meta run={run} kinds={kinds} /></div>
    <div className="tp-paper-rule" aria-hidden><span style={{ width: `${(done / run.items.length) * 100}%` }} /></div>
    <div className="tp-paper-sheet" key={run.index}>
      <span className="tp-paper-n" aria-hidden>{run.index + 1}</span>
      <Prompt run={run} />
      <Choices run={run} />
      <OpenAnswer run={run} />
      <div className="tp-after" aria-live="polite"><Verdict run={run} />{run.answered && <VerseWords q={run.item.q} bookNames={bookNames} />}</div>
    </div>
    <div className="tp-paper-foot"><KeyHint run={run} /><NextButton run={run} /></div>
  </div>;
}

/** 2. The card deck: a stack that thins as you go; answer, and the card turns over to show the answer and its verse. */
export function LookDeck({ run, bookNames, kinds }: LookProps) {
  const { item, answered, revealed } = run;
  const [turned, setTurned] = useState(false);
  // An option stays marked for a moment before the card turns, so you see which one was right.
  useEffect(() => {
    if (!answered && !revealed) { setTurned(false); return; }
    const timer = window.setTimeout(() => setTurned(true), item.format === "open" ? 0 : 750);
    return () => window.clearTimeout(timer);
  }, [answered, revealed, item.format, run.index]);
  const left = run.items.length - run.index - 1;
  const score = scoreOf(run.results);
  const missed = run.results.filter((r) => r && !r.right).length;
  return <div className="tp-deck">
    <div className="tp-deck-table">
      <div className="tp-deck-pile" aria-hidden>{Array.from({ length: Math.min(left, 6) }, (_, i) => <span key={i} style={{ "--i": i + 1 } as CSSProperties} />)}</div>
      <div className={`tp-card ${turned ? "is-turned" : ""}`} key={run.index}>
        <div className="tp-card-inner">
          <div className="tp-card-face tp-card-front" aria-hidden={turned}>
            <div className="tp-card-head"><span>Card {run.index + 1} of {run.items.length}</span><Meta run={run} kinds={kinds} /></div>
            <Prompt run={run} />
            <Choices run={run} />
            {item.format === "open" && <OpenAnswer run={run} />}
          </div>
          <div className="tp-card-face tp-card-back" aria-hidden={!turned}>
            <p className="tp-card-q">{item.prompt}</p>
            {item.format === "open" ? <><span className="tp-card-label">The answer</span><OpenAnswer run={run} /></>
              : <><span className={`tp-stamp ${answered?.right ? "is-right" : "is-wrong"}`}>{answered?.right ? "Right" : "Not quite"}</span>
                <span className="tp-card-label">The answer</span><p className="tp-card-answer">{item.q.answer}</p></>}
            {answered && <VerseWords q={item.q} bookNames={bookNames} />}
            <div className="tp-card-foot">{item.format === "open" && <Verdict run={run} />}<NextButton run={run} /></div>
          </div>
        </div>
      </div>
    </div>
    <p className="tp-deck-tally"><span className="is-right">{score} right</span><span className="is-wrong">{missed} missed</span><span>{left} to go</span></p>
    <KeyHint run={run} />
  </div>;
}

/** 3. The dark stage: gold type on the dust field, a step for every question along the top. */
export function LookStage({ run, bookNames, kinds }: LookProps) {
  return <div className="tp-stage">
    <Marks run={run} />
    <div className="tp-stage-q" key={run.index}>
      <span className="tp-stage-n" aria-hidden>{run.index + 1}</span>
      <p className="tp-stage-meta">Question {run.index + 1} of {run.items.length} · <Meta run={run} kinds={kinds} /></p>
      <Prompt run={run} />
      <Choices run={run} />
      <OpenAnswer run={run} />
      <div className="tp-after" aria-live="polite"><Verdict run={run} />{run.answered && <VerseWords q={run.item.q} bookNames={bookNames} />}</div>
    </div>
    <div className="tp-stage-foot"><KeyHint run={run} /><NextButton run={run} /></div>
  </div>;
}

/** 4. Try one, grown up: the header's panel at full size, one height for every question, the ring filling beside it. */
export function LookPanel({ run, bookNames, kinds }: LookProps) {
  const answeredCount = run.results.filter(Boolean).length;
  const score = scoreOf(run.results);
  return <div className="tp-panel-layout">
    <div className="tp-panel" key={run.index}>
      <span className="tp-panel-mark" aria-hidden>?</span>
      <div className="tp-panel-head"><span>Question {run.index + 1} of {run.items.length}</span><Meta run={run} kinds={kinds} /></div>
      <div className="tp-panel-body"><Prompt run={run} /><Choices run={run} /><OpenAnswer run={run} /></div>
      <div className="tp-panel-foot">
        <div className="tp-after" aria-live="polite">{run.answered ? <><Verdict run={run} /><VerseWords q={run.item.q} bookNames={bookNames} /></>
          : <p className="tp-verdict is-waiting">{run.item.format === "open" ? "Answer in your head first." : "Choose an answer."}</p>}</div>
        <NextButton run={run} />
      </div>
    </div>
    <aside className="tp-panel-side" aria-label="How the test is going">
      <Ring results={run.results} current={run.index}><strong>{score}</strong><small>right of {answeredCount}</small></Ring>
      <dl className="tp-panel-stats">
        <div><dt>Right</dt><dd className="is-right">{score}</dd></div>
        <div><dt>Missed</dt><dd className="is-wrong">{answeredCount - score}</dd></div>
        <div><dt>To go</dt><dd>{run.items.length - answeredCount}</dd></div>
      </dl>
      <KeyHint run={run} />
    </aside>
  </div>;
}
