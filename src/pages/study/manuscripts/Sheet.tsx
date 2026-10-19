// The record sheet (approved mock-up: js/sheet.js): any manuscript, opened from any section, slides in from the right with
// everything the open record holds: the date and how it was reached, material, contents, where it is now, its picture
// with credit, and its sources. The city panel of "Where are they now?" uses the same sliding shell, beneath it.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import { booksText, holderText, kindOf, plural, ranges, sigla, type MsIndex } from "./model";
import { FormArt, Icon } from "./parts";

const BASIS: Record<string, string> = {
  century: "dated by century in the catalogue", "century-from-year": "Wikidata gives a round year, read here as the century it stands for",
  year: "a single year, as the catalogue gives it", range: "a range given by the catalogue", "reparsed-range": "the range as the catalogue's own text states it",
  reparsed: "read from the catalogue's text", note: "from the note that identifies it in the corpus", corrected: "corrected on this page",
  radiocarbon: "radiocarbon, the full 2-sigma calibrated range", "palaeographic-estimate": "a palaeographer's estimate from the handwriting",
  "ai-script-model": "an AI model's estimate from the handwriting", "palaeographic-period": "the period of its script, read as a span of years",
  "explicit-year": "a date written in the document itself",
};
const BOOK_SOURCE: Record<string, string> = { catalogue: "read from the catalogue's own words", note: "from its name or the note that identifies it in the corpus",
  etcbc: "as the ETCBC transcription identifies it", corrected: "corrected on this page" };
const ext = { target: "_blank", rel: "noopener" } as const;
/** Who supplied a scroll's date (the corpus picks one claim of several by a stated rule; the others stay in the corpus). */
const DSS_DATE: Record<string, ReactNode> = {
  pp: <>Popović et al. 2025, <a href="https://doi.org/10.1371/journal.pone.0323185" {...ext}>PLOS ONE e0323185</a>, CC BY 4.0</>,
  wc: <>the English Wikipedia article <a href="https://en.wikipedia.org/wiki/Carbon_dating_the_Dead_Sea_Scrolls" {...ext}>Carbon dating the Dead Sea Scrolls</a>, CC BY-SA 4.0</>,
  wq: <>the English Wikipedia lists of manuscripts from the Qumran caves, CC BY-SA 4.0</>,
};
const capital = (text: string) => text[0].toUpperCase() + text.slice(1);

/** The sliding shell: a close button and a scrolling body, open when `open`; Escape and an outside click close it. */
export function SlidePanel({ open, onClose, label, className = "", style, bodyRef, closeLabel, children }: {
  open: boolean; onClose: () => void; label: string; className?: string; style?: CSSProperties; bodyRef?: RefObject<HTMLDivElement>;
  closeLabel: string; children: ReactNode;
}) {
  return <aside className={`ms-sheet ${className}${open ? " open" : ""}`} role="dialog" aria-modal="false" aria-label={label} style={style} aria-hidden={!open || undefined}>
    <button type="button" className="ms-sheet-close" aria-label={closeLabel} onClick={onClose}><Icon name="x" size={18} /></button>
    <div ref={bodyRef} className="ms-sheet-body">{children}</div>
  </aside>;
}

function Picture({ index, r }: { index: MsIndex; r: MsRecord }) {
  const im = r.im ? index.data.images[r.im] : undefined;
  if (!im) return <figure className="ms-sheet-fig ms-noimg"><FormArt record={r} /><figcaption>No openly licensed picture of this manuscript is held here.</figcaption></figure>;
  const what = im.file.replace(/\.(jpe?g|png|gif)$/i, "");
  return <figure className="ms-sheet-fig"><img src={im.src} width={im.w} height={im.h} alt={`${r.n}: ${what}`} />
    <figcaption>{what}{im.via ? ` (from the ${im.via})` : ""}. {im.by} · {im.lic} · <a href={im.page} {...ext}>Wikimedia Commons</a></figcaption></figure>;
}

