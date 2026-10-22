// Whole-page options A and B of the test page. A is the page as it was: "Set your test" on parchment, then the
// question panel and its wheel on the dusk band. B is one dark screen: the settings read as one sentence with the
// choices in gold, and the same panel under it.
import { ArrowLeft, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { DustField } from "./DustField";
import type { OptionProps } from "./host";
import { TestArea } from "./host";
import { AnswersPick, BookPick, KindPick, LengthPick, TestamentPick, TopicPick } from "./Picks";
import { QuestionPanel } from "./QuestionPanel";
import { TestSetup } from "./TestSetup";

export function BackLink({ to }: { to: string }) {
  return <Link className="tp-back" to={to}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>;
}

export function OptionA(props: OptionProps) {
  const { bank, active, items, round, bookNames, redraw } = props;
  return <>
    <div className="tp-wrap tp-top"><BackLink to={props.backTo} /></div>
    <div className="tp-wrap tp-area-inner">
      <TestSetup {...props} onBegin={redraw} actionLabel="Draw again" />
    </div>
    <div className="tp-dusk">
      {active && <DustField />}
      <div className="tp-wrap">
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel} />}
      </div>
    </div>
  </>;
}

export function OptionB(props: OptionProps) {
  const { bank, facets, filters, update, length, setLength, active, items, round, bookNames, redraw } = props;
  const picks = { bank, facets, filters, update, className: "ob-word" };
  const available = facets.rows.length;
  return <div className="tp-dusk ob-screen">
    {active && <DustField />}
    <div className="tp-wrap">
      <div className="ob-top"><BackLink to={props.backTo} /><p className="tp-eyebrow"><span aria-hidden />Your test</p></div>
      <p className="ob-sentence">
        Test me with <LengthPick className="ob-word" length={length} setLength={setLength} /> <AnswersPick {...picks} /> from <KindPick {...picks} />,
        on <TopicPick {...picks} />, in <BookPick {...picks} /> of <TestamentPick {...picks} />.
      </p>
      <div className="ob-under">
        <p>{available ? <><strong>{available.toLocaleString()}</strong> questions match; {Math.min(length, available)} are drawn at random, in a new order each time.</>
          : "No questions match. Loosen one of the gold words."}</p>
        {filters.search && <p className="tp-search-chip">Only questions with “{filters.search}”
          <button type="button" onClick={() => update({ search: "" })} aria-label="Drop the search"><X size={13} aria-hidden /></button></p>}
        <button type="button" className="tp-quiet" disabled={!available} onClick={redraw}><RotateCcw size={14} strokeWidth={1.8} aria-hidden />Draw again</button>
      </div>
      <div className="ob-test">
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel} />}
      </div>
    </div>
  </div>;
}
