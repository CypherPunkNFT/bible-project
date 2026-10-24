// The self-test page in full (owner, 2026-10-22: "this needs to be a whole page… the self-test page in all of its
// glory"). The test is what was chosen on the questions page, a theme or a book and chapter, which carries it in the
// address, with how many questions. A short top (a title, one line), then, under a gold rule, the dusk band with the
// as-is question panel and its wheel. The setup section and the four mock-up options were dropped (owner, 2026-10-23;
// archived in ARCHIVE/mockups/). Finished tests are kept in this browser's record, which the questions page's theme
// cards show.
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionHead } from "../shared";
import { DustField } from "./DustField";
import { scoreOf } from "./engine";
import type { OptionProps } from "./host";
import { TestArea } from "./host";
import { QuestionPanel } from "./QuestionPanel";
import { useRecord } from "./record";
import { themeById } from "./themes";

export function BackLink({ to }: { to: string }) {
  return <Link className="tp-back" to={to}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>;
}

export function TestPage(props: OptionProps) {
  const { bank, facets, active, items, round, bookNames } = props;
  const { save } = useRecord();
  const theme = themeById(props.theme);
  return <>
    <div className="tp-wrap">
      <header className="ts-head">
        <BackLink to={props.backTo} />
        <h1>Test <em>yourself</em></h1>
        <p>One question at a time, and every answer opens the verse it comes from.</p>
      </header>
    </div>
    <div className="tp-dusk oc-band">
      {active && <DustField />}
      <div className="tp-wrap">
        <SectionHead n="01" id="oc-test-title" title={theme ? <>{theme.title}</> : <>Answer <em>them</em></>}
          lead={theme ? theme.line : "One question at a time. Choose an option, or think of the answer and then look."} />
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel}
          onResults={(results) => save(props.theme || "own", scoreOf(results), results.length)} />}
        {!facets.rows.length && <p className="ts-empty">No questions match. Go back to the questions and choose another theme or book.</p>}
      </div>
    </div>
  </>;
}
