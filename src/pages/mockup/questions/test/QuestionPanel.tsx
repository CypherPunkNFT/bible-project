// One question of a test, the owner's chosen look (2026-10-22): the header's Try one panel at full size, one height for
// every question, with the score ring filling beside it, set on the dark dusk field (test-stage.css).
import { promptSize } from "./controls";
import { scoreOf, type Run } from "./engine";
import { Choices, KeyHint, NextButton, OpenAnswer, Verdict, VerseWords } from "./parts";
import { Ring } from "./Ring";

interface Props { run: Run; bookNames: Record<string, string>; kinds: Record<string, string> }

export function QuestionPanel({ run, bookNames, kinds }: Props) {
  const { item } = run;
  const answeredCount = run.results.filter(Boolean).length;
  const score = scoreOf(run.results);
  return <div className="tp-panel-layout">
    <div className="tp-panel" key={run.index}>
      <span className="tp-panel-mark" aria-hidden>?</span>
      <div className="tp-panel-head"><span>Question {run.index + 1} of {run.items.length}</span>
        <span className="tp-meta">{kinds[item.q.kind] ?? item.q.kind} · {item.q.collection}</span></div>
      <div className="tp-panel-body">
        {item.q.lesson && <p className="tp-lesson">{item.q.lesson}</p>}
        <h2 className={`tp-prompt ${promptSize(item.prompt)}`}>{item.prompt}</h2>
        <Choices run={run} />
        <OpenAnswer run={run} />
      </div>
      <div className="tp-panel-foot">
        <div className="tp-after" aria-live="polite">{run.answered ? <><Verdict run={run} /><VerseWords q={item.q} bookNames={bookNames} /></>
          : <p className="tp-verdict is-waiting">{item.format === "open" ? "Answer in your head first." : "Choose an answer."}</p>}</div>
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
