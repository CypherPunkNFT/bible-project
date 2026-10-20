// The comparison desk (mock-up js/desk.js, with D's clear-of-text threads): each witness's line as floating text, joined
// by a thread to the reading it supports. A thread starts after the end of its witness's sentence and only bends once it
// is clear of every row's lettering, so no line runs over a letter. Readings with more than one witness gather their
// threads; an edition's thread is dashed, a lost leaf's thread stops short. Choosing a witness shows its evidence below.
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { caseById, readingsFor, type CaseId, type Reading } from "./evidence";
import { isLost, kindClass } from "./model";
import { Cite, RecButton } from "./parts";
import { Rich } from "./Rich";

interface Group { key: string; text: string; lost: boolean; ms: number; ed: number }
const keyOf = (r: Reading) => (isLost(r) ? `lost:${r.id}` : r.difference);
function groups(rows: Reading[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const key = keyOf(r);
    if (!map.has(key)) map.set(key, { key, text: r.difference, lost: isLost(r), ms: 0, ed: 0 });
    const g = map.get(key) as Group;
    if (r.layer === "Manuscript") g.ms++; else if (r.layer === "Critical edition") g.ed++;
  }
  return [...map.values()];
}
const support = (g: Group) => (g.lost ? "no leaf survives here"
  : [g.ms ? `${g.ms} manuscript${g.ms > 1 ? "s" : ""}` : "", g.ed ? `${g.ed} edition${g.ed > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · "));

/** The right edge of the last line of text inside a node, and the rightmost edge of any of its lines. */
function textEdges(node: Element) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const rects = [...range.getClientRects()].filter((r) => r.width > 0);
  return rects.length ? { last: rects[rects.length - 1], right: Math.max(...rects.map((r) => r.right)) } : null;
}

interface Thread { id: string; cls: string; d: string; x1: number; y1: number; x2: number; y2: number; xe: number; lost: boolean }
/** Every thread's path, measured from the laid-out words. */
function measure(graph: HTMLElement, rows: Reading[]): { w: number; h: number; threads: Thread[] } | null {
  const box = graph.getBoundingClientRect();
  if (!box.width) return null;
  const GAP = 12;
  const lettering = [...graph.querySelectorAll(".dk-wits .dk-line, .dk-wits .dk-who, .dk-wits .dk-gloss, .dk-wits .dk-sig")];
  const clear = Math.max(...lettering.map((n) => textEdges(n)?.right ?? 0)) - box.left + GAP;
  const threads: Thread[] = [];
  for (const r of rows) {
    const line = graph.querySelector(`[data-row="${r.id}"] .dk-line`), end = line ? textEdges(line) : null;
    const read = graph.querySelector(`[data-read="${CSS.escape(keyOf(r))}"] b`)?.getBoundingClientRect();
    if (!end || !read) continue;
    const x1 = end.last.right - box.left + GAP, y1 = end.last.top + end.last.height / 2 - box.top;
    const x2 = read.left - box.left - GAP, y2 = read.top + read.height / 2 - box.top;
    const xs = Math.max(clear, x1);
    if (x2 - xs < 18) continue;
    const lost = isLost(r), xe = lost ? xs + (x2 - xs) * 0.6 : x2, mx = xs + (xe - xs) * 0.5;
    threads.push({ id: r.id, cls: kindClass(r), d: `M${x1} ${y1}H${xs}C${mx} ${y1} ${mx} ${y2} ${xe} ${y2}`, x1, y1, x2, y2, xe, lost });
  }
  return { w: box.width, h: box.height, threads };
}

export function Desk({ caseId }: { caseId: CaseId }) {
  const c = caseById(caseId), greek = caseId !== "mark";
  const [alt, setAlt] = useState(false), [chosen, setChosen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null), [fresh, setFresh] = useState(false);
  const [drawn, setDrawn] = useState<ReturnType<typeof measure>>(null);
  const graph = useRef<HTMLDivElement>(null);
  const rows = readingsFor(caseId, alt), chosenRow = rows.find((r) => r.id === chosen);

  const redraw = useCallback(() => {
    if (!graph.current) return;
    const next = measure(graph.current, readingsFor(caseId, alt));
    setDrawn((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [caseId, alt]);
  useLayoutEffect(() => {
    redraw();
    const el = graph.current;
    if (!el) return;
    const observer = new ResizeObserver(redraw);
    observer.observe(el);
    let live = true;
    document.fonts?.ready.then(() => { if (live) redraw(); }, (error) => console.error("passage desk: fonts did not load; threads measured with fallback faces", error));
    return () => { live = false; observer.disconnect(); };
  }, [redraw]);

  const pickAlt = (value: boolean) => { setAlt(value); setFresh(true); };
  return <div className="dk" data-case={caseId} style={{ "--tone": `var(${c.tone})` } as CSSProperties}>
    <div className="dk-intro">
      <div><p className="kicker dk-passage">{c.passage}</p><h3 className="dk-sub"><Rich text={c.subtitle} /></h3><p className="dk-context">{c.context}</p></div>
      <div className="dk-controls">{c.toggle
        ? <div><p className="dk-legend">{c.toggle.label}</p><div className="ct-sort dk-toggle" role="group" aria-label={c.toggle.label}>
          <button type="button" aria-pressed={!alt} onClick={() => pickAlt(false)}>{c.toggle.off}</button>
          <button type="button" aria-pressed={alt} onClick={() => pickAlt(true)}>{c.toggle.on}</button></div></div>
        : <p className="dk-note">{c.note}</p>}</div>
    </div>
    <div className="dk-graph" ref={graph}>
      <ol className="dk-wits">{rows.map((r) => <li key={`${r.id}-${alt}`}>
        <button type="button" className={`dk-wit ${kindClass(r)}`} data-row={r.id} aria-pressed={chosen === r.id}
          onClick={() => setChosen((now) => (now === r.id ? null : r.id))} onPointerOver={() => setHover(r.id)} onPointerOut={() => setHover(null)}>
          <span className="dk-sig">{r.siglum}</span>
          <span className="dk-who"><b>{r.name}</b><small>{r.layer}</small></span>
          <span className="dk-line" lang={greek ? "grc" : undefined}><span>{r.before}</span><mark data-slot className={fresh ? "is-new" : undefined}>{r.difference}</mark><span>{r.after ?? ""}</span></span>
          <span className="dk-gloss">{r.gloss}</span>
        </button></li>)}</ol>
      <ul className="dk-reads" aria-label="Readings">{groups(rows).map((g) => <li key={g.key} data-read={g.key} className={g.lost ? "is-lost" : undefined}>
        <b lang={greek && !g.lost ? "grc" : undefined}>{g.lost ? "no reading" : g.text}</b><small>{support(g)}</small></li>)}</ul>
      <svg className="dk-threads" aria-hidden="true" viewBox={drawn ? `0 0 ${drawn.w} ${drawn.h}` : undefined}>
        {drawn?.threads.map((t) => {
          const on = chosen === t.id ? " is-on" : "";
          return <g key={t.id}>
            <path className={`dk-thread ${t.cls}${on}${hover === t.id ? " is-hover" : ""}`} data-row-thread={t.id} d={t.d} />
            <circle className={`dk-knot ${t.cls}${on}`} cx={t.x1} cy={t.y1} r="2.6" />
            {t.lost ? <path className="dk-cut" d={`M${t.xe + 4} ${t.y2 - 5}l6 10m0-10-6 10`} /> : <circle className={`dk-knot ${t.cls}`} cx={t.x2} cy={t.y2} r="2.2" />}
          </g>;
        })}
      </svg>
    </div>
    <div className="dk-below ms-say" aria-live="polite">{chosenRow
      ? <><p className="kicker">{chosenRow.siglum} · {chosenRow.name} · {chosenRow.date}</p><p className="dk-evidence">{chosenRow.evidence}</p><Cite ids={chosenRow.links} /><RecButton rec={chosenRow.rec} /></>
      : <><span className="dk-hint">Choose a witness to see what it is, where the extract comes from, and its sources.</span> <span className="dk-caption">{c.caption}</span></>}</div>
    <div className="dk-foot">
      <p className="dk-key"><span><i className="k-ms" />Manuscript evidence</span><span><i className="k-ed" />Editor’s text</span>{caseId === "mark" && <span><i className="k-lost" />Not extant ≠ omitted</span>}</p>
      <div className="dk-cites"><Cite ids={c.cites} /></div>
    </div>
  </div>;
}
