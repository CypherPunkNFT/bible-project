// Section 04: East and West. Two strands, the Latin church and the Greek, from 451 to Florence: a rung where they were in communion, a gap
// where they were not, a band for a wound, and a loose knot for a union agreed and undone. The rungs fade between 1054 and 1204 because
// whether the churches still counted as one there is a reading, not a record. The list is the interface; the drawing repeats it for a pointer.
import { plainText } from "@/pages/study/check-notes/checked";
import { D, findStep, SPLIT, SPLIT_LATER, splitPlace, splitRungs, type Orientation, type SplitStep } from "./model";
import { Cite, Head, StandPanel, T, ThreeParts } from "./parts";

export const KIND_WORD = { strain: "A strain", break: "Out of communion", wound: "A wound", union: "A union agreed, then undone" } as const;

/** A point in the drawing: `along` the years and `across` from the Latin strand (0) to the Greek (1). */
function at(along: number, across: number, orientation: Orientation): [number, number] {
  const box = SPLIT[orientation], cross = box.latin + across * (box.greek - box.latin);
  return orientation === "wide" ? [along, cross] : [cross, along];
}

function line(a: [number, number], b: [number, number]): string {
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
}

function StepMark({ step, orientation, chosen, onChoose }: { step: SplitStep; orientation: Orientation; chosen: boolean; onChoose: () => void }) {
  const start = splitPlace(step.year, orientation), end = splitPlace(step.to, orientation), middle = (start + end) / 2;
  const [x, y] = at(middle, 0.5, orientation);
  return <g className={`mv-splitmark ${step.kind}${chosen ? " on" : ""}`} onClick={onChoose}>
    {step.kind === "break" && <path className="mv-splitgap" d={`${line(at(start, -0.12, orientation), at(end, -0.12, orientation))}${line(at(start, 1.12, orientation), at(end, 1.12, orientation))}`} />}
    {step.kind === "wound" && <path className="mv-splitwound" d={line(at(start, -0.25, orientation), at(start, 1.25, orientation))} />}
    {step.kind === "union" && <ellipse className="mv-splitknot" cx={x} cy={y} rx={orientation === "wide" ? 9 : 26} ry={orientation === "wide" ? 26 : 9} />}
    {step.kind === "strain" && <path className="mv-splitstrain" d={`M${x} ${y - 9}L${x + 9} ${y}L${x} ${y + 9}L${x - 9} ${y}Z`} />}
    <circle className="mv-splithit" cx={x} cy={y} r="15" />
  </g>;
}

function SplitArt({ orientation, chosen, onChoose }: { orientation: Orientation; chosen: SplitStep; onChoose: (id: string) => void }) {
  const box = SPLIT[orientation], wide = orientation === "wide";
  const [l1, l2] = [at(box.start, 0, orientation), at(box.end, 0, orientation)], [g1, g2] = [at(box.start, 1, orientation), at(box.end, 1, orientation)];
  const label = wide ? { latin: [box.start, box.latin - 14], greek: [box.start, box.greek + 24] } : { latin: [box.latin - 8, 14], greek: [box.greek + 8, 14] };
  return <svg className={`mv-splitart ${orientation}`} viewBox={`0 0 ${box.width} ${box.height}`} role="img"
    aria-label={`Two lines from 451 to about 1460, the Latin church and the Greek, joined by rungs where they were in communion. Seven steps are marked; the chosen one is ${plainText(chosen.head)} (${chosen.when}). The list beside it gives each.`}>
    <text className="mv-splitside" x={label.latin[0]} y={label.latin[1]} textAnchor={wide ? "start" : "end"}>Latin West</text>
    <text className="mv-splitside" x={label.greek[0]} y={label.greek[1]} textAnchor="start">Greek East</text>
    {splitRungs().map((rung) => rung.state !== "no" && <path key={rung.year} className={`mv-splitrung ${rung.state}`} d={line(at(splitPlace(rung.year, orientation), 0.08, orientation), at(splitPlace(rung.year, orientation), 0.92, orientation))} />)}
    <path className="mv-splitstrand" d={line(l1, l2)} />
    <path className="mv-splitstrand greek" d={line(g1, g2)} />
    {SPLIT.ruler.map((year) => { const [x, y] = at(splitPlace(year, orientation), 1, orientation); return <text key={year} className="mv-splityear" x={wide ? x : x + 30} y={wide ? y + 40 : y + 4} textAnchor={wide ? "middle" : "start"}>{year}</text>; })}
    {D.split.steps.map((step) => <StepMark key={step.id} step={step} orientation={orientation} chosen={step.id === chosen.id} onChoose={() => onChoose(step.id)} />)}
    <text className="mv-splitlater" x={wide ? box.end : box.width / 2} y={wide ? box.height - 8 : box.height - 4} textAnchor={wide ? "end" : "middle"}>→ {SPLIT_LATER.label}</text>
  </svg>;
}

export function Split({ stepId, onChange }: { stepId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const step = findStep(stepId), choose = (id: string) => onChange({ step: id });
  return <>
    <Head num="04" kicker="East and West" title={<>Remembered as 1054.<em> Parted over centuries.</em></>} lead={<T text={D.split.lead} />} />
    <SplitArt orientation="wide" chosen={step} onChoose={choose} />
    <SplitArt orientation="tall" chosen={step} onChoose={choose} />
    <p className="mv-caption"><T text={D.split.note} /> A gap is a break the record dates; a band across both lines is the sack of 1204; a loose knot is a union signed and later refused.</p>
    <div className="mv-split">
      <ol className="mv-steplist">{D.split.steps.map((s) => <li key={s.id}><button type="button" aria-pressed={s.id === step.id} onClick={() => choose(s.id)}>
        <small>{s.when}</small><span><strong>{plainText(s.head)}</strong><small>{KIND_WORD[s.kind]}</small></span>
      </button></li>)}</ol>
      <div className="mv-steprecord" aria-live="polite">
        <p className="mv-kicker">{step.when} · {KIND_WORD[step.kind]}</p>
        <h3>{step.head}</h3>
        <ThreeParts evidence={step.text} inference={step.inference} limit={step.limit} />
        <Cite ids={step.sources} />
      </div>
    </div>
    <StandPanel stand={D.split.stand} labels={D.split.stand.verses ?? []} />
  </>;
}
