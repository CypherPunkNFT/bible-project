// The restoration test (mock-up D's restoration() with js/edge-marks.js): the switch first, then the torn edge of P46 at
// θελ[ημα with its three labels, then what the switch shows; beside it, "Reading the marks" ties each record of the word
// to its part of the drawing. Pointing at the switch with a mouse previews the supplied letters; a click or tap turns
// them on or off for good. Pointing at a record lights its part; a click pins it.
import { useState, type PointerEvent } from "react";
import { edge, marks, markSources, sources } from "./evidence";
import { inkLines } from "./ink";
import { Cite, RecButton, Switch } from "./parts";
import { Rich } from "./Rich";

const TEAR = "M300 18 l-8 22 10 18 -12 26 9 20 -14 30 11 22 -8 26 12 30 -10 24 8 24";
/** A torn papyrus edge: θελ survives in ink; [ημα] is drawn as dashed ghost letters past the break. */
function EdgeArt() {
  const outline = `M30 18 H300 ${TEAR.slice(8)} V262 H30Z`;
  return <svg className="ed-art is-big" viewBox="0 0 440 280" aria-hidden="true">
    <defs><clipPath id="ed-clip-b"><path d={outline} /></clipPath></defs>
    <path className="ed-sheet" d={outline} />
    <g clipPath="url(#ed-clip-b)"><g className="ed-fibres">
      {Array.from({ length: 30 }, (_, i) => <path key={`h${i}`} d={`M24 ${22 + i * 8}h300`} />)}
      {Array.from({ length: 30 }, (_, i) => <path key={`v${i}`} d={`M${34 + i * 10} 14v260`} />)}</g>
      <g className="ed-ink">{inkLines(52, 46, 236, 6, 17, 3, "5 1.5 2.5 1.5")}{inkLines(52, 178, 236, 5, 17, 5, "5 1.5 2.5 1.5")}</g></g>
    <text className="ed-greek" x="290" y="160" textAnchor="end" lang="grc">θελ</text>
    <g className="ed-supplied"><text className="ed-bracket" x="304" y="160">[</text><text className="ed-ghost" x="318" y="160" lang="grc">ημα</text><text className="ed-bracket" x="404" y="160">]</text></g>
    <path className="ed-lost" d="M302 18H424V262H304" /><path className="ed-gapline" d="M306 168h112" />
    <g className="ed-flakes"><path d="M318 64l6-3 3 5-5 3z" /><path d="M334 214l5-2 2 4-4 2z" /><path d="M322 120l3-1 2 3-3 1z" /></g>
    <path className="ed-mark" d="M14 30h10m-5-5v10M420 254h10m-5-5v10" />
  </svg>;
}

type MarkId = (typeof marks.rows)[number]["id"];
const WORD: Record<MarkId, JSX.Element> = {
  ink: <>θελ<i className="em-tear" aria-hidden="true" /></>,
  dip: <>θελ<span className="em-br">[</span><span className="em-sup">ημα</span></>,
  ed: <>θέλημα</>,
};

/** "Reading the marks": one word in three records, then the word in its verse. */
function Marks({ lit, pinned, onLight, onPin }: { lit: MarkId | null; pinned: MarkId | null; onLight: (id: MarkId | null) => void; onPin: (id: MarkId) => void }) {
  const line = (key: keyof typeof marks.verse, cls: string, title?: string, lang?: string) => {
    const [before, word, after] = marks.verse[key];
    return <p className={`em-v ${cls}`} lang={lang} title={title}>{before}<mark>{word}</mark>{after}</p>;
  };
  return <aside className="d-edge-marks">
    <p className="kicker">Reading the marks</p><h4 className="em-h"><Rich text={marks.title} /></h4>
    <ol className="em-rows" role="group" aria-label="Three records of the word" onPointerLeave={() => onLight(pinned)}>{marks.rows.map((r) =>
      <li key={r.id}><button type="button" data-mark={r.id} aria-pressed={pinned === r.id} className={lit === r.id ? "is-lit" : undefined}
        onPointerOver={() => onLight(r.id)} onClick={() => onPin(r.id)}>
        <span className="em-label">{r.label}</span><span className="em-word" lang="grc">{WORD[r.id]}</span><span className="em-line">{r.line}</span>
      </button></li>)}</ol>
    <p className="em-say" aria-live="polite">{marks.rows.find((r) => r.id === lit)?.line ?? marks.hint}</p>
    <div className="em-verse"><p className="kicker">In its verse · Galatians 1:4</p>
      {line("dip", "em-v-dip", "Michigan’s diplomatic text", "grc")}{line("ed", "em-v-ed", "SBLGNT", "grc")}{line("en", "em-v-en")}
      <small className="pm-note">{marks.verseNote}</small>
      <Cite ids={[]} extra={[markSources.wholetext, markSources.nomina, sources.gal]} />
    </div>
  </aside>;
}

export function Restoration() {
  const [restored, setRestored] = useState(false), [preview, setPreview] = useState(false);
  const [pinned, setPinned] = useState<MarkId | null>(null), [lit, setLit] = useState<MarkId | null>(null);
  const pin = (id: MarkId) => { const next = pinned === id ? null : id; setPinned(next); setLit(next); };
  const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") setPreview(true); };
  return <div className={`d-edge${restored ? " is-restored" : ""}${preview ? " is-preview" : ""}`} data-mark={lit ?? undefined}>
    <div className="d-edge-main">
      <p className="kicker">{edge.where}</p><h3><Rich text={edge.title} /></h3><p className="cr-lead">{edge.lead}</p>
      <Switch className="d-edge-switch" checked={restored} onChange={setRestored} onPointerEnter={enter} onPointerLeave={() => setPreview(false)}>Show supplied letters</Switch>
      <figure className="ch-art d-edge-art" aria-hidden="true"><EdgeArt />
        {edge.tags.map(([id, label, small]) => <span key={id} className={`ch-tag ch-tag-${id}`}><i />{label}<small>{small}</small></span>)}</figure>
      <div className="ed-say" role="status"><p>{restored ? edge.on : edge.off}</p></div>
      <small className="pm-note">{edge.note}</small>
      <Cite ids={edge.links} /><RecButton rec="Q1513469" label="Open the record for P46" />
    </div>
    <Marks lit={lit} pinned={pinned} onLight={setLit} onPin={pin} />
  </div>;
}
