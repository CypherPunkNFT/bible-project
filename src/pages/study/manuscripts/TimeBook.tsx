// 01 "Through time · book by book" (owner, 2026-10-18; mock-up js/combos.js "timebook"): the timeline and the two book
// views under one title, with the pill (Through time | By book | How close) on the title's right, as on Teachers, and
// the chosen view's own description under the title. A view is drawn the first time it is chosen and then kept, so the
// timeline and the grids measure themselves at their real size.
import { useState, type ReactNode } from "react";
import { Books } from "./Books";
import { Closeness } from "./Closeness";
import { useMs } from "./context";
import { Lanes } from "./Lanes";
import { booksLead, closenessLead, lanesLead } from "./leads";
import type { MsIndex } from "./model";
import { MsPane, SectionHead } from "./parts";

const VIEWS: [string, string, (index: MsIndex) => string, () => ReactNode][] = [
  ["time", "Through time", lanesLead, () => <div className="ms-part ms-part-lanes"><Lanes /></div>],
  ["hold", "By book", booksLead, () => <div className="ms-part ms-part-books"><Books /></div>],
  ["close", "How close", closenessLead, () => <div className="ms-part ms-part-closeness"><Closeness /></div>],
];

export function TimeBook({ num }: { num: string }) {
  const { index } = useMs();
  const [view, setView] = useState("time");
  const [seen, setSeen] = useState(() => new Set(["time"]));
  const choose = (key: string) => { setView(key); setSeen((s) => (s.has(key) ? s : new Set([...s, key]))); };
  const lead = VIEWS.find((v) => v[0] === view)?.[2](index) ?? "";
  return <>
    <div className="ms-headrow"><SectionHead num={num} kicker="Through time · book by book" title={<>Every dated copy, <em>by time and by book</em></>} />
      <div className="ms-headpill"><div className="ct-sort ms-switch" role="tablist" aria-label="Through time or book by book">{VIEWS.map(([key, name]) =>
        <button key={key} type="button" role="tab" aria-checked={key === view} aria-selected={key === view} onClick={() => choose(key)}>{name}</button>)}</div></div></div>
    <p className="ms-sublead" aria-live="polite">{lead}</p>
    <div className="ms-stage">{VIEWS.filter(([key]) => seen.has(key)).map(([key, name, , make]) =>
      <div key={key} className="ms-pane" hidden={key !== view}><MsPane name={name}>{make()}</MsPane></div>)}</div>
  </>;
}
