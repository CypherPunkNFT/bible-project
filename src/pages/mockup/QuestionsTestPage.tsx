// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// One dark dusk field (warm light from the bottom right, blue from the top left, slow floating dust) holding the
// settings (kind, topic, book, Testament, length; they open with the questions page's filters) and, under them, the
// test itself: one question at a time in the Try one panel with the score ring beside it, then the results. The owner
// chose this from four looks on 2026-10-22: "I like the background of look 3, but I like the progress and
// gamification of look 4 with the wheel". The parts live in questions/test/.
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { useTestKeys } from "./questions/test/controls";
import { DustField } from "./questions/test/DustField";
import { DEFAULT_LENGTH, LENGTHS, drawTest, useRun, type Item, type Result, type TestQuestion } from "./questions/test/engine";
import { QuestionPanel } from "./questions/test/QuestionPanel";
import { TestResults } from "./questions/test/TestResults";
import { TestSetup } from "./questions/test/TestSetup";
import "./questions-page.css";
import "./test-page.css";
import "./test-stage.css";

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

type Stage = { step: "test"; items: Item[] } | { step: "results"; items: Item[]; results: Result[] };

function TestBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const asked = Number(params.get("n"));
  const length = (LENGTHS as readonly number[]).includes(asked) ? asked : DEFAULT_LENGTH;
  // Only questions that read well on their own: a test has no lesson around it.
  const pool = useMemo(() => bank.questions.filter((q) => q.standalone) as TestQuestion[], [bank]);
  const haystacks = useMemo(() => pool.map(haystackOf), [pool]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const filterKey = writeFilters(filters).toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for
  const facets = useMemo(() => facetsOf(pool, haystacks, filters), [pool, haystacks, filterKey]);

  // A new draw whenever the settings change, or on the button; "Take it again" and "Retake" reuse questions.
  const [stage, setStage] = useState<Stage>({ step: "test", items: [] });
  const [round, setRound] = useState(0);
  const [drawn, setDrawn] = useState<Item[]>([]);
  const start = (items: Item[]) => { setRound((r) => r + 1); setStage({ step: "test", items }); };
  const redraw = () => { const items = drawTest(pool, facets.rows, length); setDrawn(items); start(items); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length]);

  const write = (next: Filters, n: number) => {
    const out = writeFilters(next);
    if (n !== DEFAULT_LENGTH) out.set("n", String(n));
    setParams(out, { replace: true, preventScrollReset: true });
  };
  const toTest = () => document.getElementById("tp-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <div className="tp tp-dusk">
    <DustField />
    <div className="tp-wrap tp-top">
      <Link className="tp-back" to={`/study/questions${filterKey ? `?${filterKey}` : ""}`}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
    </div>
    <div className="tp-wrap tp-area-inner">
      <TestSetup bank={bank} pool={pool} facets={facets} filters={filters} update={(patch) => write({ ...filters, ...patch }, length)}
        length={length} setLength={(n) => write(filters, n)} onBegin={() => { redraw(); toTest(); }} actionLabel="Draw again" />
    </div>
    <div className="tp-wrap tp-area-inner tp-test" id="tp-test">
      {stage.step === "test"
        ? stage.items.length > 0 && <TestRun key={round} items={stage.items} bookNames={bookNames} kinds={bank.kinds}
          onFinish={(results) => setStage({ step: "results", items: stage.items, results })} />
        : <TestResults items={stage.items} results={stage.results} topics={bank.topics} bookNames={bookNames}
          onRetake={(items) => { start(items); toTest(); }} onNew={() => { start(drawn); toTest(); }} />}
    </div>
  </div>;
}

function TestRun({ items, bookNames, kinds, onFinish }: { items: Item[]; bookNames: Record<string, string>; kinds: Record<string, string>; onFinish: (results: Result[]) => void }) {
  const run = useRun(items, onFinish);
  useTestKeys(run);
  return <QuestionPanel run={run} bookNames={bookNames} kinds={kinds} />;
}
