import { StanzaPage } from "./StanzaPager.shared";
// Section 01 kept to one screen (owner, 2026-10-18): the hymn's stanzas a page at a time, never splitting a stanza, with a
// dot per page and left and right arrows. The arrow keys turn the page while the section is in use. A hymn short enough
// for one page shows no pager.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { ROMAN } from "../song/parts.shared";

const label = (p: StanzaPage) => (p.first === p.last ? `Stanza ${ROMAN[p.first] ?? p.first + 1}` : `Stanzas ${ROMAN[p.first] ?? p.first + 1}–${ROMAN[p.last] ?? p.last + 1}`);
/** The pager's place line, one whole phrase: "Stanzas I–III of VII". */
const placeOf = (p: StanzaPage, last: number) => { const all = ROMAN[last] ?? last + 1;
  return p.first === p.last ? `Stanza ${ROMAN[p.first] ?? p.first + 1} of ${all}` : `Stanzas ${ROMAN[p.first] ?? p.first + 1}–${ROMAN[p.last] ?? p.last + 1} of ${all}`; };

/** `summary`: said after the page's place, e.g. "29 echoes". */
export function StanzaPager({ pages, summary, children }: { pages: StanzaPage[]; summary?: string; children: (page: StanzaPage, at: number) => ReactNode }) {
  const [at, setAt] = useState(0);
  const go = useCallback((n: number) => setAt(Math.max(0, Math.min(pages.length - 1, n))), [pages.length]);

  if (pages.length === 1) return <>{children(pages[0], 0)}</>;
  const page = pages[at];
  return <div className="hf-pager" onKeyDown={(e) => {
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
  }}>
    {/* Every page is laid out in the same cell, only the current one visible, so the block is always as tall as the
        tallest page and stays still from the first page to the last (owner, 2026-10-18). */}
    <div className="hf-pager-body">{pages.map((p, i) =>
      <div key={p.first} className={`hf-page${i === at ? " on" : ""}`} aria-hidden={i !== at}
        ref={(el) => { if (el) el.inert = i !== at; }}>{children(p, i)}</div>)}</div>
    <nav className="hf-pager-nav" aria-label="Pages of the hymn">
      <button type="button" className="hf-arrow" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Earlier stanzas"><ChevronLeft size={18} strokeWidth={1.5} aria-hidden /></button>
      <div className="hf-dots">{pages.map((p, i) =>
        <button key={p.first} type="button" className={i === at ? "on" : undefined} aria-label={label(p)} aria-current={i === at ? "true" : undefined} onClick={() => go(i)} />)}</div>
      <button type="button" className="hf-arrow" onClick={() => go(at + 1)} disabled={at === pages.length - 1} aria-label="Later stanzas"><ChevronRight size={18} strokeWidth={1.5} aria-hidden /></button>
      <span className="hf-where" aria-live="polite">{placeOf(page, pages[pages.length - 1].last)}{summary ? <small>{` · ${summary}`}</small> : null}</span>
    </nav>
  </div>;
}
