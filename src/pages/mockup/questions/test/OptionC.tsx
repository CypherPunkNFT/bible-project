// Whole-page option C, the questions page's own house style: an intro with a large title and four numbers, section 01
// to choose where the questions come from (the book map, the kinds, how many), then section 02 on the dusk band, where
// each question plays like a film card: its number as a giant Roman numeral behind it, the options as ruled lines two
// by two, and a small wheel under it.
import { RotateCcw } from "lucide-react";
import { KindChips } from "../FilterRail";
import { BookGrid } from "../BookGrid";
import { SectionHead } from "../shared";
import { promptSize, roman } from "./controls";
import { DustField } from "./DustField";
import { LENGTHS, scoreOf } from "./engine";
import type { OptionProps, ViewProps } from "./host";
import { TestArea } from "./host";
import { BackLink } from "./OptionsAB";
import { Choices, KeyHint, NextButton, OpenAnswer, Verdict, VerseWords } from "./parts";
import { Ring } from "./Ring";

export function OptionC(props: OptionProps) {
  const { bank, pool, facets, filters, update, length, setLength, active, items, round, bookNames, redraw } = props;
  const rows = facets.rows;
  const stats: [number, string][] = [
    [rows.length, "questions to draw from"],
    [new Set(rows.flatMap((r) => pool[r].books)).size, "books they come from"],
    [new Set(rows.map((r) => pool[r].topic).filter(Boolean)).size, "topics they cover"],
    [rows.filter((r) => pool[r].options?.length).length, "with options to choose"],
  ];
  return <>
    <div className="tp-wrap">
      <div className="tp-top"><BackLink to={props.backTo} /></div>
      <header className="oc-intro">
        <p className="tp-eyebrow"><span aria-hidden />Your test</p>
        <h1>Test what you <em>know</em></h1>
        <p>Choose where the questions come from and how many. They come one at a time, in a new order every time, and each answer opens the verse it comes from.</p>
        <dl className="oc-stats">{stats.map(([n, label]) => <div key={label}><dt>{label}</dt><dd>{n.toLocaleString()}</dd></div>)}</dl>
      </header>
      <BookGrid books={bank.books} counts={facets.counts.book} selected={filters.book} onChoose={(book) => update({ book })}
        title={<>Choose <em>where</em></>} lead="Every book of the Bible with its questions; the deeper the colour, the more there are. Choose a book, a kind of question and how many, or leave them all open." />
      <KindChips facets={facets} filters={filters} update={update} />
      <div className="oc-length">
        <div className="tp-lengths" role="group" aria-label="How many questions">
          {LENGTHS.map((n) => <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)}><strong>{n}</strong><small>questions</small></button>)}
        </div>
        <button type="button" className="tp-begin-go" disabled={!rows.length} onClick={redraw}>Draw again<RotateCcw size={16} strokeWidth={1.7} aria-hidden /></button>
      </div>
    </div>
    <div className="tp-dusk oc-band">
      {active && <DustField />}
      <div className="tp-wrap">
        <SectionHead n="02" id="oc-test-title" title={<>Answer <em>them</em></>} lead="One question at a time. Choose an option, or think of the answer and then look." />
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={CinemaQuestion} />}
      </div>
    </div>
  </>;
}

function CinemaQuestion({ run, bookNames, kinds }: ViewProps) {
  const { item } = run;
  const answeredCount = run.results.filter(Boolean).length;
  return <div className="oc-cinema" key={run.index}>
    <span className="oc-numeral" aria-hidden>{roman(run.index + 1)}</span>
    <p className="oc-count">Question {run.index + 1} of {run.items.length}<span>{kinds[item.q.kind] ?? item.q.kind} · {item.q.collection}</span></p>
    <div className="oc-prompt">
      {item.q.lesson && <p className="tp-lesson">{item.q.lesson}</p>}
      <h2 className={`tp-prompt ${promptSize(item.prompt)}`}>{item.prompt}</h2>
    </div>
    <div className="oc-answers"><Choices run={run} /><OpenAnswer run={run} /></div>
    <div className="oc-foot">
      <Ring results={run.results} current={run.index}><strong>{scoreOf(run.results)}</strong><small>of {answeredCount}</small></Ring>
      <div className="tp-after" aria-live="polite">{run.answered ? <><Verdict run={run} /><VerseWords q={item.q} bookNames={bookNames} /></>
        : <p className="tp-verdict is-waiting">{item.format === "open" ? "Answer in your head first." : "Choose an answer."}</p>}</div>
      <div className="oc-next"><NextButton run={run} /><KeyHint run={run} /></div>
    </div>
  </div>;
}
