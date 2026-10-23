// The questions page, /study/questions (a live route, App.tsx): every question in the Question Bank
// (content/questions/question-bank.json, built by scripts/build-question-bank.py). The mock-up at /questions_mockup
// shows this same file until the next change is tried there; the version before this one is in
// ARCHIVE/mockups/QuestionsPage-2026-10-23b.tsx. The owner, 2026-10-23: "I don't like the expanding section… take
// those away… when you click a theme endpoint or a chapter, shouldn't it go down there? And shouldn't that be open…
// ready to test yourself at the bottom." So 01 (BookRing.tsx) and 02 (ThemeShelves.tsx) open nothing in place:
// choosing a book or a test sets 03's list to it (a book drops the theme and a theme the book, as on the test page;
// 03's rail, ListRail.tsx, can then join the two) and carries the reader down to 03, which is always open. The test
// banner follows the list and is set to whatever it shows. The choice is kept in the address (?book=, ?theme=), the
// same address the test page's "Back to the questions" link writes.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { BookRing } from "./questions/BookRing";
import { listFacets, ListRail, type ListChoice } from "./questions/ListRail";
import { QuestionsHero, StatsBar } from "./questions/Hero";
import { facetsOf, haystackOf, isFiltered, readFilters, writeFilters, type Filters } from "./questions/model";
import { choiceInWords, EyeToggle, QuestionList, ResultsBar, SearchField } from "./questions/QuestionList";
import { SectionHead } from "./questions/shared";
import { TestBanner } from "./questions/TestBanner";
import type { TestQuestion } from "./questions/test/engine";
import { useRecord } from "./questions/test/record";
import { ThemeShelves } from "./questions/test/ThemeShelves";
import { inTheme, THEMES, themeById } from "./questions/test/themes";
import "./questions-page.css";
import "./questions/questions-panels.css";

const NONE: Filters = readFilters(new URLSearchParams());

export default function QuestionsPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  return <div className="qp">
    {failed && <p className="qp-status" role="alert">The questions could not be loaded: {failed}</p>}
    {!bank && !failed && <p className="qp-status">Loading the questions…</p>}
    {bank && <ListBody bank={bank} />}
  </div>;
}

function ListBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const [testMode, setTestMode] = useState(true);
  const { record } = useRecord();
  const questions = bank.questions as TestQuestion[];
  const haystacks = useMemo(() => bank.questions.map(haystackOf), [bank]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const filters = readFilters(params);
  const theme = themeById(params.get("theme") ?? "");
  const choice: ListChoice = { book: filters.book, theme: theme?.id ?? "" };
  const key = params.toString();
  const members = useMemo(() => new Map(THEMES.map((t) => [t.id, new Set(questions.flatMap((q, i) => (inTheme(t, q) ? [i] : [])))])), [questions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters and choice are read from params, which `key` stands for
  const all = useMemo(() => listFacets(bank, haystacks, filters, choice, members), [bank, haystacks, key, members]);
  const bookCounts = useMemo(() => facetsOf(bank.questions, haystacks, NONE).counts.book, [bank, haystacks]);
  const themeCounts = useMemo(() => new Map([...members].map(([id, set]) => [id, set.size])), [members]);

  const write = (next: Filters, themeId: string) => {
    const out = writeFilters(next);
    if (themeId) out.set("theme", themeId);
    setParams(out, { replace: true, preventScrollReset: true });
  };
  const update = (patch: Partial<Filters>) => write({ ...filters, ...patch }, choice.theme);
  const choose = (patch: Partial<ListChoice>) => write({ ...filters, book: patch.book ?? filters.book }, patch.theme ?? choice.theme);
  const clear = () => write(NONE, "");
  // 03 comes into view once the page has redrawn with the new choice.
  const reveal = () => window.setTimeout(() => document.getElementById("qp-explore")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  const chosen = choiceInWords(filters, bank, bookNames, theme?.title);

  return <>
    <QuestionsHero />
    <StatsBar bank={bank} />
    <BookRing books={bank.books} counts={bookCounts} selected={choice.book}
      onChoose={(code) => { write({ ...filters, book: code }, ""); if (code) reveal(); }} />
    <section className="qp-section" aria-labelledby="qp-themes-title">
      <SectionHead n="02" id="qp-themes-title" title={<>Or choose a <em>theme</em></>}
        lead="Questions gathered by what they are about, the same themes as the test page. Choose a shelf, then a group, then a theme." />
      <ThemeShelves counts={themeCounts} selected={choice.theme} record={record}
        onChoose={(id) => { write({ ...filters, book: "" }, id); if (id) reveal(); }} />
    </section>
    <section className="qp-section qp-explore" id="qp-explore" aria-labelledby="qp-explore-title">
      <SectionHead n="03" id="qp-explore-title" title={<>Every <em>question</em></>}
        lead={chosen.length ? "Every question in one list, by book or theme, or search for a word." : `All ${bank.questions.length.toLocaleString()} in one list, by book or theme, or search for a word.`}
        aside={<div className="qp-find"><SearchField search={filters.search} update={update} /><EyeToggle testMode={testMode} setTestMode={setTestMode} /></div>} />
      <div className="qp-explore-grid">
        <ListRail bank={bank} facets={all} filters={filters} choice={choice} members={members} update={update} choose={choose} />
        <QuestionList bank={bank} rows={all.rows} filters={filters} clear={clear} testMode={testMode} bookNames={bookNames}
          bar={<ResultsBar count={all.rows.length} filtered={isFiltered(filters) || Boolean(choice.theme)} clear={clear} chosen={chosen.join(" · ")} />} />
      </div>
    </section>
    <TestBanner bank={bank} filters={filters} theme={theme} bookNames={bookNames} />
    <details className="qp-sources">
      <summary>Sources · {bank.collections.length} collections</summary>
      <p>Answers are as each source printed them and are still to be checked. Books, Testament and topic are set by fixed word lists and the references, so a question may sit under a near topic.</p>
      <ul>{bank.collections.map((c) => <li key={c.title}><strong>{c.title}</strong>{c.tradition && ` (${c.tradition})`}. {c.credit}{c.source_url && <> <a href={c.source_url} target="_blank" rel="noreferrer">Source</a></>}</li>)}</ul>
    </details>
  </>;
}
