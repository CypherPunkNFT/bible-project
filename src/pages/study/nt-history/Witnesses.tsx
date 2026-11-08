// 04 Witnesses outside, 06 The trial and 07 Paul's fixed points: each opens its records in the sheet. Paul's section changes scale,
// from five rulers to a drawing of the usual reckoning built on them, drawn as ranges because every year in it is reckoned.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, NH, rangeWord, witnessesByWriter } from "./model";
import { Head, Prose, Refs } from "./parts";
import { useOpen } from "./open";

export function Witnesses() {
  const open = useOpen();
  return <>
    <Head num="04" kicker="Witnesses outside" title="Four writers." turn="No believers among them." lead={<Prose text={D.witnesses.lead} />} />
    <ul className="nh-witnesses">{witnessesByWriter().flatMap(({ writer, records }) => records.map((w, i) => <li key={w.id} style={{ display: "contents" }}>
      <button type="button" className="nh-witness" data-opener={`wit:${w.id}`} aria-haspopup="dialog" onClick={() => open(`wit:${w.id}`)}>
        <b>{writer}{records.length > 1 && <small> · record {i + 1} of {records.length}</small>}</b>
        <small><Checked text={w.work} /> · <Checked text={w.written} /></small>
        <i>What it says, and what it cannot show →</i>
      </button>
    </li>))}</ul>
    <p className="nh-together"><Prose text={D.witnesses.together} /></p>
  </>;
}

export function Trial() {
  return <>
    <Head num="06" kicker="The trial" title="Named people." turn="Never a people." lead={<Prose text={D.trial.lead} />} />
    <div className="nh-trial">{D.trial.steps.map((t) => <TrialStep key={t.id} id={t.id} />)}</div>
    <div className="nh-guilt">
      <p><Prose text={D.trial.guilt} /></p>
      <div><p className="nh-kicker">In the site's own voice</p><p className="nh-para"><Prose text={D.stance.guilt} /></p><Refs labels={D.stance.verses.slice(2)} /></div>
    </div>
  </>;
}

function TrialStep({ id }: { id: string }) {
  const open = useOpen();
  const t = D.trial.steps.find((s) => s.id === id)!;
  return <div>
    <h3><Checked text={t.title} /></h3>
    <p><Prose text={t.evidence} /></p>
    <button type="button" className="nh-open" data-opener={`trial:${t.id}`} aria-haspopup="dialog" onClick={() => open(`trial:${t.id}`)}>What is inferred, and where it stops <span aria-hidden="true">→</span></button>
  </div>;
}

const P0 = 30, P1 = 65, PW = 860, PX = (year: number) => 20 + ((year - P0) / (P1 + 1 - P0)) * PW;
/** A label after its bar, or before it when the bar ends near the drawing's right edge. */
const labelAt = (from: number, to: number) => (PX(to + 1) > 640 ? { x: PX(from) - 6, textAnchor: "end" as const } : { x: PX(to + 1) + 6 });

function Reconstruction() {
  const { fixed, reckoned } = NH.paul;
  const title = (id?: string) => D.paul.fixed.find((f) => f.id === id)?.title ?? "";
  const rows = fixed.length + reckoned.length;
  return <div className="nh-recon" aria-hidden="true">
    <svg viewBox={`0 0 900 ${rows * 22 + 40}`}>
      <defs><pattern id="nh-hatch-paul" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line className="nh-hatch-line" x1="0" y1="0" x2="0" y2="5" /></pattern></defs>
      {[30, 35, 40, 45, 50, 55, 60, 65].map((y) => <g key={y}><line className="axis" x1={PX(y)} x2={PX(y)} y1="4" y2={rows * 22 + 14} /><text className="tick" x={PX(y) + 2} y={rows * 22 + 28}>AD {y}</text></g>)}
      {fixed.map((f, i) => <g key={f.id}>
        {f.before ? <path className="fixedpt" d={`M${PX(f.to + 1)} ${i * 22 + 14}H${PX(f.to + 1) - 40}m6-5-6 5 6 5`} fill="none" />
          : <rect className="fixedpt" x={PX(f.from)} y={i * 22 + 8} width={PX(f.to + 1) - PX(f.from)} height="11" fill="none" />}
        <text {...labelAt(f.before ? f.to - 6 : f.from, f.to)} y={i * 22 + 17}>{title(f.id)} · {plainText(D.paul.fixed.find((x) => x.id === f.id)?.when ?? rangeWord(f.from, f.to))}</text>
      </g>)}
      {reckoned.map((r, j) => {
        const y = (fixed.length + j) * 22 + 8;
        return <g key={r.label}><rect className="range" x={PX(r.from)} y={y} width={PX(r.to + 1) - PX(r.from)} height="11" /><text {...labelAt(r.from, r.to)} y={y + 9}>{r.label} · about {rangeWord(r.from, r.to)}</text></g>;
      })}
    </svg>
  </div>;
}

export function Paul() {
  const open = useOpen();
  return <>
    <Head num="07" kicker="Paul's fixed points" title="Five rulers." turn="One spine." lead={<Prose text={D.paul.lead} />} />
    <ul className="nh-paul">{D.paul.fixed.map((f) => <li key={f.id}>
      <button type="button" className="nh-fixed" data-opener={`paul:${f.id}`} aria-haspopup="dialog" onClick={() => open(`paul:${f.id}`)}>
        <small><Checked text={f.when} /></small><b><Checked text={f.title} /></b><span className="nh-caption">Open the record →</span>
      </button>
    </li>)}</ul>
    <Reconstruction />
    <p className="nh-caption">The first five rows, in solid outline: the fixed points, each from an outside record. The rows under them, hatched: the usual reckoning built on them, which the record says must be drawn as ranges.</p>
    <p className="nh-para"><Prose text={D.paul.reconstruction} /></p>
    <Refs labels={D.paul.verses} />
  </>;
}
