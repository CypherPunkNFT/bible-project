// The great witnesses on one sideways shelf (approved mock-up: js/cabinet.js and combos.js "shelfify"): cases for the
// Hebrew Bible, Greek and the early translations in a row, oldest first in each family. A case shows the open picture, or
// our drawing of the form where none is free; pointing at one names it on the line below, and choosing it opens the full
// record. Under the row, the standard pill turned sideways: a thumb with no track, mirroring the scroll.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import { useMs } from "./context";
import { cabinetLead, shelves } from "./leads";
import { booksText, holderText, kindOf, sigla } from "./model";
import { FormArt } from "./parts";

const SHORT: Record<string, string> = { Q1165472: "Rylands Papyrus P52", Q116790777: "Codex Sassoon", Q5332637: "Etchmiadzin Gospels" };


/** The sideways pill under a row that scrolls across; a vertical wheel over the row moves it sideways until an end. */
function SidePill({ row }: { row: HTMLElement | null }) {
  const [state, setState] = useState({ hidden: true, width: 0, left: 0 });
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!row) return;
    const measure = () => {
      const range = row.scrollWidth - row.clientWidth, ratio = row.clientWidth / row.scrollWidth;
      setState({ hidden: range <= 1, width: ratio * 100, left: range > 0 ? (row.scrollLeft / range) * (1 - ratio) * 100 : 0 });
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = row.scrollLeft <= 0 && e.deltaY < 0, atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    };
    row.addEventListener("scroll", measure, { passive: true });
    row.addEventListener("wheel", wheel, { passive: false });
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    measure();
    return () => { row.removeEventListener("scroll", measure); row.removeEventListener("wheel", wheel); observer.disconnect(); };
  }, [row]);
  const drag = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!row || !bar.current) return;
    e.preventDefault();
    const thumb = e.currentTarget, x0 = e.clientX, left0 = row.scrollLeft, perPixel = row.scrollWidth / bar.current.clientWidth;
    thumb.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => { row.scrollLeft = left0 + (m.clientX - x0) * perPixel; };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", () => thumb.removeEventListener("pointermove", move), { once: true });
  };
  return <div ref={bar} className="ms-hbar" aria-hidden="true" hidden={state.hidden}>
    <span className="ms-hthumb" style={{ width: `${state.width}%`, left: `${state.left}%` }} onPointerDown={drag} /></div>;
}

export function Cabinet() {
  const { index, openRecord } = useMs();
  const list = useMemo(() => shelves(index), [index]);
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const [pointed, setPointed] = useState<MsRecord | null>(null);
  let n = 0;
  const say = (r: MsRecord | null) => {
    if (!r) return "Point at a case to read it here.";
    const bits = [r.d ?? (r.f ? `found at ${r.f}` : "date not in the record"), booksText(index, r), holderText(index, r) || (r.src === "dss" ? "" : "holder not in the record")].filter(Boolean);
    return <><b>{r.n}</b> · {bits.join(" · ")}</>;
  };
  const caseOf = (r: MsRecord) => {
    const im = r.im ? index.data.images[r.im] : undefined, k = kindOf(r.k), number = ++n, sig = sigla(r);
    return <button key={r.i} type="button" className={`cab-case${im ? "" : " cab-drawn"}`} data-open={r.i} style={{ "--tone": `var(${k.tone})` } as CSSProperties}
      onClick={(e) => openRecord(r.i, e.currentTarget)} onPointerOver={() => setPointed(r)} onFocus={() => setPointed(r)}>
      <span className="cab-art">{im ? <img src={im.src} alt="" loading="lazy" width={im.w} height={im.h} /> : <><FormArt record={r} /><em>drawing of the form</em></>}</span>
      <span className="cab-label"><i>No. {String(number).padStart(2, "0")}{sig ? ` · ${sig}` : ""}</i><b>{SHORT[r.i] ?? r.n}</b><small>{r.d ?? r.f ?? "date not in the record"}</small></span></button>;
  };
  return <div className="ms-part ms-part-cabinet ms-shelf">
    <p className="ms-part-lead">{cabinetLead(index)}</p>
    <div ref={setRow} className="cab" onPointerLeave={() => setPointed(null)}>{list.map((s) => <div key={s.name} className="cab-shelf">
      <p className="cab-shelf-name"><b>{s.name}</b><span>{s.line}</span></p>
      <div className="cab-row">{s.list.map(caseOf)}</div></div>)}</div>
    <SidePill row={row} />
    <p className="ms-say cab-say" aria-live="polite">{say(pointed)}</p>
  </div>;
}
