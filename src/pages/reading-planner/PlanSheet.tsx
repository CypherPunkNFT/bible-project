// The printed plan (design 5): every day, not just the rows drawn on screen, as a compact table with a tick box each, in
// two columns. Printed through the life-event print module (print-sheet.css hides the rest of the page).
import type { DayRow } from "./DayList";

interface PlanSheetProps {
  title: string;
  span: string;
  facts: readonly { label: string; value: string }[];
  rows: readonly DayRow[];
}

export function PlanSheet({ title, span, facts, rows }: PlanSheetProps) {
  return (
    <div className="rps-sheet">
      <h1>{title}</h1>
      <p className="rps-span">{span}</p>
      <dl className="rps-facts">
        {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
      </dl>
      <ol className="rps-rows">
        {rows.map((row) => (
          <li key={row.n}>
            <span className="rps-box" aria-hidden="true" />
            <span className="rps-date">{row.date}</span>
            <span className="rps-reading">{row.label}</span>
            <span className="rps-time">{row.time}</span>
          </li>
        ))}
      </ol>
      <p className="rps-foot">Bible Guide · bibleguide.io/reading-planner</p>
    </div>
  );
}
