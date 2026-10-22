// Whole-page option A of the test page (owner, 2026-10-22: the house style is A, with the answer in the as-is
// format). An intro with a large title and four numbers; section 01 to choose where the questions come from: the books
// as one wide bar chart (with a chapter chart once a book is chosen), the kinds, and how many; then, under a gold rule
// that divides the top from the questions, section 02 on the dusk band with the question panel and its wheel.
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { KindChips } from "../FilterRail";
import { SectionHead } from "../shared";
import { BookBars } from "./BookBars";
import { DustField } from "./DustField";
import { LENGTHS } from "./engine";
import type { OptionProps } from "./host";
import { TestArea } from "./host";
import { QuestionPanel } from "./QuestionPanel";

export function BackLink({ to }: { to: string }) {
  return <Link className="tp-back" to={to}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>;
}

export function OptionA(props: OptionProps) {
  const { bank, pool, facets, filters, update, length, setLength, active, items, round, bookNames, redraw, bookFacets, chapter, setChapter } = props;
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
      <section className="qp-section oc-where" aria-labelledby="oc-where-title">
        <SectionHead n="01" id="oc-where-title" title={<>Choose <em>where</em></>}
          lead="Every book of the Bible, each bar as tall as its questions. Choose a book to see it chapter by chapter, or leave it open for the whole Bible." />
        <BookBars books={bank.books} counts={bookFacets.counts.book} selected={filters.book} onChoose={(book) => update({ book })}
          pool={pool} bookRows={bookFacets.rows} chapter={chapter} onChapter={setChapter} />
        <KindChips facets={facets} filters={filters} update={update} />
        <div className="oc-length">
          <div className="tp-lengths" role="group" aria-label="How many questions">
            {LENGTHS.map((n) => <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)}><strong>{n}</strong><small>questions</small></button>)}
          </div>
          <button type="button" className="tp-begin-go" disabled={!rows.length} onClick={redraw}>Draw again<RotateCcw size={16} strokeWidth={1.7} aria-hidden /></button>
        </div>
      </section>
    </div>
    <div className="tp-dusk oc-band">
      {active && <DustField />}
      <div className="tp-wrap">
        <SectionHead n="02" id="oc-test-title" title={<>Answer <em>them</em></>} lead="One question at a time. Choose an option, or think of the answer and then look." />
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel} />}
      </div>
    </div>
  </>;
}
