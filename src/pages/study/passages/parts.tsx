// The passage study's small shared pieces (mock-up js/parts-base.js): source links, the record button, section heads,
// "How an editor reasons" with its three icons, and the round switch.
import type { PointerEvent, ReactNode } from "react";
import { useMs } from "../manuscripts/context";
import { reasoning, sources, type CaseId, type Source, type SourceId } from "./evidence";
import { Rich } from "./Rich";

/** Source links: words with a small arrow, never boxes. */
export function Cite({ ids, extra = [] }: { ids: readonly SourceId[]; extra?: readonly Source[] }) {
  const list: Source[] = [...extra, ...ids.map((id) => sources[id])];
  return <p className="pm-cites">{list.map((s) => <a key={s.url + s.label} href={s.url} target="_blank" rel="noopener noreferrer">
    {s.label}<span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>)}</p>;
}

/** A button that opens a manuscript's record sheet (only for witnesses with an open record; the page's click handler opens it). */
export function RecButton({ rec, label = "Open the record" }: { rec?: string; label?: string }) {
  const { index } = useMs();
  if (!rec || !index.byId.has(rec)) return null;
  return <button type="button" className="pm-rec" data-open={rec}>{label}<span aria-hidden="true">→</span></button>;
}

/** "05 · KICKER / serif title with one italic accent / one plain line": the number rides on the label line. */
export function Head({ num, kicker, title, lead }: { num?: string; kicker: string; title: string; lead?: ReactNode }) {
  return <header className="pm-head">
    <p className="kicker">{num && <><span className="ms-num">{num}</span><span className="ms-dot" aria-hidden="true">·</span></>}{kicker}</p>
    <h2><Rich text={title} /></h2>{lead && <p className="pm-lead">{lead}</p>}
  </header>;
}

const REASON_ICONS = {
  reveal: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="M8 11h6M11 8v6" /></>,
  reason: <><path d="M12 3v18M5 21h14" /><path d="M3 7h18" /><path d="m6 7-3 7a3 3 0 0 0 6 0z" /><path d="m18 7-3 7a3 3 0 0 0 6 0z" /></>,
  certain: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 18 4-5" /><circle cx="12" cy="18" r="1" /></>,
};
function Step({ icon, title, body, limit = false, children }: { icon: keyof typeof REASON_ICONS; title: string; body: string; limit?: boolean; children?: ReactNode }) {
  return <div className={`pm-reason-step${limit ? " is-limit" : ""}`}>
    <span className="pm-reason-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{REASON_ICONS[icon]}</svg></span>
    <div><h4>{title}</h4><p>{body}</p>{children}</div>
  </div>;
}
/** Observation, judgment and limit as three statements, each with its own icon (no boxes, no connecting thread). */
export function Reasoning({ caseId }: { caseId: CaseId }) {
  const a = reasoning[caseId];
  return <div className="pm-reason">
    <Step icon="reveal" title="What the comparison reveals" body={a.observation} />
    <Step icon="reason" title="How an editor reasons" body={a.judgment} />
    <Step icon="certain" title="How certain is this?" body={a.limit} limit><Cite ids={a.links} /></Step>
  </div>;
}

/** "Show supplied letters": the round switch. */
export function Switch({ checked, onChange, className = "", children, ...pointer }: {
  checked: boolean; onChange: (on: boolean) => void; className?: string; children: ReactNode;
  onPointerEnter?: (e: PointerEvent) => void; onPointerLeave?: (e: PointerEvent) => void;
}) {
  return <label className={`pm-switch ${className}`} {...pointer}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span />{children}
  </label>;
}
