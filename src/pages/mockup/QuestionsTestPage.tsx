// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// The settings sit at the top (kind, topic, book, Testament, length; they open with the questions page's filters), and
// below them the same questions in four looks, one under another, so the owner can take the test in each and choose
// (owner, 2026-10-22: "I want to be able to see the same set of questions with the different look"). Each look runs
// its own test and shows its own results; the keyboard answers in the look nearest the middle of the screen. The
// parts live in questions/test/.
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { useTestKeys } from "./questions/test/controls";
import { DustField } from "./questions/test/DustField";
import { DEFAULT_LENGTH, LENGTHS, drawTest, useRun, type Item, type Result, type TestQuestion } from "./questions/test/engine";
import { LOOKS, type Look } from "./questions/test/looks-list";
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

interface Shared { bank: QuestionBank; bookNames: Record<string, string> }

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
  // One draw for all four looks; a new one whenever the settings change, or on the button.
  const [draw, setDraw] = useState<{ items: Item[]; round: number }>({ items: [], round: 0 });
  const redraw = () => setDraw((d) => ({ items: drawTest(pool, facets.rows, length), round: d.round + 1 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length]);
  const active = useActiveLook(draw.round);

  const write = (next: Filters, n: number) => {
    const out = writeFilters(next);
    if (n !== DEFAULT_LENGTH) out.set("n", String(n));
    setParams(out, { replace: true, preventScrollReset: true });
  };
  return <div className="tp">
    <div className="tp-wrap tp-top">
      <Link className="tp-back" to={`/study/questions${filterKey ? `?${filterKey}` : ""}`}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
    </div>
    <div className="tp-wrap tp-area-inner">
      <TestSetup bank={bank} pool={pool} facets={facets} filters={filters} update={(patch) => write({ ...filters, ...patch }, length)}
        length={length} setLength={(n) => write(filters, n)} onBegin={redraw} actionLabel="Draw new questions" />
    </div>
    <nav className="tp-wrap tp-looknav" aria-label="The four looks">
      <span>Mock-up · the same questions in four looks</span>
      {LOOKS.map((l, i) => <a key={l.id} href={`#look-${l.id}`}><b>{i + 1}</b>{l.name}</a>)}
    </nav>
    {draw.items.length > 0 && LOOKS.map((look, i) => <LookSection key={`${look.id}-${draw.round}`} n={i + 1} look={look} items={draw.items}
      active={active === look.id} bank={bank} bookNames={bookNames} />)}
  </div>;
}

/** The look whose section crosses the middle of the screen: the one the keyboard answers in. */
function useActiveLook(round: number) {
  const [active, setActive] = useState(LOOKS[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit) setActive(hit.target.id.replace("look-", ""));
    }, { rootMargin: "-50% 0px -50% 0px" });
    // A new draw mounts new sections; look for them once they are on the page.
    const frame = requestAnimationFrame(() => document.querySelectorAll(".tp-look").forEach((el) => observer.observe(el)));
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [round]);
  return active;
}

type Stage = { step: "test"; items: Item[]; round: number } | { step: "results"; items: Item[]; results: Result[] };

function LookSection({ n, look, items, active, bank, bookNames }: Shared & { n: number; look: Look; items: Item[]; active: boolean }) {
  const [stage, setStage] = useState<Stage>({ step: "test", items, round: 0 });
  const [rounds, setRounds] = useState(0);
  const start = (list: Item[]) => { setRounds((r) => r + 1); setStage({ step: "test", items: list, round: rounds + 1 }); };
  return <section className={`tp-look tp-look--${look.id}`} id={`look-${look.id}`} aria-label={`Look ${n}: ${look.name}`}>
    <div className="tp-wrap tp-look-label"><span>Look {n}</span><strong>{look.name}</strong><p>{look.note}</p></div>
    <div className="tp-area">
      {look.id === "stage" && <DustField />}
      <div className="tp-wrap tp-area-inner">
        {stage.step === "test"
          ? <TestRun key={stage.round} items={stage.items} look={look} active={active} bookNames={bookNames} kinds={bank.kinds}
            onFinish={(results) => setStage({ step: "results", items: stage.items, results })} />
          : <TestResults items={stage.items} results={stage.results} topics={bank.topics} bookNames={bookNames}
            onRetake={start} onNew={() => start(items)} />}
      </div>
    </div>
  </section>;
}

function TestRun({ items, look, active, bookNames, kinds, onFinish }: { items: Item[]; look: Look; active: boolean; bookNames: Record<string, string>; kinds: Record<string, string>; onFinish: (results: Result[]) => void }) {
  const run = useRun(items, onFinish);
  useTestKeys(run, active);
  return <look.Look run={run} bookNames={bookNames} kinds={kinds} />;
}
