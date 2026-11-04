// Section 04: who counted as a household. The rings are Joshua 7's own four steps; house clusters are a named proposal, read second-hand
// and marked so; the two published sizes are drawn to one scale and left unreconciled.
import { useState } from "react";
import { Link } from "react-router-dom";
import { D } from "./model";
import { Cite, Head, Quote, ReadVerses, SourceLink } from "./parts";

const { kin } = D;
const RADII = [78, 58, 38, 18];
const METRE = 9;

function Rings() {
  const [chosen, setChosen] = useState(kin.rings[2].id);
  const ring = kin.rings.find((r) => r.id === chosen) ?? kin.rings[2];
  return <div className="hh-rings">
    <svg viewBox="0 0 170 170" aria-hidden="true">{kin.rings.map((r, i) => <circle key={r.id} cx="85" cy="85" r={RADII[i]} className={r.id === ring.id ? "on" : ""} />)}</svg>
    <div>
      <div className="hh-ring-buttons">{kin.rings.map((r) => <button key={r.id} type="button" aria-pressed={r.id === ring.id} onClick={() => setChosen(r.id)}><b>{r.word}</b><small>{r.name}</small></button>)}</div>
      <div aria-live="polite"><Quote label={ring.verse} /></div>
    </div>
  </div>;
}

function Sizes() {
  return <div className="hh-sizes">
    <p className="hh-kicker">Two published sizes, one scale</p>
    <svg viewBox={`0 0 ${METRE * 34} ${METRE * 13}`} role="img" aria-label="Two outlines drawn to one scale: 12 metres by 10, and about 15 metres by 9.">
      {D.sizes.map((s, i) => <rect key={s.id} x={4 + i * METRE * 17} y="4" width={s.length * METRE} height={s.width * METRE} className={i ? "hh-rebuilt" : "hh-found"} />)}
      <path className="hh-scalebar" d={`M4 ${METRE * 12}h${METRE * 5}`} /><text x={4 + METRE * 5 + 6} y={METRE * 12 + 4}>5 m</text>
    </svg>
    <ul>{D.sizes.map((s) => <li key={s.id}><b>{s.label}.</b> {s.note}. <SourceLink id={s.source} /></li>)}</ul>
    <p className="hh-caption">The two do not agree and neither is a survey. Each drawn outline uses the largest figure its source gives. Houses varied.</p>
  </div>;
}

export function Household() {
  return <>
    <Head num="04" kicker="Who lived inside" title={<>A house has walls.<em> A household may not.</em></>}
      lead={<>When Israel is sifted in Joshua 7, it goes by four steps, and the last step before the man is the family. What that family looked like on the ground is harder. For how Scripture teaches a family to live, see <Link to="/topics/c/family">Marriage, family & neighbours</Link>.</>} />
    <Rings />
    <ReadVerses labels={["Joshua 7:14", "Judges 6:15", "Exodus 12:4"]} />
    <p className="hh-para">{kin.gloss}</p>
    <div className="hh-pair">
      <div>
        <p className="hh-kicker">A proposal, read second-hand</p>
        <p className="hh-para">{kin.clusters}</p>
        <Cite ids={["stager"]} />
        <p className="hh-kicker hh-kicker-gap">Two sides of a wall</p>
        <p className="hh-para">{kin.unequal}</p>
        <ReadVerses labels={["Amos 3:15", "Amos 5:11", "Isaiah 5:8"]} />
        <Cite ids={["tirzah", "finkelstein"]} />
      </div>
      <Sizes />
    </div>
  </>;
}