function Facts({ index, r }: { index: MsIndex; r: MsRecord }) {
  const k = kindOf(r.k), rows: [string, ReactNode][] = [];
  rows.push(["Date", r.d ? <>{r.d}<small>{BASIS[r.db ?? ""] ?? ""}{r.dw ? ` (the source says “${r.dw}”)` : ""}</small>{r.why && <small className="ms-fix">{r.why}</small>}</>
    : <span className="muted">Not given in the open record{r.dr ? ` (it says “${r.dr}”)` : ""}</span>]);
  if (r.m) rows.push(["Material", capital(r.m)]);
  if (r.sc || r.la) rows.push(["Writing", [r.la, r.sc].filter(Boolean).join(", ")]);
  const bt = booksText(index, r);
  const said = r.c ? <small>The catalogue says: “{r.c}”</small> : null;
  rows.push(["Contents", bt ? <>{capital(bt)}<small>{BOOK_SOURCE[r.bs ?? ""] ?? ""}</small>{r.bwhy && <small className="ms-fix">{r.bwhy}</small>}{said}</>
    : r.lect ? <>Readings for the church year{said}</> : <span className="muted">Not itemised in the open record</span>]);
  if (r.ch) rows.push(["Chapters", Object.entries(r.ch).map(([b, list]) => `${index.data.books[Number(b)].name} ${ranges(list)}`).join("; ")]);
  if (r.f && r.x) rows.push(["Found", <>{r.f}<small>{plural(r.x[0], "fragment")}, {plural(r.x[1], "line")} of transcribed text</small></>]);
  const held = holderText(index, r);
  rows.push(["Where it is now", held ? <>{held}{r.sh && <small>Shelfmark {r.sh}</small>}{r.h && r.hr && !held.includes(r.hr) && <small>The catalogue says: “{r.hr}”</small>}</>
    : <span className="muted">{r.src === "dss" ? "The scroll records do not name a holder" : "Not given in the open record"}</span>]);
  rows.push(["Kind", <>{k.label}{r.L.length > 1 && <small>Also counted with: {r.L.filter((x) => x !== r.k).map((x) => kindOf(x).label).join(", ")}</small>}</>]);
  return <dl className="ms-facts">{rows.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>;
}

function Sources({ r }: { r: MsRecord }) {
  if (r.src === "dss") return <p className="ms-src">Record: ETCBC Dead Sea Scrolls, transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook; Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda. CC BY-NC 4.0, non-commercial. <a href="https://github.com/ETCBC/dss" {...ext}>github.com/ETCBC/dss</a>{r.ds && <>. Date: {DSS_DATE[r.ds]}{(r.dn ?? 0) > 1 ? `, chosen from ${r.dn} dated claims` : ""}</>}</p>;
  if (r.src === "syr") return <p className="ms-src">Record: <a href={r.su} {...ext}>Syriaca.org</a>, The Syriac Reference Portal, from William Wright's catalogue of the British Museum's Syriac manuscripts. CC BY 3.0.</p>;
  return <p className="ms-src">Record: <a href={`https://www.wikidata.org/wiki/${encodeURIComponent(r.i)}`} {...ext}>Wikidata {r.i}</a> (CC0){r.wp && <>, with details from the English Wikipedia article <a href={`https://en.wikipedia.org/w/index.php?oldid=${encodeURIComponent(String(r.wr ?? ""))}`} {...ext}>{r.wp}</a> (CC BY-SA 4.0)</>}.</p>;
}

/** The record sheet for `record`; `open` slides it in. Escape or a click outside closes it (a click on another [data-open]
 *  control opens that record instead). Focus moves to the close button and back to where it came from. */
export function RecordSheet({ index, record, open, onClose, returnFocus, justOpened }: {
  index: MsIndex; record: MsRecord | null; open: boolean; onClose: () => void; returnFocus: RefObject<HTMLElement | SVGElement | null>;
  /** True during the click that just opened a record, so that same click does not count as a click outside. */
  justOpened: RefObject<boolean>;
}) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    if (body.current) body.current.scrollTop = 0;
    body.current?.parentElement?.querySelector<HTMLButtonElement>(".ms-sheet-close")?.focus({ preventScroll: true });
  }, [open, record]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (justOpened.current || !target || body.current?.parentElement?.contains(target) || target.closest("[data-open]")) return;
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
  const k = record ? kindOf(record.k) : null, sig = record ? sigla(record) : "";
  return <SlidePanel open={open} onClose={onClose} label="Manuscript record" closeLabel="Close the record" bodyRef={body} style={k ? { "--tone": `var(${k.tone})` } as CSSProperties : undefined}>
    {record && k && <>
      <p className="kicker">{k.label}{sig ? ` · ${sig}` : ""}</p>
      <h2>{record.n}</h2>
      <Picture index={index} r={record} /><Facts index={index} r={record} /><Sources r={record} />
    </>}
  </SlidePanel>;
}
