import { createElement, Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { chapterOf, LAYER, markRuns, refHref, refText } from "./data";
import { ICONS } from "./icons";
import type { Apostle, Claim, Entry, Ref } from "./types";

/** The small shared pieces of the apostle pages: icons, verse references, evidence labels, section heads, the tooltip
 *  and the reading sheet (tip.ts and sheet.ts hold their state; ported from the approved mock-up's core.js). */

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const shape = ICONS[name] ?? ICONS.dash;
  return createElement("svg", { className: "ico", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    ...shape.map(([tag, attrs]) => createElement(tag, attrs)));
}

/** A verse with his names marked. */
export function Marked({ text, names }: { text: string; names: string[] }) {
  return createElement(Fragment, null, ...markRuns(text, names).map((r) => (r.mark ? createElement("mark", null, r.t) : r.t)));
}

export function RefLink({ r }: { r: Ref }) {
  return <Link className="ref" to={refHref(r)}>{refText(r)}</Link>;
}
const Sep = () => <span className="ref-sep">·</span>;
export function RefList({ refs = [], max = 4 }: { refs?: Ref[]; max?: number }) {
  return <>{refs.slice(0, max).map((r, i) => <Fragment key={i}>{i > 0 && <Sep />}<RefLink r={r} /></Fragment>)}
    {refs.length > max && <><Sep /><span className="muted">+{refs.length - max}</span></>}</>;
}
export const LayerChip = ({ layer }: { layer: string }) => <span className="layer" data-layer={layer}>{LAYER[layer] ?? layer}</span>;
export function CiteText({ d, ids = [] }: { d: Apostle; ids?: string[] }) {
  const cites = ids.map((id) => d.citeById[id]).filter(Boolean);
  return <>{cites.map((c, i) => <Fragment key={c.id}>{i > 0 && <Sep />}<a className="cite" href={c.url ?? "#"} title={c.title} target="_blank" rel="noreferrer">{String(c.author).split(",")[0]}{c.year ? `, ${c.year}` : ""}</a></Fragment>)}</>;
}
/** The evidence line under a claim: its label, who said it and when, its verses, its sources. */
export function ClaimFoot({ d, c }: { d: Apostle; c: Claim }) {
  return <p className="foot"><LayerChip layer={c.layer ?? "scripture"} />
    {c.who && <span className="who">{c.who}{c.when ? `, ${c.when}` : ""}</span>}
    {c.refs?.length ? <span><RefList refs={c.refs} /></span> : null}
    {c.cites?.length ? <span><CiteText d={d} ids={c.cites} /></span> : null}</p>;
}
/** Section head: number, kicker, title with one italic word, one plain line. */
export function SecHead({ num, kicker, title, em, sub }: { num: string; kicker: string; title: string; em: string; sub?: ReactNode }) {
  return <header className="sec-head"><span className="sec-num">{num}</span><div>
    <p className="kicker">{kicker}</p><h2>{title}<em>{em}</em></h2>{sub && <p className="sub">{sub}</p>}</div></header>;
}

// ── The reading sheet: slides up from the bottom with the full detail of anything ──
export function Sheet({ content, tone, onClose }: { content: ReactNode | null; tone: string; onClose: () => void }) {
  const body = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const open = content !== null;
  useEffect(() => {
    if (!open) return;
    body.current?.scrollTo(0, 0);
    close.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, content, onClose]);
  return createPortal(<div className={`ap ap-sheet${open ? " open" : ""}`} style={{ "--tone": tone } as CSSProperties} aria-hidden={!open}>
    <div className="sheet-scrim" onClick={onClose} />
    <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Details">
      <button ref={close} type="button" className="round sheet-x" aria-label="Close" onClick={onClose} tabIndex={open ? 0 : -1}><Icon name="x" size={16} /></button>
      <div className="sheet-body" ref={body}>{content}</div>
    </div>
  </div>, document.body);
}

/** The full detail of one record, for the sheet: its verses with his names marked, its evidence, who is named in it. */
export function EntrySheet({ d, e }: { d: Apostle; e: Entry }) {
  const P = d.periods[e.period - 1];
  const ids = Object.keys(d.verses).map(Number);
  const verses = e.refs.flatMap(([a, b = a]) => ids.filter((v) => v >= a && v <= b).sort((x, y) => x - y)).slice(0, 14);
  const named = Object.entries(e.with ?? {});
  return <>
    <p className="kicker">{P.n} · {P.title}{e.h ? ` · harmony §${e.h.n}` : ""}</p><h3 className="sheet-title">{e.title}</h3>
    {e.text && e.text !== e.title && <p className="sheet-lede">{e.text}</p>}
    {verses.length > 0 && <div className="kjv">{verses.map((v) => <p key={v}><sup>{chapterOf(v).ch}:{chapterOf(v).v}</sup> <Marked text={d.verses[v] ?? ""} names={d.names} /></p>)}</div>}
    <ClaimFoot d={d} c={e} />
    {named.length > 0 && <><h4 className="sheet-h">Also named in these verses</h4><ul className="named">{named.map(([k, vs]) => <li key={k}><b>{d.rowByKey[k]?.name ?? k}</b> {vs.map((v, i) => <Fragment key={v}>{i > 0 && " "}<RefLink r={[v, v]} /></Fragment>)}</li>)}</ul></>}
  </>;
}
