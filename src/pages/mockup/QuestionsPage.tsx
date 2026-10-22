// MOCK-UP: the questions page, opened at /study/questions on this computer's preview only (see mockup-routes.tsx) until
// the owner approves it. Every question in the Question Bank (content/questions/question-bank.json, built by
// scripts/build-question-bank.py): a header with one question to try, 01 the books of the Bible by how many questions
// each has, a banner into the test page, 02 the questions themselves with filters by kind, topic, Testament and
// collection, a search and an eye to hide or show the answers, and the credit every source asks for at the foot. The parts live in questions/.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { BookGrid } from "./questions/BookGrid";
import { FilterRail, KindChips } from "./questions/FilterRail";
import { QuestionsHero } from "./questions/Hero";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { QuestionList } from "./questions/QuestionList";
import { SectionHead } from "./questions/shared";
import { TestBanner } from "./questions/TestBanner";
import "./questions-page.css";

export default function QuestionsPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  return <div className="qp">
    {failed && <p className="qp-status" role="alert">The questions could not be loaded: {failed}</p>}
    {!bank && !failed && <p className="qp-status">Loading the questions…</p>}
    {bank && <QuestionsBody bank={bank} />}
  </div>;
}

function QuestionsBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const [testMode, setTestMode] = useState(false);
  const filters = readFilters(params);
  const haystacks = useMemo(() => bank.questions.map(haystackOf), [bank]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const key = params.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `key` stands for
  const facets = useMemo(() => facetsOf(bank.questions, haystacks, filters), [bank, haystacks, key]);
  const update = (patch: Partial<Filters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true, preventScrollReset: true });
  const clear = () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
  const chooseBook = (book: string) => {
    update({ book });
    if (book) document.getElementById("qp-explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <>
    <QuestionsHero bank={bank} bookNames={bookNames} />
    <BookGrid books={bank.books} counts={facets.counts.book} selected={filters.book} onChoose={chooseBook} />
    <TestBanner bank={bank} filters={filters} available={facets.rows.length} bookNames={bookNames} />
    <section className="qp-section qp-explore" id="qp-explore" aria-labelledby="qp-explore-title">
      <SectionHead n="02" id="qp-explore-title" title={<>Explore <em>the questions</em></>}
        lead="Choose a kind, a topic or a Testament, or search for a word. Hide the answers with the eye beside the count to test yourself." />
      <KindChips facets={facets} filters={filters} update={update} />
      <div className="qp-explore-grid">
        <FilterRail bank={bank} facets={facets} filters={filters} update={update} />
        <QuestionList bank={bank} rows={facets.rows} filters={filters} update={update} clear={clear} testMode={testMode} setTestMode={setTestMode} bookNames={bookNames} />
      </div>
    </section>
    <details className="qp-sources">
      <summary>Sources · {bank.collections.length} collections</summary>
      <p>Answers are as each source printed them and are still to be checked. Books, Testament and topic are set by fixed word lists and the references, so a question may sit under a near topic.</p>
      <ul>{bank.collections.map((c) => <li key={c.title}><strong>{c.title}</strong>{c.tradition && ` (${c.tradition})`}. {c.credit}{c.source_url && <> <a href={c.source_url} target="_blank" rel="noreferrer">Source</a></>}</li>)}</ul>
    </details>
  </>;
}
