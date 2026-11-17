import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";
import type { Citation, Claim, Span } from "@/data/letters/types";
import { formatNumber } from "@/lib/site-format";
import { WindowedRows } from "@/components/WindowedRows";

/** Citation number (1-based, in the order of the file's sources list) by id, for the superscript markers. */
const CitationIndex = createContext<Map<string, number>>(new Map());

export function CitationProvider({ citations, children }: { citations: Citation[]; children: ReactNode }) {
  const index = useMemo(() => new Map(citations.map((c, i) => [c.id, i + 1])), [citations]);
  return <CitationIndex.Provider value={index}>{children}</CitationIndex.Provider>;
}

/** Verse links for a list of spans, e.g. "Hebrews 1:5 · Psalm 2:7". */
export function Refs({ refs, limit = 6 }: { refs?: Span[]; limit?: number }) {
  const catalog = useCatalog();
  if (!refs?.length) return null;
  // The same passage is listed once: callers often merge lists (a person's verses and the verses of the line joining
  // them), and a repeated passage gave two links one React key, so stale links piled up on every re-render.
  const unique = refs.filter((span, i) => refs.findIndex((other) => other[0] === span[0] && other[1] === span[1]) === i);
  const shown = unique.slice(0, limit);
  return <span className="lg-refs">
    {shown.map((span) => <Link key={span.join("-")} to={studyRefLink(catalog, span)}>{formatRange(catalog, span[0], span[1])}</Link>)}
    {unique.length > limit && <span className="lg-muted">{`+${formatNumber(unique.length - limit)} more`}</span>}
  </span>;
}

const spanKey = (span: Span) => span.join("-");

/** Every verse of a long list (a word's verses) as links in rows, drawn a window of rows at a time as the reader
 *  scrolls: no "Show all" (owner's scroll rule, 2026-11-17). */
export function RefRows({ refs }: { refs: Span[] }) {
  const catalog = useCatalog();
  const unique = useMemo(() => refs.filter((span, i) => refs.findIndex((other) => other[0] === span[0] && other[1] === span[1]) === i), [refs]);
  return <WindowedRows className="lg-ref-rows" items={unique} itemKey={spanKey} estimate={24}
    renderItem={(span, row) => <Link key={spanKey(span)} data-row={row} to={studyRefLink(catalog, span)}>{formatRange(catalog, span[0], span[1])}</Link>} />;
}

/** The ✕ beside a kept chart item; pressing it lets the item go, so pointing browses again. */
export function KeepX({ onRelease }: { onRelease: () => void }) {
  return <button type="button" className="lg-keep-x" onClick={onRelease} aria-label="Let go">✕</button>;
}

export function CiteMarks({ cites }: { cites?: string[] }) {
  const index = useContext(CitationIndex);
  if (!cites?.length) return null;
  return <>{cites.map((id) => index.has(id) && <a key={id} className="lg-cite" href={`#lg-source-${id}`} title="Source">[{index.get(id)}]</a>)}</>;
}

/** A sentence in our own words with its verses and its sources. */
export function ClaimText({ claim, as: As = "p", className }: { claim?: Claim; as?: "p" | "span" | "div"; className?: string }) {
  if (!claim?.text) return null;
  return <As className={`lg-claim ${className ?? ""}`}>{claim.text}<Refs refs={claim.refs} /><CiteMarks cites={claim.cites} /></As>;
}

export function Section({ kicker, title, lead, aside, children, id }: { kicker: string; title: string; lead?: ReactNode; aside?: ReactNode; children: ReactNode; id?: string }) {
  return <section id={id} className="lg-glass" aria-labelledby={id ? `${id}-title` : undefined}>
    <div className="lg-section-head"><div><p className="lg-kicker">{kicker}</p><h3 id={id ? `${id}-title` : undefined} className="lg-title">{title}</h3>{lead && <div className="lg-lead">{lead}</div>}</div>{aside}</div>
    {children}
  </section>;
}
