// Section 01, the page's central comparison: one line of years with what was decreed on one side and what is found near it on the other, in
// eleven pairs. A solid thread joins one quarrel or rule; a dashed one only says this study set the two side by side. The list is the
// interface; the drawing repeats it for a pointer, out of the tab order. It runs along the page when wide and down the page when narrow.
import { useMemo } from "react";
import { axisPlace, D, fieldById, findOpened, laneOffset, mirrorLayout, MIRROR, mirrorPoint, pairsIn, threadPath, type Field, type Mark, type Orientation, type Pair, type Side } from "./model";
import { Cite, FieldMark, FieldShape, Head, OldText } from "./parts";

const CENTURIES = [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];
const NUMBER = new Map(D.pairs.map((p, i) => [p.id, i + 1]));

function PairMark({ pair, mark, sign, orientation, shown, chosen, onChoose }: { pair: Pair; mark: Mark; sign: -1 | 1; orientation: Orientation; shown: boolean; chosen: boolean; onChoose: () => void }) {
  const off = sign * laneOffset(mark.lane), field = fieldById.get(pair.field);
  const [x, y] = mirrorPoint(mark.middle, off, orientation), [x1, y1] = mirrorPoint(mark.start, off, orientation), [x2, y2] = mirrorPoint(mark.end, off, orientation);
  const [foot1, foot2] = mirrorPoint(mark.middle, 0, orientation);
  return <g className={`mv-mirrormark${chosen ? " on" : ""}${shown ? "" : " off"}`} onClick={onChoose}>
    <path className="mv-stem" d={`M${foot1} ${foot2}L${x} ${y}`} />
    {mark.end > mark.start && <path className="mv-range" d={`M${x1} ${y1}L${x2} ${y2}`} />}
    <g transform={`translate(${x} ${y})`}>{field && <FieldShape field={field} />}<text textAnchor="middle" y="4">{NUMBER.get(pair.id)}</text></g>
  </g>;
}

function MirrorArt({ orientation, chosen, field, onChoose }: { orientation: Orientation; chosen: Pair; field: Field | null; onChoose: (id: string) => void }) {
  const { width, height, start, end } = MIRROR[orientation], layout = useMemo(() => mirrorLayout(orientation), [orientation]);
  const shown = new Set(pairsIn(field).map((p) => p.id));
  const [a1, a2] = mirrorPoint(start, 0, orientation), [b1, b2] = mirrorPoint(end, 0, orientation);
  const [up1, up2] = orientation === "wide" ? [start, 16] : [10, 14], [down1, down2] = orientation === "wide" ? [start, height - 6] : [width - 10, 14];
  return <svg className={`mv-mirrorart ${orientation}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="A line of years from 451 to 1350. Eleven decrees are marked on one side and eleven things found near them on the other, joined by threads. The list beside it gives each.">
    <text className="mv-side" x={up1} y={up2} textAnchor={orientation === "wide" ? "start" : "start"}>Decreed</text>
    <text className="mv-side" x={down1} y={down2} textAnchor={orientation === "wide" ? "start" : "end"}>Set beside it</text>
    {D.pairs.map((p) => <path key={p.id} className={`mv-thread${p.id === chosen.id ? " on" : ""}${shown.has(p.id) ? "" : " off"}${p.link === "beside" ? " beside" : ""}`} d={threadPath(p.id, layout, orientation)} />)}
    <path className="mv-axis" d={`M${a1} ${a2}L${b1} ${b2}`} />
    {CENTURIES.map((year) => { const [x, y] = mirrorPoint(axisPlace(year, orientation), 0, orientation); return <g key={year}>
      <path className="mv-axistick" d={orientation === "wide" ? `M${x} ${y - 4}v8` : `M${x - 4} ${y}h8`} />
      <text className="mv-axisyear" x={orientation === "wide" ? x : x + 7} y={orientation === "wide" ? y + 16 : y + 4}>{year}</text>
    </g>; })}
    {D.pairs.map((p) => { const a = layout.declared.get(p.id)!, b = layout.followed.get(p.id)!, on = p.id === chosen.id, picked = () => onChoose(p.id); return <g key={p.id}>
      <PairMark pair={p} mark={a} sign={-1} orientation={orientation} shown={shown.has(p.id)} chosen={on} onChoose={picked} />
      <PairMark pair={p} mark={b} sign={1} orientation={orientation} shown={shown.has(p.id)} chosen={on} onChoose={picked} />
    </g>; })}
  </svg>;
}

function SideText({ side }: { side: Side }) {
  if (side.quote) return <OldText who={side.who}>“{side.quote}”</OldText>;
  return <><p className="mv-para">{side.what}</p><p className="mv-sidewho">{side.who}</p></>;
}

function Chosen({ pair, onOpen }: { pair: Pair; onOpen: (id: string) => void }) {
  return <div className="mv-chosen" aria-live="polite">
    <p className="mv-kicker">Pair {NUMBER.get(pair.id)} · {fieldById.get(pair.field)?.name} · {pair.link === "same" ? "the same quarrel or rule" : "only set side by side by this study"}</p>
    <h3>{pair.head}</h3>
    <div className="mv-sides">
      <div><p className="mv-sidehead">Decreed · {pair.declared.when}</p>
        <SideText side={pair.declared} /></div>
      <div><p className="mv-sidehead">Set beside it · {pair.followed.when}</p>
        <SideText side={pair.followed} /></div>
    </div>
    <button type="button" className="mv-open" data-opener={`pair:${pair.id}`} onClick={() => onOpen(pair.id)}>Open the record: evidence, inference and where it stops →</button>
    <Cite ids={pair.sources} />
  </div>;
}

export function Mirror({ chosen, field, openValue, onChange, onOpen }: { chosen: Pair; field: Field | null; openValue: string | null; onChange: (values: Record<string, string | null>) => void; onOpen: (id: string) => void }) {
  const shown = pairsIn(field), opened = findOpened(openValue);
  const choose = (id: string) => onChange({ pair: id });
  return <>
    <Head num="01" kicker="Written above, found below" title={<>What was decreed.<em> What is found near it.</em></>}
      lead="On one side of the line, what a pope, council or king set down. On the other, something from the same ground, later. Choose a pair to read both. The gap between them is the page's whole subject." />
    <div className="mv-fields" role="group" aria-label="Show one field">
      <button type="button" aria-pressed={!field} onClick={() => onChange({ field: null })}>All four fields</button>
      {D.fields.map((f) => <button key={f.id} type="button" aria-pressed={field?.id === f.id} onClick={() => onChange({ field: f.id })}><FieldMark field={f} /><span><strong>{f.name}</strong><small>{f.note}</small></span></button>)}
    </div>
    <MirrorArt orientation="wide" chosen={opened ?? chosen} field={field} onChoose={choose} />
    <MirrorArt orientation="tall" chosen={opened ?? chosen} field={field} onChoose={choose} />
    <p className="mv-caption">Point at a mark and choose it, or use the list. A bar is a range, and a mark on it sits at its middle only so the number can be read. A solid thread joins one quarrel or rule. A dashed thread only says this study set the two together: nothing connects them. Marks in the same years stack outward and keep their dates.</p>
    <ol className="mv-pairlist">{shown.map((p) => <li key={p.id}><button type="button" aria-pressed={p.id === chosen.id} onClick={() => choose(p.id)}>
      <b>{NUMBER.get(p.id)}</b><span><strong>{p.head}</strong><small>{p.declared.when} · {p.followed.when}</small></span>
    </button></li>)}</ol>
    <Chosen pair={chosen} onOpen={onOpen} />
  </>;
}
