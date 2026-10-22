// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// The page can come in several whole-page options, swapped by a pill floating at the bottom of the screen; for now
// there is one, the house style with the as-is answer panel (owner, 2026-10-22), and the pill shows once there are
// variations. Every option shows the same drawn questions and the same settings; each keeps its own test, results and
// place on the page, and only the one showing answers the keyboard. The chosen option is kept in the address
// (?option=), and a chosen chapter of the chosen book as ?ch=. The parts live in questions/test/.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { DEFAULT_LENGTH, LENGTHS, chaptersOf, drawTest, type Item, type TestQuestion } from "./questions/test/engine";
import { OptionPill } from "./questions/test/OptionPill";
import { OPTIONS } from "./questions/test/options-list";
import "./questions-page.css";
import "./test-page.css";
import "./test-stage.css";
import "./test-options.css";

export default function QuestionsTestPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  if (failed) return <p className="tp-status" role="alert">The questions could not be loaded: {failed}</p>;
  if (!bank) return <p className="tp-status">Loading the questions…</p>;
  return <TestBody bank={bank} />;
}

function TestBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const asked = Number(params.get("n"));
  const length = (LENGTHS as readonly number[]).includes(asked) ? asked : DEFAULT_LENGTH;
  const option = OPTIONS.some((o) => o.id === params.get("option")) ? params.get("option")! : OPTIONS[0].id;
  // Only questions that read well on their own: a test has no lesson around it.
  const pool = useMemo(() => bank.questions.filter((q) => q.standalone) as TestQuestion[], [bank]);
  const haystacks = useMemo(() => pool.map(haystackOf), [pool]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const filterKey = writeFilters(filters).toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for
  const bookFacets = useMemo(() => facetsOf(pool, haystacks, filters), [pool, haystacks, filterKey]);
  // A chapter narrows the chosen book's questions to the ones that point to it; the book chart keeps the whole book.
  const askedChapter = Number(params.get("ch"));
  const chapter = filters.book && askedChapter > 0 ? askedChapter : null;
  const facets = useMemo(() => (chapter
    ? facetsOf(pool, haystacks, filters, (i) => chaptersOf(pool[i], filters.book).includes(chapter))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for
    : bookFacets), [bookFacets, chapter, pool, haystacks, filterKey]);
  // One draw for every option; a new one whenever the settings change, or on "Draw again".
  const [draw, setDraw] = useState<{ items: Item[]; round: number }>({ items: [], round: 0 });
  const redraw = () => setDraw((d) => ({ items: drawTest(pool, facets.rows, length), round: d.round + 1 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length]);

  const write = (next: Filters, n: number, shown: string, ch = next.book === filters.book ? chapter : null) => {
    const out = writeFilters(next);
    if (n !== DEFAULT_LENGTH) out.set("n", String(n));
    if (ch) out.set("ch", String(ch));
    if (shown !== OPTIONS[0].id) out.set("option", shown);
    setParams(out, { replace: true, preventScrollReset: true });
  };
  // Each option keeps its own place on the page: leaving one remembers where it was, coming back returns there.
  const places = useRef<Record<string, number>>({});
  const choose = (id: string) => { places.current[option] = window.scrollY; write(filters, length, id); };
  useLayoutEffect(() => { window.scrollTo({ top: places.current[option] ?? 0 }); }, [option]);

  const shared = {
    bank, pool, facets, filters, length, bookNames, items: draw.items, round: draw.round, redraw,
    bookFacets, chapter, setChapter: (ch: number | null) => write(filters, length, option, ch),
    update: (patch: Partial<Filters>) => write({ ...filters, ...patch }, length, option),
    setLength: (n: number) => write(filters, n, option),
    backTo: `/study/questions${filterKey ? `?${filterKey}` : ""}`,
  };
  return <div className="tp">
    {OPTIONS.map(({ id, name, Page }) => <section key={id} className={`to-option to-option--${id}`} hidden={id !== option} aria-label={`Option ${id.toUpperCase()}: ${name}`}>
      <Page {...shared} active={id === option} />
    </section>)}
    {OPTIONS.length > 1 && <OptionPill options={OPTIONS} current={option} onChoose={choose} />}
  </div>;
}
