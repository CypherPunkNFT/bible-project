// MOCK-UP: the questions page, opened at /study/questions on this computer's preview only (see mockup-routes.tsx) until
// the owner approves it. Deliberately undesigned for now (owner 2026-10-22): a plain table of every question in the
// Question Bank (content/questions/question-bank.json, built by scripts/build-question-bank.py) with its answer,
// filtered by kind and collection, and the credit every source asks for underneath.
import { useEffect, useMemo, useState } from "react";
import { loadQuestionBank, type BankQuestion, type QuestionBank } from "@/lib/data";
import "./questions-page.css";

const PAGE_SIZE = 100;

export default function QuestionsPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [kind, setKind] = useState("all");
  const [collection, setCollection] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);

  const collections = useMemo(() => (bank?.collections ?? []).filter((c) => kind === "all" || c.kind === kind), [bank, kind]);
  const rows = useMemo(() => (bank?.questions ?? []).filter((q) => (kind === "all" || q.kind === kind) && (collection === "all" || q.collection === collection)), [bank, kind, collection]);

  const chooseKind = (next: string) => { setKind(next); setCollection("all"); setShown(PAGE_SIZE); };
  const chooseCollection = (next: string) => { setCollection(next); setShown(PAGE_SIZE); };

  return <div className="questions-page">
    <header>
      <p className="questions-eyebrow">Study · Questions</p>
      <h1>Questions &amp; answers</h1>
      <p>Every question in the site's question bank, with the answer its source printed. Answers are as published and are still to be checked.</p>
    </header>
    {failed && <p role="alert">The questions could not be loaded: {failed}</p>}
    {!bank && !failed && <p>Loading the questions…</p>}
    {bank && <>
      <div className="questions-filters">
        <label>Kind <select value={kind} onChange={(e) => chooseKind(e.target.value)}>
          <option value="all">All kinds ({bank.questions.length.toLocaleString()})</option>
          {Object.entries(bank.kinds).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <label>Collection <select value={collection} onChange={(e) => chooseCollection(e.target.value)}>
          <option value="all">All collections</option>
          {collections.map((c) => <option key={c.title} value={c.title}>{c.title}{c.tradition ? ` · ${c.tradition}` : ""} ({c.count.toLocaleString()})</option>)}
        </select></label>
        <span>{rows.length.toLocaleString()} questions</span>
      </div>
      <div className="questions-table-wrap">
        <table className="questions-table">
          <thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Reference</th><th>Collection</th></tr></thead>
          <tbody>{rows.slice(0, shown).map((q, i) => <Row key={i} n={i + 1} q={q} kinds={bank.kinds} />)}</tbody>
        </table>
      </div>
      {shown < rows.length && <button type="button" className="questions-more" onClick={() => setShown(shown + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, rows.length - shown)} more of {(rows.length - shown).toLocaleString()} left</button>}
      <section className="questions-credits" aria-labelledby="questions-credits-title">
        <h2 id="questions-credits-title">Where these questions come from</h2>
        <ul>{bank.collections.map((c) => <li key={c.title}><strong>{c.title}</strong>{c.tradition && ` (${c.tradition})`}. {c.credit}{c.source_url && <> <a href={c.source_url} target="_blank" rel="noreferrer">Source</a></>}</li>)}</ul>
      </section>
    </>}
  </div>;
}

function Row({ n, q, kinds }: { n: number; q: BankQuestion; kinds: Record<string, string> }) {
  return <tr>
    <td>{n}</td>
    <td>{q.lesson && <small>{q.lesson}</small>}{q.question}</td>
    <td>{q.options
      ? <ol className="questions-options">{q.options.map((option) => <li key={option} className={option === q.answer ? "is-answer" : undefined}>{option}</li>)}</ol>
      : q.answer}</td>
    <td>{q.reference ?? ""}</td>
    <td>{q.collection}<small>{kinds[q.kind]}{q.tradition ? ` · ${q.tradition}` : ""}</small></td>
  </tr>;
}
