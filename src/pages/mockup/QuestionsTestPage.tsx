// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// Three screens: set the test (kind, topic, book, Testament, length), take it one question at a time, and the results
// with every missed question to go over. Four looks of the same test sit behind the bar at the top so the owner can
// try each and choose (owner, 2026-10-22: "give that real care and real thought"); switching keeps your place. The
// choices live in the address, so the way back returns to the same filters. The parts live in questions/test/.
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { DustField } from "./questions/test/DustField";
import { DEFAULT_LENGTH, LENGTHS, drawTest, useRun, type Item, type Result, type TestQuestion } from "./questions/test/engine";
import { LOOKS, type Look } from "./questions/test/looks-list";
import { useTestKeys } from "./questions/test/controls";
import { TestResults } from "./questions/test/TestResults";
import { TestSetup } from "./questions/test/TestSetup";
import "./questions-page.css";
import "./test-page.css";
import "./test-looks.css";

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

type Phase = { step: "setup" } | { step: "test"; items: Item[]; round: number } | { step: "results"; items: Item[]; results: Result[] };

function TestBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const look = LOOKS.find((l) => l.id === params.get("look")) ?? LOOKS[0];
  const asked = Number(params.get("n"));
  const length = (LENGTHS as readonly number[]).includes(asked) ? asked : DEFAULT_LENGTH;
  // Only questions that read well on their own: a test has no lesson around it.
  const pool = useMemo(() => bank.questions.filter((q) => q.standalone) as TestQuestion[], [bank]);
  const haystacks = useMemo(() => pool.map(haystackOf), [pool]);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  const filterKey = writeFilters(filters).toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for
  const facets = useMemo(() => facetsOf(pool, haystacks, filters), [pool, haystacks, filterKey]);
  const [phase, setPhase] = useState<Phase>({ step: "setup" });
  // Braces matter: newer browsers return a promise from scrollTo, which React would take for a cleanup.
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase.step]);

  const write = (next: Filters, extras: Record<string, string>) => {
    const out = writeFilters(next);
    for (const [k, v] of Object.entries({ look: params.get("look") ?? "", n: params.get("n") ?? "", ...extras })) if (v) out.set(k, v);
    setParams(out, { replace: true, preventScrollReset: true });
  };
  const update = (patch: Partial<Filters>) => write({ ...filters, ...patch }, {});
  const backTo = `/study/questions${filterKey ? `?${filterKey}` : ""}`;
  const begin = (items: Item[]) => setPhase({ step: "test", items, round: Date.now() });

  return <div className={`tp tp--${look.id}`}>
    <LookBar current={look} onChoose={(id) => write(filters, { look: id })} />
    <div className="tp-wrap tp-top">
      <Link className="tp-back" to={backTo}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
      {phase.step === "test" && <button type="button" className="tp-leave" onClick={() => setPhase({ step: "setup" })}>Leave this test</button>}
    </div>
    <div className="tp-area">
      {look.id === "stage" && <DustField />}
      <div className="tp-wrap tp-area-inner">
        {phase.step === "setup" && <TestSetup bank={bank} pool={pool} facets={facets} filters={filters} update={update}
          length={length} setLength={(n) => write(filters, { n: String(n) })} onBegin={() => begin(drawTest(pool, facets.rows, length))} />}
        {phase.step === "test" && <TestRun key={phase.round} items={phase.items} look={look} bookNames={bookNames} kinds={bank.kinds}
          onFinish={(results) => setPhase({ step: "results", items: phase.items, results })} />}
        {phase.step === "results" && <TestResults items={phase.items} results={phase.results} topics={bank.topics} bookNames={bookNames}
          backTo={backTo} onRetake={begin} onNew={() => setPhase({ step: "setup" })} />}
      </div>
    </div>
  </div>;
}

function TestRun({ items, look, bookNames, kinds, onFinish }: { items: Item[]; look: Look; bookNames: Record<string, string>; kinds: Record<string, string>; onFinish: (results: Result[]) => void }) {
  const run = useRun(items, onFinish);
  useTestKeys(run);
  return <look.Look run={run} bookNames={bookNames} kinds={kinds} />;
}

/** Mock-up only: the four looks, to try and choose from. */
function LookBar({ current, onChoose }: { current: Look; onChoose: (id: string) => void }) {
  return <div className="tp-lookbar" role="group" aria-label="Four looks to choose from">
    <div className="tp-wrap">
      <span className="tp-lookbar-label">Mock-up · four looks</span>
      <div className="tp-lookbar-options">{LOOKS.map((l, i) => <button key={l.id} type="button" aria-pressed={l.id === current.id} onClick={() => onChoose(l.id)}>
        <span>{i + 1}</span>{l.name}
      </button>)}</div>
      <p>{current.note}</p>
    </div>
  </div>;
}
