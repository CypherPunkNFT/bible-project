// Whole-page option A of the test page, the self-test page in full (owner, 2026-10-22: "this needs to be a whole
// page… the self-test page in all of its glory", with themed tests rather than the sources the questions came from).
// A short top (a title line, two lines under it, one floating line of numbers); 01 the themed tests on shelves; 02 a
// test of your own from the book and chapter charts; a ready bar with the kind of question, how many and Begin; then,
// under a gold rule, 03 on the dusk band with the as-is question panel and its wheel. Finished tests are kept in this
// browser's record, which each theme card shows.
import { ArrowDown, ArrowLeft, RotateCcw } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { KINDS } from "../model";
import { SectionHead } from "../shared";
import { BookBars } from "./BookBars";
import { DustField } from "./DustField";
import { LENGTHS, scoreOf } from "./engine";
import type { OptionProps } from "./host";
import { TestArea } from "./host";
import { QuestionPanel } from "./QuestionPanel";
import { useRecord } from "./record";
import { ThemeShelves } from "./ThemeShelves";
import { MIN_THEME, THEMES, inTheme, themeById } from "./themes";

export function BackLink({ to }: { to: string }) {
  return <Link className="tp-back" to={to}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>;
}

export function OptionA(props: OptionProps) {
  const { bank, pool, facets, filters, update, active, items, round, bookNames, bookFacets, chapter, setChapter, themeRows, setTheme } = props;
  const { record, save } = useRecord();
  const theme = themeById(props.theme);
  const themeCounts = useMemo(() => new Map(THEMES.map((t) => [t.id, themeRows.filter((r) => inTheme(t, pool[r])).length])), [themeRows, pool]);
  const shown = THEMES.filter((t) => (themeCounts.get(t.id) ?? 0) >= MIN_THEME).length;
  const taken = Object.values(record).reduce((sum, mark) => sum + mark.taken, 0);
  const band = useRef<HTMLDivElement>(null);
  const toTest = () => band.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const what = theme?.title ?? (filters.book ? `${bookNames[filters.book] ?? filters.book}${chapter ? `, chapter ${chapter}` : ""}` : "The whole Bible");
  return <>
    <div className="tp-wrap">
      <header className="ts-head">
        <BackLink to={props.backTo} />
        <h1>Test <em>yourself</em></h1>
        <p>{shown} themed tests, from Abraham to the life to come, or one of your own from any book and chapter.
          One question at a time, and every answer opens the verse it comes from.</p>
        <p className="ts-float"><span><b>{pool.length.toLocaleString()}</b> questions</span><span><b>{shown}</b> themes</span>
          <span><b>66</b> books</span><span><b>{taken}</b> {taken === 1 ? "test" : "tests"} taken</span></p>
      </header>
      <section className="qp-section" aria-labelledby="ts-themes-title">
        <SectionHead n="01" id="ts-themes-title" title={<>Choose a <em>theme</em></>}
          lead="Questions gathered by what they are about. Choose a shelf, then a group, then a test, and it is ready below." />
        <ThemeShelves counts={themeCounts} selected={props.theme} record={record} onChoose={(id) => { setTheme(id); if (id) toTest(); }} />
      </section>
      <section className="qp-section oc-where" aria-labelledby="oc-where-title">
        <SectionHead n="02" id="oc-where-title" title={<>Or choose <em>where</em></>}
          lead="Every book of the Bible, each bar as tall as its questions. Choose a book, then a chapter if you like." />
        <BookBars books={bank.books} counts={bookFacets.counts.book} selected={filters.book} onChoose={(book) => update({ book })}
          pool={pool} bookRows={bookFacets.rows} chapter={chapter} onChapter={setChapter} />
      </section>
      <ReadyBar {...props} what={what} onBegin={toTest} />
    </div>
    <div className="tp-dusk oc-band" ref={band}>
      {active && <DustField />}
      <div className="tp-wrap">
        <SectionHead n="03" id="oc-test-title" title={theme ? <>{theme.title}</> : <>Answer <em>them</em></>}
          lead={theme ? theme.line : "One question at a time. Choose an option, or think of the answer and then look."} />
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel}
          onResults={(results) => save(props.theme || "own", scoreOf(results), results.length)} />}
        {!facets.rows.length && <p className="ts-empty">No questions match. Choose another theme or book, or a different kind of question.</p>}
      </div>
    </div>
  </>;
}

/** What the test will be, the kind of question and how many, and Begin. */
function ReadyBar({ facets, filters, update, length, setLength, redraw, what, onBegin }: OptionProps & { what: string; onBegin: () => void }) {
  const kinds = facets.counts.kind;
  const total = [...kinds.values()].reduce((a, b) => a + b, 0);
  const available = facets.rows.length;
  return <div className="ts-ready">
    <div className="ts-ready-what"><span className="tp-field-label">Your test</span><strong>{what}</strong>
      <small>{available.toLocaleString()} questions to draw from</small></div>
    <div className="tp-segments ts-kinds" role="group" aria-label="Kind of question">
      {KINDS.map((k) => <button key={k.label} type="button" aria-pressed={filters.kind === k.id} onClick={() => update({ kind: k.id, topic: "", collection: "" })}>
        {k.label}<small>{(k.id ? kinds.get(k.id) ?? 0 : total).toLocaleString()}</small></button>)}
    </div>
    <div className="tp-segments ts-length" role="group" aria-label="How many questions">
      {LENGTHS.map((n) => <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)}>{n}</button>)}
    </div>
    <div className="ts-ready-go">
      <button type="button" className="tp-quiet" disabled={!available} onClick={redraw}><RotateCcw size={14} strokeWidth={1.8} aria-hidden />Draw again</button>
      <button type="button" className="tp-begin-go" disabled={!available} onClick={onBegin}>Begin · {Math.min(length, available)} questions<ArrowDown size={16} strokeWidth={1.7} aria-hidden /></button>
    </div>
  </div>;
}
