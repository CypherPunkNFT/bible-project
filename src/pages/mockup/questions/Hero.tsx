// The questions page's header: the title and the bank's figures, and beside them one question to answer straight away.
import { Check, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { rightChoice, type BankQuestion, type QuestionBank } from "@/lib/data";
import { LETTERS } from "./model";
import { ReadLink } from "./shared";

export function QuestionsHero({ bank, bookNames }: { bank: QuestionBank; bookNames: Record<string, string> }) {
  const stats: [number, string][] = [
    [bank.questions.length, "questions"],
    [bank.questions.filter((q) => q.options).length, "multiple choice"],
    [new Set(bank.questions.flatMap((q) => q.books)).size, "books of the Bible"],
    [bank.collections.length, "collections"],
  ];
  return <header className="qp-hero">
    <div className="qp-hero-copy">
      <p className="qp-eyebrow"><span aria-hidden />Study · Questions</p>
      <h1>How well do you know <em>the Bible?</em></h1>
      <p className="qp-lead">Questions asked in Sunday schools, catechism classes and Bible quizzes, from a children's catechism of 1692 to quizzes written this year, each with the answer its source printed.</p>
      <dl className="qp-stats">{stats.map(([n, label]) => <div key={label}><dt>{label}</dt><dd>{n.toLocaleString()}</dd></div>)}</dl>
    </div>
    <TryOne questions={bank.questions} bookNames={bookNames} />
  </header>;
}

// The panel keeps one height for every question (owner 2026-10-22: no jumpy containers); the type size changes
// instead. Longer questions and choices take a smaller step.
const questionSize = (text: string) => (text.length <= 50 ? "is-xl" : text.length <= 85 ? "is-lg" : text.length <= 110 ? "is-md" : "is-sm");
const optionSize = (options: string[]) => (Math.max(...options.map((o) => o.length)) <= 26 ? "" : "is-small");

// Multiple-choice questions that read well on their own and fit the panel.
const fits = (q: BankQuestion) => Boolean(q.options && q.options.length >= 3 && q.options.length <= 4 && q.standalone
  && q.question.length <= 130 && q.options.every((o) => o.length <= 42));

function TryOne({ questions, bookNames }: { questions: BankQuestion[]; bookNames: Record<string, string> }) {
  const pool = useMemo(() => questions.filter(fits), [questions]);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * pool.length));
  const [picked, setPicked] = useState<string | null>(null);
  const [tally, setTally] = useState({ asked: 0, right: 0 });
  const q = pool[index];
  if (!q?.options) return null;
  const pick = (option: string) => {
    setPicked(option);
    setTally((t) => ({ asked: t.asked + 1, right: t.right + (option === rightChoice(q) ? 1 : 0) }));
  };
  const next = () => { setPicked(null); setIndex((i) => (i + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length); };
  const state = (option: string) => !picked ? "" : option === rightChoice(q) ? "is-right" : option === picked ? "is-wrong" : "is-dim";
  return <aside className="qp-try" aria-labelledby="qp-try-title">
    <span className="qp-try-mark" aria-hidden>?</span>
    <div className="qp-try-head"><span id="qp-try-title">Try one</span><span>{tally.asked ? `${tally.right} of ${tally.asked} right` : q.collection}</span></div>
    <p className={`qp-try-question ${questionSize(q.question)}`}>{q.question}</p>
    <ol className={`qp-try-options ${optionSize(q.options)}`}>{q.options.map((option, i) => <li key={option}>
      <button type="button" className={state(option)} disabled={Boolean(picked)} onClick={() => pick(option)}>
        <span className="qp-letter">{LETTERS[i]}</span><span>{option}</span>{picked && option === rightChoice(q) && <Check size={16} aria-hidden />}
      </button>
    </li>)}{Array.from({ length: 4 - q.options.length }, (_, i) => <li key={`blank${i}`} className="qp-try-blank" aria-hidden />)}</ol>
    <div className="qp-try-foot">
      <p aria-live="polite">{!picked ? "Choose an answer." : picked === rightChoice(q) ? <>Right. <ReadLink q={q} bookNames={bookNames} /></> : <>Not quite: it is <strong>{q.answer}</strong>. <ReadLink q={q} bookNames={bookNames} /></>}</p>
      <button type="button" onClick={next}><Shuffle size={15} strokeWidth={1.6} aria-hidden />Another question</button>
    </div>
  </aside>;
}
