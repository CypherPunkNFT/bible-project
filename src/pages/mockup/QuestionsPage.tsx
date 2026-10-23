// The questions page, /study/questions (a live route, App.tsx): every question in the Question Bank
// (content/questions/question-bank.json, built by scripts/build-question-bank.py). Approved by the owner on 2026-10-23
// from the mock-up at /questions_mockup, which shows this same file until the next change is tried there; the page it
// replaced is in ARCHIVE/mockups/QuestionsPage-2026-10-23.tsx. The owner: "by-book and by-theme are not compatible for
// exploration… we need an expandable explore the questions for each section." So each section opens its own list right under it: a book chosen
// in 01 opens that book's questions under the book grid, a theme chosen in 02 opens that theme's under the shelves, each
// with its own search, the eye, a test set to the same choice and a close button (questions/ExplorePanel.tsx). The two
// stay open together and never filter each other. 03 holds every question with its own rail, closed until asked for
// (open at once when the address already carries its filters).
// 03's side rail is ListRail.tsx (owner, same day): drawers by the book and by theme.
// 01 here is BookRing.tsx (owner, same day): one row of tiles per colour, long sections split in two, and the hymns
// page's ring of 66 spokes at the right.
import { ArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { BookRing } from "./questions/BookRing";
import { ExplorePanel } from "./questions/ExplorePanel";
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
    {bank && <PanelsBody bank={bank} />}
  </div>;
}

function PanelsBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const [testMode, setTestMode] = useState(true);
  const { record } = useRecord();
  const questions = bank.questions as TestQuestion[];
  const haystacks = useMemo(() => bank.questions.map(haystackOf), [bank]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const book = params.get("book") ?? "";
  const theme = themeById(params.get("theme") ?? "");
  // 03's own filters; the book belongs to 01's panel, not to the whole list.
  const filters: Filters = { ...readFilters(params), book: "" };
  const key = params.toString();
  const members = useMemo(() => new Map(THEMES.map((t) => [t.id, new Set(questions.flatMap((q, i) => (inTheme(t, q) ? [i] : [])))])), [questions]);
  const [listChoice, setListChoice] = useState<ListChoice>({ book: "", theme: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `key` stands for
  const all = useMemo(() => listFacets(bank, haystacks, filters, listChoice, members), [bank, haystacks, key, listChoice, members]);
  const bookCounts = useMemo(() => facetsOf(bank.questions, haystacks, NONE).counts.book, [bank, haystacks]);
  const themeCounts = useMemo(() => new Map([...members].map(([id, set]) => [id, set.size])), [members]);
  const [allOpen, setAllOpen] = useState(() => isFiltered(filters));

  const keepChoices = (out: URLSearchParams) => {
    if (book) out.set("book", book);
    if (theme) out.set("theme", theme.id);
    return out;
  };
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const update = (patch: Partial<Filters>) => setParams(keepChoices(writeFilters({ ...filters, ...patch })), { replace: true, preventScrollReset: true });
  const clear = () => { setListChoice({ book: "", theme: "" }); setParams(keepChoices(new URLSearchParams()), { replace: true, preventScrollReset: true }); };
  const listFiltered = isFiltered(filters) || Boolean(listChoice.book || listChoice.theme);
  // A panel opens under its section and comes into view once the page has redrawn.
  const reveal = (id: string) => window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  const chosen = choiceInWords({ ...filters, book: listChoice.book }, bank, bookNames, themeById(listChoice.theme)?.title);
  const panel = { bank, haystacks, bookNames, testMode, setTestMode };

  return <>
    <QuestionsHero />
    <StatsBar bank={bank} />
    <BookRing books={bank.books} counts={bookCounts} selected={book} onChoose={(code) => { setParam("book", code); if (code) reveal("qx-book"); }} />
    {book && <ExplorePanel key={book} id="qx-book" {...panel} title={bookNames[book] ?? book}
      line={`Every question tied to ${bookNames[book] ?? book}, by its reference or by naming it.`}
      base={{ ...NONE, book }} testHref={`/study/questions/test?book=${book}`} onClose={() => setParam("book", "")} />}
    <section className="qp-section" aria-labelledby="qp-themes-title">
      <SectionHead n="02" id="qp-themes-title" title={<>Choose a <em>theme</em></>}
        lead="Questions gathered by what they are about, the same themes as the test page. Choose a shelf, then a group, then a theme." />
      <ThemeShelves counts={themeCounts} selected={theme?.id ?? ""} record={record} onChoose={(id) => { setParam("theme", id); if (id) reveal("qx-theme"); }} />
      {theme && <div className="qx-after-shelves"><ExplorePanel key={theme.id} id="qx-theme" {...panel} title={theme.title} line={theme.line}
        base={NONE} keep={(i) => inTheme(theme, questions[i])} testHref={`/study/questions/test?theme=${theme.id}`} onClose={() => setParam("theme", "")} /></div>}
    </section>
    <TestBanner bank={bank} filters={NONE} theme={null} available={bank.questions.length} bookNames={bookNames} />
    <section className="qp-section qp-explore" id="qp-explore" aria-labelledby="qp-explore-title">
      <SectionHead n="03" id="qp-explore-title" title={<>Every <em>question</em></>}
        lead={chosen.length ? `Showing ${chosen.join(" · ")}.` : `All ${bank.questions.length.toLocaleString()} in one list, by topic, Testament or collection, or search for a word.`}
        aside={allOpen
          ? <div className="qp-find"><SearchField search={filters.search} update={update} /><EyeToggle testMode={testMode} setTestMode={setTestMode} /></div>
          : <button type="button" className="qx-open" onClick={() => setAllOpen(true)}>Open the list<ArrowDown size={15} strokeWidth={1.7} aria-hidden /></button>} />
      {allOpen && <div className="qp-explore-grid">
        <ListRail bank={bank} facets={all} filters={filters} choice={listChoice} members={members} update={update} choose={(patch) => setListChoice((now) => ({ ...now, ...patch }))} />
        <QuestionList bank={bank} rows={all.rows} filters={filters} clear={clear} testMode={testMode} bookNames={bookNames}
          bar={<ResultsBar count={all.rows.length} filtered={listFiltered} clear={clear} />} />
      </div>}
    </section>
    <details className="qp-sources">
      <summary>Sources · {bank.collections.length} collections</summary>
      <p>Answers are as each source printed them and are still to be checked. Books, Testament and topic are set by fixed word lists and the references, so a question may sit under a near topic.</p>
      <ul>{bank.collections.map((c) => <li key={c.title}><strong>{c.title}</strong>{c.tradition && ` (${c.tradition})`}. {c.credit}{c.source_url && <> <a href={c.source_url} target="_blank" rel="noreferrer">Source</a></>}</li>)}</ul>
    </details>
  </>;
}
