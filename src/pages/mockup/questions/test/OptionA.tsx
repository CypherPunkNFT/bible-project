// Whole-page option A of the test page, the self-test page in full (owner, 2026-10-22: "this needs to be a whole
// page… the self-test page in all of its glory"). The test is what was chosen on the questions page, a theme or a book
// and chapter, which carries it in the address; choosing them here as well was dropped (owner, 2026-10-23: "merge the
// test setup mockup with the new test page… consolidate"). A short top (a title, one line), 01 the setup bar (`Bar`, one
// of the four in SetupBars.tsx), then, under a gold rule, 02 on the dusk band with the as-is question panel and its
// wheel. Finished tests are kept in this browser's record, which the questions page's theme cards show.
import { ArrowLeft } from "lucide-react";
import { useRef, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { SectionHead } from "../shared";
import { DustField } from "./DustField";
import { scoreOf } from "./engine";
import type { OptionProps } from "./host";
import { TestArea } from "./host";
import { QuestionPanel } from "./QuestionPanel";
import { useRecord } from "./record";
import type { SetupBarProps } from "./SetupBars";
import { themeById } from "./themes";

export function BackLink({ to }: { to: string }) {
  return <Link className="tp-back" to={to}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>;
}

export function OptionA({ Bar, ...props }: OptionProps & { Bar: ComponentType<SetupBarProps> }) {
  const { bank, facets, filters, active, items, round, bookNames, chapter } = props;
  const { save } = useRecord();
  const theme = themeById(props.theme);
  const band = useRef<HTMLDivElement>(null);
  const toTest = () => band.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const what = theme?.title ?? (filters.book ? `${bookNames[filters.book] ?? filters.book}${chapter ? `, chapter ${chapter}` : ""}` : "The whole Bible");
  return <>
    <div className="tp-wrap">
      <header className="ts-head">
        <BackLink to={props.backTo} />
        <h1>Test <em>yourself</em></h1>
        <p>One question at a time, and every answer opens the verse it comes from.</p>
      </header>
      <section className="qp-section" aria-labelledby="ts-setup-title">
        <SectionHead n="01" id="ts-setup-title" title={<>Set up <em>your test</em></>}
          lead="Your test is the theme or book you chose on the questions page. Choose how many questions, then begin." />
        <Bar what={what} changeTo={props.backTo} available={facets.rows.length} length={props.length} setLength={props.setLength} redraw={props.redraw} onBegin={toTest} />
      </section>
    </div>
    <div className="tp-dusk oc-band" ref={band}>
      {active && <DustField />}
      <div className="tp-wrap">
        <SectionHead n="02" id="oc-test-title" title={theme ? <>{theme.title}</> : <>Answer <em>them</em></>}
          lead={theme ? theme.line : "One question at a time. Choose an option, or think of the answer and then look."} />
        {items.length > 0 && <TestArea key={round} items={items} active={active} bank={bank} bookNames={bookNames} View={QuestionPanel}
          onResults={(results) => save(props.theme || "own", scoreOf(results), results.length)} />}
        {!facets.rows.length && <p className="ts-empty">No questions match. Go back to the questions and choose another theme or book.</p>}
      </div>
    </div>
  </>;
}
