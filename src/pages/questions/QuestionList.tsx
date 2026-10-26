// 03's results: the count and the chosen filters (ResultsBar, just above the list's top line, owner 2026-10-23/24), the one eye
// beside the search, and the questions in a scroll pane (with
// the pill-only scrollbar the owner chose for result lists), loading more as the pane reaches its end.
import { Eye, EyeOff, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import PillScroll from "@/components/apologetics/PillScroll";
import { rightChoice, type BankQuestion, type QuestionBank } from "@/lib/data";
import { DIFFICULTIES, kindTone, LETTERS, searchTerms, type Filters } from "./model";
import { Highlight, ReadLink } from "./shared";

const STEP = 40;
// Longer answers (whole catechism paragraphs) fold to a few lines until asked for.
const LONG_ANSWER = 260;

/** The search, shown at the right of 03's heading (owner, 2026-10-22). */
export function SearchField({ search, update }: { search: string; update: (patch: Partial<Filters>) => void }) {
  return <label className="qp-search"><Search size={17} strokeWidth={1.5} aria-hidden />
    <input type="search" value={search} onChange={(e) => update({ search: e.target.value })} placeholder="Search questions, answers and references" aria-label="Search the questions" />
    {search && <button type="button" onClick={() => update({ search: "" })} aria-label="Clear the search"><X size={16} aria-hidden /></button>}
  </label>;
}

/** How many questions at the left; at the far right, each choice as a gold rounded-square chip that removes it, then
 *  Clear all in grey (owner, 2026-10-24, replacing the choices in words after the count). */
export function ResultsBar({ count, chips, remove, clear }: { count: number; chips: Chosen[]; remove: (key: Chosen["key"]) => void; clear: () => void }) {
  return <div className="qp-results-head">
    <p><strong>{count.toLocaleString()}</strong> {count === 1 ? "question" : "questions"}</p>
    {chips.length > 0 && <div className="qp-chips" aria-label="Chosen filters">
      {chips.map((chip) => <button key={chip.key} type="button" className="qp-chip" aria-label={`Remove ${chip.label}`} onClick={() => remove(chip.key)}>
        {chip.label}<X size={12} strokeWidth={2.2} aria-hidden /></button>)}
      <button type="button" className="qp-chip qp-chip-clear" onClick={clear}>Clear all</button>
    </div>}
  </div>;
}

/** One button that hides or shows every answer, at the right of the search (owner, 2026-10-22: one icon, on or off). */
export function EyeToggle({ testMode, setTestMode }: { testMode: boolean; setTestMode: (on: boolean) => void }) {
  const label = testMode ? "Show the answers" : "Hide the answers and test yourself";
  return <button type="button" className="qp-eye" aria-pressed={!testMode} aria-label={label} title={label} onClick={() => setTestMode(!testMode)}>
    {testMode ? <EyeOff size={18} strokeWidth={1.6} aria-hidden /> : <Eye size={18} strokeWidth={1.6} aria-hidden />}
  </button>;
}

/** One thing the list is narrowed to: which filter (or the theme), and it in words. */
export interface Chosen { key: keyof Filters | "theme"; label: string }

/** What the list is narrowed to: the theme or book, then the rail's choices and the search. */
export function choiceInWords(f: Filters, bank: QuestionBank, bookNames: Record<string, string>, themeTitle?: string): Chosen[] {
  const topic = f.topic === "none" ? "Other questions" : bank.topics.find((t) => t.id === f.topic)?.title;
  const parts: [Chosen["key"], string | false | undefined][] = [["theme", themeTitle], ["book", f.book && (bookNames[f.book] ?? f.book)], ["topic", f.topic && topic],
    ["testament", f.testament && (f.testament === "OT" ? "Old Testament" : "New Testament")], ["collection", f.collection],
    ["difficulty", f.difficulty && DIFFICULTIES.find(([id]) => id === f.difficulty)?.[1]], ["choices", f.choices && "Multiple choice only"],
    ["search", f.search.trim() && `“${f.search.trim()}”`]];
  return parts.flatMap(([key, label]) => (label ? [{ key, label }] : []));
}

interface Props { bank: QuestionBank; rows: number[]; filters: Filters; clear: () => void; testMode: boolean; bookNames: Record<string, string>; bar: ReactNode }

export function QuestionList({ bank, rows, filters, clear, testMode, bookNames, bar }: Props) {
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
  return <div className="qp-results">
    {bar}
    <PillScroll key={JSON.stringify(filters)} className="qp-list-viewport" label="Questions">
      {rows.length ? <ol className="qp-list">{rows.slice(0, shown).map((index, i) =>
        <QuestionRow key={index} n={i + 1} q={bank.questions[index]} terms={terms} testMode={testMode} bookNames={bookNames}
          meta={[bank.kinds[bank.questions[index].kind], bank.questions[index].collection, bank.questions[index].tradition, topicTitle[bank.questions[index].topic ?? ""]]} />)}</ol>
        : <p className="qp-empty">No questions match all of these. <button type="button" onClick={clear}>Clear the filters</button></p>}
      {shown < rows.length && <div ref={sentinel} className="qp-more">Loading more of {rows.length.toLocaleString()}…</div>}
    </PillScroll>
  </div>;
}

interface RowProps { n: number; q: BankQuestion; terms: string[]; testMode: boolean; bookNames: Record<string, string>; meta: (string | null | undefined)[] }

function QuestionRow({ n, q, terms, testMode, bookNames, meta }: RowProps) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [whole, setWhole] = useState(false);
  const hidden = testMode && !revealed;
  const folded = !whole && q.answer.length > LONG_ANSWER;
  // A long answer's choice is a short version of it; the whole printed answer follows once the right one shows.
  const settled = !testMode || Boolean(picked);
  const fullAnswer = <div className="qp-q-answer"><p className={folded ? "is-folded" : undefined}><Highlight text={q.answer} terms={terms} /></p>
    {folded && <button type="button" onClick={() => setWhole(true)}>Read the whole answer</button>}</div>;
  return <li className="qp-q" style={{ "--tone": kindTone(q.kind) } as CSSProperties}>
    <span className="qp-q-n">{n}</span>
    <div className="qp-q-body">
      {q.lesson && <p className="qp-q-lesson">{q.lesson}</p>}
      {q.lead_in && <p className="qp-q-lead"><span>First</span><Highlight text={q.lead_in.question} terms={terms} /> <em>{q.lead_in.answer}</em></p>}
      <p className="qp-q-text"><Highlight text={q.question} terms={terms} /></p>
      {q.options ? <><ol className="qp-q-options">{q.options.map((option, i) => {
        const state = settled && option === rightChoice(q) ? "is-answer" : picked === option ? "is-wrong" : "";
        return <li key={option}><button type="button" className={state} disabled={!testMode || Boolean(picked)} onClick={() => setPicked(option)}>
          {/* One span: the button lays out its children with a gap, which split highlighted words ("An ything"). */}
          <span className="qp-letter">{LETTERS[i]}</span><span><Highlight text={option} terms={terms} /></span>
        </button></li>;
      })}</ol>{settled && rightChoice(q) !== q.answer && fullAnswer}</>
        : hidden ? <button type="button" className="qp-reveal" onClick={() => setRevealed(true)}><Eye size={15} strokeWidth={1.6} aria-hidden />Show the answer</button>
        : fullAnswer}
      <p className="qp-q-meta">{meta.filter(Boolean).map((m) => <span key={m}>{m}</span>)}<ReadLink q={q} bookNames={bookNames} /></p>
    </div>
  </li>;
}
