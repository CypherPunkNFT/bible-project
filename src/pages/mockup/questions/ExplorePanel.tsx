// A section's own list of questions, opened right under it (questions_mockup, owner 2026-10-23: "by-book and by-theme are
// not compatible for exploration… an expandable explore the questions for each section"). It holds one book's or one
// theme's questions with its own search, the eye, a way into the test page set to the same choice, and a close button.
// Styles: questions-panels.css.
import { ArrowRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { facetsOf, type Filters } from "./model";
import { EyeToggle, QuestionList, ResultsBar, SearchField } from "./QuestionList";

interface Props {
  id: string;
  bank: QuestionBank;
  haystacks: string[];
  bookNames: Record<string, string>;
  /** What the panel is about, shown as its heading ("Genesis", "David"), and the line under it. */
  title: string;
  line: string;
  /** The filters that make the panel's set (a book), and any further test (a theme). */
  base: Filters;
  keep?: (index: number) => boolean;
  testMode: boolean;
  setTestMode: (on: boolean) => void;
  testHref: string;
  onClose: () => void;
}

export function ExplorePanel({ id, bank, haystacks, bookNames, title, line, base, keep, testMode, setTestMode, testHref, onClose }: Props) {
  const [search, setSearch] = useState("");
  const filters = { ...base, search };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `base` and `keep` change only with the panel's key
  const rows = useMemo(() => facetsOf(bank.questions, haystacks, filters, keep).rows, [bank, haystacks, search]);
  return <div className="qx-panel" id={id} role="region" aria-labelledby={`${id}-title`}>
    <div className="qx-panel-head">
      <div>
        <p className="qp-eyebrow"><span aria-hidden />Explore</p>
        <h3 id={`${id}-title`}>{title}</h3>
        <p className="qx-line">{line}</p>
      </div>
      <div className="qx-panel-tools">
        <div className="qp-find"><SearchField search={search} update={(patch) => setSearch(patch.search ?? "")} /><EyeToggle testMode={testMode} setTestMode={setTestMode} /></div>
        <Link className="qx-panel-test" to={testHref}>Take a test on {title}<ArrowRight size={15} strokeWidth={1.7} aria-hidden /></Link>
        <button type="button" className="qx-close" onClick={onClose} aria-label={`Close ${title}`} title="Close"><X size={18} strokeWidth={1.7} aria-hidden /></button>
      </div>
    </div>
    <QuestionList bank={bank} rows={rows} filters={filters} clear={() => setSearch("")} testMode={testMode} bookNames={bookNames}
      bar={<ResultsBar count={rows.length} filtered={Boolean(search)} clear={() => setSearch("")} />} />
  </div>;
}
