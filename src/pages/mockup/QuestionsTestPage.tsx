// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// The page can come in several whole-page options, swapped by a pill floating at the bottom of the screen; for now
// there is one, the house style with the as-is answer panel (owner, 2026-10-22), and the pill shows once there are
// variations. Every option shows the same drawn questions and the same settings; each keeps its own test, results and
// place on the page, and only the one showing answers the keyboard. The chosen option is kept in the address
// (?option=) with everything else chosen (questions/test/selection.ts). The parts live in questions/test/.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { OptionPill } from "./questions/test/OptionPill";
import { OPTIONS } from "./questions/test/options-list";
import { useSelection } from "./questions/test/selection";
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
  const { option, setOption, ...chosen } = useSelection(bank, OPTIONS.map((o) => o.id));
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  // Each option keeps its own place on the page: leaving one remembers where it was, coming back returns there.
  const places = useRef<Record<string, number>>({});
  const choose = (id: string) => { places.current[option] = window.scrollY; setOption(id); };
  useLayoutEffect(() => { window.scrollTo({ top: places.current[option] ?? 0 }); }, [option]);
  return <div className="tp">
    {OPTIONS.map(({ id, name, Page }) => <section key={id} className={`to-option to-option--${id}`} hidden={id !== option} aria-label={`Option ${id.toUpperCase()}: ${name}`}>
      <Page {...chosen} bank={bank} bookNames={bookNames} active={id === option} />
    </section>)}
    {OPTIONS.length > 1 && <OptionPill options={OPTIONS} current={option} onChoose={choose} />}
  </div>;
}
