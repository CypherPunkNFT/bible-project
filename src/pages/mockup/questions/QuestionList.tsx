// 02's results: the search field, what is filtered, and the questions in a scroll pane (with the pill-only scrollbar
// the owner chose for result lists), loading more as the pane reaches its end.
import { Eye, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import PillScroll from "@/components/apologetics/PillScroll";
import type { BankQuestion, QuestionBank } from "@/lib/data";
import { isFiltered, kindTone, LETTERS, searchTerms, type Filters } from "./model";
import { Highlight, ReadLink } from "./shared";

const STEP = 40;
// Longer answers (whole catechism paragraphs) fold to a few lines until asked for.
const LONG_ANSWER = 260;

interface Props { bank: QuestionBank; rows: number[]; filters: Filters; update: (patch: Partial<Filters>) => void; clear: () => void; testMode: boolean; bookNames: Record<string, string> }

export function QuestionList({ bank, rows, filters, update, clear, testMode, bookNames }: Props) {
  const [shown, setShown] = useState(STEP);
  const sentinel = useRef<HTMLDivElement>(null);
  const terms = searchTerms(filters.search);
  const topicTitle = Object.fromEntries(bank.topics.map((t) => [t.id, t.title]));
  useEffect(() => setShown(STEP), [rows]);
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const watch = new IntersectionObserver((entries) => entries[0].isIntersecting && setShown((n) => n + STEP), { rootMargin: "300px" });
    watch.observe(node);
    return () => watch.disconnect();
  }, [shown, rows]);
  const chips = activeChips(filters, bank, topicTitle, bookNames);
  return <div className="qp-results">
    <label className="qp-search"><Search size={18} strokeWidth={1.5} aria-hidden />
      <input type="search" value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search questions, answers and references" aria-label="Search the questions" />
      {filters.search && <button type="button" onClick={() => update({ search: "" })} aria-label="Clear the search"><X size={16} aria-hidden /></button>}
    </label>
    <div className="qp-results-head">
      <p><strong>{rows.length.toLocaleString()}</strong> {rows.length === 1 ? "question" : "questions"}</p>
      {chips.map(([label, patch]) => <button key={label} type="button" className="qp-chip" onClick={() => update(patch)}>{label}<X size={12} aria-label="remove" /></button>)}
      {isFiltered(filters) && <button type="button" className="qp-clear" onClick={clear}>Clear all</button>}
    </div>
    <PillScroll key={JSON.stringify(filters)} className="qp-list-viewport" label="Questions">
      {rows.length ? <ol className="qp-list">{rows.slice(0, shown).map((index, i) =>
        <QuestionRow key={index} n={i + 1} q={bank.questions[index]} terms={terms} testMode={testMode} bookNames={bookNames}
          meta={[bank.kinds[bank.questions[index].kind], bank.questions[index].collection, bank.questions[index].tradition, topicTitle[bank.questions[index].topic ?? ""]]} />)}</ol>
        : <p className="qp-empty">No questions match all of these. <button type="button" onClick={clear}>Clear the filters</button></p>}
      {shown < rows.length && <div ref={sentinel} className="qp-more">Loading more of {rows.length.toLocaleString()}…</div>}
    </PillScroll>
  </div>;
}

function activeChips(f: Filters, bank: QuestionBank, topicTitle: Record<string, string>, bookNames: Record<string, string>): [string, Partial<Filters>][] {
  const chips: [string, Partial<Filters>][] = [];
  if (f.kind) chips.push([bank.kinds[f.kind] ?? f.kind, { kind: "" }]);
  if (f.topic) chips.push([f.topic === "none" ? "Other questions" : topicTitle[f.topic] ?? f.topic, { topic: "" }]);
  if (f.testament) chips.push([f.testament === "OT" ? "Old Testament" : "New Testament", { testament: "" }]);
  if (f.book) chips.push([bookNames[f.book] ?? f.book, { book: "" }]);
  if (f.collection) chips.push([f.collection, { collection: "" }]);
  if (f.choices) chips.push(["Multiple choice", { choices: false }]);
  return chips;
}

interface RowProps { n: number; q: BankQuestion; terms: string[]; testMode: boolean; bookNames: Record<string, string>; meta: (string | null | undefined)[] }

function QuestionRow({ n, q, terms, testMode, bookNames, meta }: RowProps) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [whole, setWhole] = useState(false);
  const hidden = testMode && !revealed;
  const folded = !whole && q.answer.length > LONG_ANSWER;
  return <li className="qp-q" style={{ "--tone": kindTone(q.kind) } as CSSProperties}>
    <span className="qp-q-n">{n}</span>
    <div className="qp-q-body">
      {q.lesson && <p className="qp-q-lesson">{q.lesson}</p>}
      <p className="qp-q-text"><Highlight text={q.question} terms={terms} /></p>
      {q.options ? <ol className="qp-q-options">{q.options.map((option, i) => {
        const settled = !testMode || picked;
        const state = settled && option === q.answer ? "is-answer" : picked === option ? "is-wrong" : "";
        return <li key={option}><button type="button" className={state} disabled={!testMode || Boolean(picked)} onClick={() => setPicked(option)}>
          <span className="qp-letter">{LETTERS[i]}</span><Highlight text={option} terms={terms} />
        </button></li>;
      })}</ol>
        : hidden ? <button type="button" className="qp-reveal" onClick={() => setRevealed(true)}><Eye size={15} strokeWidth={1.6} aria-hidden />Show the answer</button>
        : <div className="qp-q-answer"><p className={folded ? "is-folded" : undefined}><Highlight text={q.answer} terms={terms} /></p>
          {folded && <button type="button" onClick={() => setWhole(true)}>Read the whole answer</button>}</div>}
      <p className="qp-q-meta">{meta.filter(Boolean).map((m) => <span key={m}>{m}</span>)}<ReadLink q={q} bookNames={bookNames} /></p>
    </div>
  </li>;
}
