// The record sheet (approved mock-up D: js/sheet.js): any of the eighteen records, or any pictured codex, opened from any
// section, slides in from the right. A record shows its kind, number, date, place, title, evidence, interpretation, limit,
// the collection or passage and its sources, plus its picture where one exists, and pages to the earlier and later record.
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { CN, name, pictureFor, pictureWhat, records, tone, type CanonRecord, type Picture } from "./model";
import { Cite, Credit, ext, PictureImg } from "./parts";

export type Opened = { kind: "record"; id: string } | { kind: "picture"; q: string };

function Figure({ p }: { p: Picture }) {
  return <figure className="ms-sheet-fig"><PictureImg p={p} lazy={false} /><figcaption>{p.name}, {pictureWhat(p)}. <Credit p={p} /></figcaption></figure>;
}

function RecordBody({ r, onPage }: { r: CanonRecord; onPage: (id: string) => void }) {
  const i = records.indexOf(r), p = pictureFor.get(r.id), earlier = records[i - 1], later = records[i + 1];
  return <>
    <div className="cn-sheet-top"><span className="cn-tag">{r.kind}</span><span>{String(i + 1).padStart(2, "0")} / {records.length}</span></div>
    <p className="kicker">{name(r.id)}</p><h2>{r.title}</h2>
    {p && <Figure p={p} />}
    <dl className="ms-facts"><div><dt>Date</dt><dd>{r.date}</dd></div><div><dt>Place</dt><dd>{r.place}</dd></div>
      <div><dt>Evidence</dt><dd>{r.evidence}</dd></div><div><dt>Interpretation</dt><dd>{r.interpretation}<small>This study's inference, not a quotation.</small></dd></div>
      <div className="cn-limit"><dt>The limit</dt><dd>{r.limit}</dd></div></dl>
    <details className="cn-contents" open><summary>Inspect the collection or passage</summary><p className="cn-caption">Selected observations · not a complete transcription of the source.</p>
      <ul>{r.contents.map((c) => <li key={c}>{c}</li>)}</ul></details>
    <Cite ids={r.sourceIds} />
    <div className="cn-paging"><button type="button" disabled={!earlier} onClick={() => earlier && onPage(earlier.id)}>← Earlier record</button>
      <button type="button" disabled={!later} onClick={() => later && onPage(later.id)}>Later record →</button></div>
  </>;
}

// A pictured codex the study has no record for: catalogue facts only, and a plain note saying so.
function PictureBody({ p }: { p: Picture }) {
  const rows = ([["Date", p.date], ["Holds", p.holds], ["Material", p.material], ["Where it is now", [p.holder, p.shelf && `shelfmark ${p.shelf}`].filter(Boolean).join(", ")]] as const).filter(([, v]) => v);
  return <>
    <p className="kicker">A surviving witness</p><h2>{p.name}</h2><Figure p={p} />
    <dl className="ms-facts">{rows.map(([t, v]) => <div key={t}><dt>{t}</dt><dd>{v}</dd></div>)}</dl>
    <p className="ms-src">Shown as a surviving copy of the kind this study discusses; it is not one of the study's eighteen records. Facts from <a href={`https://www.wikidata.org/wiki/${encodeURIComponent(p.q)}`} {...ext}>Wikidata {p.q}</a> (CC0) via the Manuscripts collection.</p>
  </>;
}

/** The sheet for `opened`; Escape or a click outside closes it (a click on another [data-open] or [data-picture] control
 *  opens that instead). Focus moves to the close button and back to where it came from. */
export function CanonSheet({ opened, open, onClose, onPage, returnFocus, justOpened }: {
  opened: Opened | null; open: boolean; onClose: () => void; onPage: (id: string) => void;
  returnFocus: RefObject<HTMLElement | SVGElement | null>; justOpened: RefObject<boolean>;
}) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    if (body.current) body.current.scrollTop = 0;
    body.current?.parentElement?.querySelector<HTMLButtonElement>(".ms-sheet-close")?.focus({ preventScroll: true });
  }, [open, opened]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (justOpened.current || !target || body.current?.parentElement?.contains(target) || target.closest("[data-open],[data-picture]")) return;
      onClose();
    };
    addEventListener("keydown", key);
    document.addEventListener("click", click);
    return () => { removeEventListener("keydown", key); document.removeEventListener("click", click); };
  }, [open, onClose, justOpened]);
  useEffect(() => {
    if (open) return;
    const from = returnFocus.current;
    if (from?.isConnected) from.focus({ preventScroll: true });
  }, [open, returnFocus]);

  const r = opened?.kind === "record" ? records.find((x) => x.id === opened.id) : undefined;
  const p = opened?.kind === "picture" ? CN.pictured.find((x) => x.q === opened.q) : undefined;
  return <SlidePanel open={open} onClose={onClose} label="Historical record" closeLabel="Close the record" bodyRef={body} className="cn-sheet"
    style={{ "--tone": r ? tone(r.id) : "var(--accent)" } as CSSProperties}>
    {r ? <RecordBody r={r} onPage={onPage} /> : p ? <PictureBody p={p} /> : null}
  </SlidePanel>;
}
