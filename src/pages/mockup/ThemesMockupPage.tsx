// MOCK-UP: the theme menu of the test and questions pages (section 01, "Choose a theme") in three versions, at
// /themes_mockup on this computer's preview only (owner, 2026-10-23): A as it is, B in one bordered box, C an accordion
// (questions/test/ThemeMenu.tsx draws all three). A pill at the bottom swaps them in place, keeping what is open; the
// version is kept in the address (?v=b). Styles: themes-mockup.css.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { SectionHead } from "./questions/shared";
import type { TestQuestion } from "./questions/test/engine";
import { useRecord } from "./questions/test/record";
import { ThemeMenu, type MenuVersion } from "./questions/test/ThemeMenu";
import { inTheme, THEMES } from "./questions/test/themes";
import "./questions-page.css";
import "./test-options.css";
import "./themes-mockup.css";

const VERSIONS: { id: MenuVersion; name: string }[] = [
  { id: "a", name: "As it is" },
  { id: "b", name: "One box" },
  { id: "c", name: "Accordion" },
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
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "a";
  const [selected, setSelected] = useState("");
  const { record } = useRecord();
  const counts = useMemo(() => {
    const questions = bank.questions as TestQuestion[];
    return new Map(THEMES.map((t) => [t.id, questions.filter((q) => inTheme(t, q)).length]));
  }, [bank]);
  return <>
    <div className="qp tm">
      <section className="qp-section" aria-labelledby="tm-title">
        <SectionHead n="01" id="tm-title" title={<>Choose a <em>theme</em></>}
          lead="Choose a shelf, then a group, then a test." />
        <ThemeMenu version={version} counts={counts} selected={selected} onChoose={setSelected} record={record} />
      </section>
    </div>
    <nav className="to-pill" aria-label="Mock-up: three versions of the theme menu">
      <span className="to-pill-label">Mock-up</span>
      {VERSIONS.map((v) => <button key={v.id} type="button" aria-pressed={v.id === version} onClick={() => setParams({ v: v.id }, { replace: true, preventScrollReset: true })}>
        <b>{v.id.toUpperCase()}</b><span>{v.name}</span>
      </button>)}
    </nav>
  </>;
}
