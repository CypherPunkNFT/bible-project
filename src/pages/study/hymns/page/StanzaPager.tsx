// Section 01 kept to one screen (owner, 2026-10-18): the hymn's stanzas a page at a time, never splitting a stanza, with a
// dot per page and left and right arrows. The arrow keys turn the page while the section is in use. A hymn short enough
// for one page shows no pager.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROMAN } from "../song/parts";

/** Lines a page holds before the next stanza starts a new one; a hymn this long or shorter is one page. */
const PAGE_LINES = 12, ONE_PAGE = 14;

export interface StanzaPage { first: number; last: number }

/** Whole stanzas, about PAGE_LINES lines a page. */
export function stanzaPages(stanzas: string[][]): StanzaPage[] {
  const total = stanzas.reduce((n, s) => n + s.length, 0);
  if (total <= ONE_PAGE) return [{ first: 0, last: stanzas.length - 1 }];
  const pages: StanzaPage[] = [];
  let first = 0, lines = 0;
  stanzas.forEach((stanza, s) => {
    if (lines > 0 && lines + stanza.length > PAGE_LINES) { pages.push({ first, last: s - 1 }); first = s; lines = 0; }
    lines += stanza.length;
  });
  pages.push({ first, last: stanzas.length - 1 });
  return pages;
}

const label = (p: StanzaPage) => (p.first === p.last ? `Stanza ${ROMAN[p.first] ?? p.first + 1}` : `Stanzas ${ROMAN[p.first] ?? p.first + 1}–${ROMAN[p.last] ?? p.last + 1}`);

/** `summary`: said after the page's place, e.g. "29 echoes". */
export function StanzaPager({ pages, summary, children }: { pages: StanzaPage[]; summary?: string; children: (page: StanzaPage, at: number) => ReactNode }) {
  const [at, setAt] = useState(0);
  const [height, setHeight] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const go = useCallback((n: number) => setAt(Math.max(0, Math.min(pages.length - 1, n))), [pages.length]);

  // The block never shrinks between pages, so the page below does not jump: it keeps the tallest height seen so far.
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight((h) => Math.max(h, el.scrollHeight)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setHeight(0), [pages]);

  if (pages.length === 1) return <>{children(pages[0], 0)}</>;
  const page = pages[at];
  return <div className="hf-pager" onKeyDown={(e) => {
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
  }}>
    <div className="hf-pager-body" style={{ minHeight: height || undefined }}>
      <div ref={body} key={at} className="hf-turn">{children(page, at)}</div>
    </div>
    <nav className="hf-pager-nav" aria-label="Pages of the hymn">
      <button type="button" className="hf-arrow" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Earlier stanzas"><ChevronLeft size={18} strokeWidth={1.5} aria-hidden /></button>
      <div className="hf-dots">{pages.map((p, i) =>
        <button key={p.first} type="button" className={i === at ? "on" : undefined} aria-label={label(p)} aria-current={i === at ? "true" : undefined} onClick={() => go(i)} />)}</div>
      <button type="button" className="hf-arrow" onClick={() => go(at + 1)} disabled={at === pages.length - 1} aria-label="Later stanzas"><ChevronRight size={18} strokeWidth={1.5} aria-hidden /></button>
      <span className="hf-where" aria-live="polite">{label(page)} <small>of {ROMAN[pages[pages.length - 1].last] ?? pages[pages.length - 1].last + 1}{summary ? ` · ${summary}` : ""}</small></span>
    </nav>
  </div>;
}
