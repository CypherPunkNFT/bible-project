// MOCK-UP: the theme menu of the test and questions pages (section 01, "Choose a theme") in three versions, at
// /themes_mockup on this computer's preview only (owner, 2026-10-23). A is the menu as it is (ThemeShelves.tsx); B puts
// its three rows in one bordered box sharing their borders, like the apologetics pages' two-row menu; C folds each
// opened level into a side column (questions/test/ThemeColumns.tsx). A pill at the bottom swaps them; the version is
// kept in the address (?v=b). Styles: themes-mockup.css.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { SectionHead } from "./questions/shared";
import type { TestQuestion } from "./questions/test/engine";
import { useRecord } from "./questions/test/record";
import { ThemeColumns } from "./questions/test/ThemeColumns";
import { ThemeShelves } from "./questions/test/ThemeShelves";
import { inTheme, THEMES } from "./questions/test/themes";
import "./questions-page.css";
import "./test-options.css";
import "./themes-mockup.css";

const VERSIONS = [
  { id: "a", name: "As it is" },
  { id: "b", name: "One box" },
  { id: "c", name: "Side columns" },
];

export default function ThemesMockupPage() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  if (failed) return <p className="qp qp-status" role="alert">The questions could not be loaded: {failed}</p>;
  if (!bank) return <p className="qp qp-status">Loading the questions…</p>;
  return <ThemesBody bank={bank} />;
}

function ThemesBody({ bank }: { bank: QuestionBank }) {
  const [params, setParams] = useSearchParams();
  const version = VERSIONS.some((v) => v.id === params.get("v")) ? params.get("v")! : "a";
  const [selected, setSelected] = useState("");
  const { record } = useRecord();
  const counts = useMemo(() => {
    const questions = bank.questions as TestQuestion[];
    return new Map(THEMES.map((t) => [t.id, questions.filter((q) => inTheme(t, q)).length]));
  }, [bank]);
  const menu = { counts, selected, onChoose: setSelected, record };
  return <>
    <div className="qp tm">
      <section className="qp-section" aria-labelledby="tm-title">
        <SectionHead n="01" id="tm-title" title={<>Choose a <em>theme</em></>}
          lead="Choose a shelf, then a group, then a test." />
        {version === "c" ? <ThemeColumns key="c" {...menu} /> : <ThemeShelves key={version} boxed={version === "b"} {...menu} />}
      </section>
    </div>
    <nav className="to-pill" aria-label="Mock-up: three versions of the theme menu">
      <span className="to-pill-label">Mock-up</span>
      {VERSIONS.map((v) => <button key={v.id} type="button" aria-pressed={v.id === version} onClick={() => setParams({ v: v.id }, { replace: true })}>
        <b>{v.id.toUpperCase()}</b><span>{v.name}</span>
      </button>)}
    </nav>
  </>;
}
