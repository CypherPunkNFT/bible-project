// Whole-page option D, side by side: a dark column that stays in place on the left with the big wheel, the score and
// the settings stacked small; the question on parchment on the right, numbered like the questions page's sections.
// One run feeds both sides, so it is held here rather than in TestArea.
import { RotateCcw } from "lucide-react";
import { promptSize, useTestStage } from "./controls";
import { DustField } from "./DustField";
import { scoreOf, type Run } from "./engine";
import { RunHost, type OptionProps } from "./host";
import { BackLink } from "./OptionsAB";
import { Choices, KeyHint, NextButton, OpenAnswer, Verdict, VerseWords } from "./parts";
import { AnswersPick, BookPick, KindPick, LengthPick, TestamentPick, TopicPick } from "./Picks";
import { Ring } from "./Ring";
import { TestResults } from "./TestResults";

export function OptionD(props: OptionProps) {
  const { items, round } = props;
  return items.length > 0 ? <SplitTest key={round} {...props} /> : null;
}

function SplitTest(props: OptionProps) {
  const { bank, items, active, bookNames } = props;
  const { stage, round, start, finish } = useTestStage(items);
  if (stage.step === "results") return <div className="od-split">
    <Column {...props} results={stage.results} />
    <main className="od-main"><TestResults items={stage.items} results={stage.results} topics={bank.topics} bookNames={bookNames}
      onRetake={start} onNew={() => start(items)} /></main>
  </div>;
  return <RunHost key={round} items={stage.items} active={active} onFinish={finish}>
    {(run) => <div className="od-split">
      <Column {...props} results={run.results} current={run.index} />
      <main className="od-main"><PaperQuestion run={run} bookNames={bookNames} kinds={bank.kinds} /></main>
    </div>}
  </RunHost>;
}

function Column({ bank, facets, filters, update, length, setLength, active, redraw, backTo, results, current }: OptionProps & { results: Run["results"]; current?: number }) {
  const picks = { bank, facets, filters, update, className: "od-pick" };
  const answeredCount = results.filter(Boolean).length;
  const score = scoreOf(results);
  return <aside className="tp-dusk od-column" aria-label="Your test">
    {active && <DustField />}
    <BackLink to={backTo} />
    <Ring results={results} current={current}><strong>{score}</strong><small>right of {answeredCount}</small></Ring>
    <dl className="tp-panel-stats">
      <div><dt>Right</dt><dd className="is-right">{score}</dd></div>
      <div><dt>Missed</dt><dd className="is-wrong">{answeredCount - score}</dd></div>
      <div><dt>To go</dt><dd>{results.length - answeredCount}</dd></div>
    </dl>
    <div className="od-settings">
      <p className="tp-eyebrow"><span aria-hidden />Your test</p>
      <LengthPick className="od-pick" length={length} setLength={setLength} />
      <AnswersPick {...picks} /><KindPick {...picks} /><TopicPick {...picks} /><BookPick {...picks} /><TestamentPick {...picks} />
      <button type="button" className="tp-quiet" disabled={!facets.rows.length} onClick={redraw}><RotateCcw size={14} strokeWidth={1.8} aria-hidden />
        Draw again from {facets.rows.length.toLocaleString()}</button>
    </div>
  </aside>;
}

function PaperQuestion({ run, bookNames, kinds }: { run: Run; bookNames: Record<string, string>; kinds: Record<string, string> }) {
  const { item } = run;
  return <article className="od-question" key={run.index}>
    <div className="qp-section-head">
      <span className="qp-section-n" aria-hidden>{String(run.index + 1).padStart(2, "0")}</span>
      <div><p className="od-count">Question {run.index + 1} of {run.items.length} · {kinds[item.q.kind] ?? item.q.kind} · {item.q.collection}</p>
        {item.q.lesson && <p className="tp-lesson">{item.q.lesson}</p>}
        <h2 className={`tp-prompt ${promptSize(item.prompt)}`}>{item.prompt}</h2></div>
    </div>
    <div className="od-answers"><Choices run={run} /><OpenAnswer run={run} /></div>
    <div className="od-foot">
      <div className="tp-after" aria-live="polite">{run.answered ? <><Verdict run={run} /><VerseWords q={item.q} bookNames={bookNames} /></>
        : <p className="tp-verdict is-waiting">{item.format === "open" ? "Answer in your head first." : "Choose an answer."}</p>}</div>
      <NextButton run={run} />
    </div>
    <KeyHint run={run} />
  </article>;
}
