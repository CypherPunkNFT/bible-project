// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// The settings in the site's own style (kind, topic, book, Testament, length; they open with the questions page's
// filters), and under them the test on a dark dusk band (warm light from the bottom right, blue from the top left,
// slow floating dust). Only the test is dark (owner, 2026-10-22: "It's only the question section that should be like
// this"). The owner chose the band and the score wheel from four looks the same day; the question section now comes
// in four versions, one under another on the same questions, to compare ("make alternatives… be creative"). Each
// runs its own test and shows its own results; the keyboard answers in the one nearest the middle of the screen.
// The parts live in questions/test/.
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "./questions/model";
import { useTestKeys } from "./questions/test/controls";
import { DustField } from "./questions/test/DustField";
import { DEFAULT_LENGTH, LENGTHS, drawTest, useRun, type Item, type Result, type TestQuestion } from "./questions/test/engine";
import { TestResults } from "./questions/test/TestResults";
import { TestSetup } from "./questions/test/TestSetup";
import { VARIANTS, type Variant } from "./questions/test/variants-list";
import "./questions-page.css";
import "./test-page.css";
import "./test-stage.css";
import "./test-variants.css";

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
  // One draw for every version; a new one whenever the settings change, or on the button.
  const [draw, setDraw] = useState<{ items: Item[]; round: number }>({ items: [], round: 0 });
  const redraw = () => setDraw((d) => ({ items: drawTest(pool, facets.rows, length), round: d.round + 1 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length]);
  const active = useActiveVariant(draw.round);

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
        length={length} setLength={(n) => write(filters, n)} onBegin={redraw} actionLabel="Draw again" />
    </div>
    <nav className="tp-wrap tv-nav" aria-label="Four versions of the question section">
      <span>Mock-up · the same questions in four versions</span>
      {VARIANTS.map((v, i) => <a key={v.id} href={`#variant-${v.id}`}><b>{i + 1}</b>{v.name}</a>)}
    </nav>
    {draw.items.length > 0 && VARIANTS.map((variant, i) => <VariantSection key={`${variant.id}-${draw.round}`} n={i + 1} variant={variant}
      items={draw.items} active={active === variant.id} bank={bank} bookNames={bookNames} />)}
  </div>;
}

/** The version whose band crosses the middle of the screen: the one the keyboard answers in. */
function useActiveVariant(round: number) {
  const [active, setActive] = useState(VARIANTS[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit) setActive(hit.target.id.replace("variant-", ""));
    }, { rootMargin: "-50% 0px -50% 0px" });
    // A new draw mounts new sections; look for them once they are on the page.
    const frame = requestAnimationFrame(() => document.querySelectorAll(".tv-section").forEach((el) => observer.observe(el)));
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [round]);
  return active;
}

type Stage = { step: "test"; items: Item[] } | { step: "results"; items: Item[]; results: Result[] };

function VariantSection({ n, variant, items, active, bank, bookNames }: Shared & { n: number; variant: Variant; items: Item[]; active: boolean }) {
  const [stage, setStage] = useState<Stage>({ step: "test", items });
  const [round, setRound] = useState(0);
  const start = (list: Item[]) => { setRound((r) => r + 1); setStage({ step: "test", items: list }); };
  return <section className={`tv-section tv-section--${variant.id}`} id={`variant-${variant.id}`} aria-label={`Version ${n}: ${variant.name}`}>
    <div className="tp-wrap tv-label"><span>Version {n}</span><strong>{variant.name}</strong><p>{variant.note}</p></div>
    <div className="tp-dusk">
      <DustField />
      <div className="tp-wrap">
        {stage.step === "test"
          ? <TestRun key={round} items={stage.items} variant={variant} active={active} bookNames={bookNames} kinds={bank.kinds}
            onFinish={(results) => setStage({ step: "results", items: stage.items, results })} />
          : <TestResults items={stage.items} results={stage.results} topics={bank.topics} bookNames={bookNames}
            onRetake={start} onNew={() => start(items)} />}
      </div>
    </div>
  </section>;
}

function TestRun({ items, variant, active, bookNames, kinds, onFinish }: { items: Item[]; variant: Variant; active: boolean; bookNames: Record<string, string>; kinds: Record<string, string>; onFinish: (results: Result[]) => void }) {
  const run = useRun(items, onFinish);
  useTestKeys(run, active);
  return <variant.View run={run} bookNames={bookNames} kinds={kinds} />;
}
