// Section 04: a change of scale, to the whole. Twelve readers as ranges on one track from AD 200 to 2010, grouped by the kind of reading and
// not by century, so a reader can see that the kinds overlap and hand nothing over. A range stays a range. Pointing at a bar reads it out
// below the chart, and choosing it opens the record.
import { useState } from "react";
import { Link } from "react-router-dom";
import { barPlace, D, longestGap, percentAt, type Reader } from "./model";
import { Head } from "./parts";

const TICKS = [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];

function Axis() {
  return <div className="hc-axis" aria-hidden="true"><span />
    <div className="hc-track hc-track-head">{TICKS.map((year) => <i key={year} style={{ left: `${percentAt(year)}%` }}>{year}</i>)}</div></div>;
}

const gap = longestGap(D.readers);

function Bar({ reader, onPoint, onOpen }: { reader: Reader; onPoint: (reader: Reader | null) => void; onOpen: (id: string) => void }) {
  const { left, width } = barPlace(reader.from, reader.to);
  return <button type="button" className="hc-row" aria-haspopup="dialog" aria-label={`${reader.name}, ${reader.when}. Open the record.`} data-opener={`bar:${reader.id}`}
    onClick={() => onOpen(reader.id)} onMouseEnter={() => onPoint(reader)} onFocus={() => onPoint(reader)} onMouseLeave={() => onPoint(null)} onBlur={() => onPoint(null)}>
    <span className="hc-row-name"><b aria-hidden="true">{reader.mark}</b>{reader.name}<small>{reader.when}</small></span>
    <span className="hc-track">{TICKS.map((year) => <i key={year} style={{ left: `${percentAt(year)}%` }} />)}<span className="hc-gapband" style={{ left: `${percentAt(gap.from)}%`, width: `${percentAt(gap.to) - percentAt(gap.from)}%` }} /><span className="hc-bar" style={{ left: `${left}%`, width: `${width}%` }} /></span>
  </button>;
}

export function LineOfTime({ onOpen }: { onOpen: (id: string) => void }) {
  const [pointed, setPointed] = useState<Reader | null>(null);
  const { baptist } = D;
  return <>
    <Head num="04" kicker="The line of time" title={<>A long argument.<em> No clean handover.</em></>}
      lead="Did allegory give way to the plain sense, and that to criticism? The bars say not. Kinds of reading overlap across the centuries. Point at a bar to read it here, and choose it to open the record." />
    <div className="hc-time">
      <Axis />
      {D.lanes.map((lane) => <div key={lane.id} className="hc-lane">
        <p className="hc-lane-head"><strong>{lane.name}</strong> {lane.note}</p>
        {D.readers.filter((r) => r.lane === lane.id).map((reader) => <Bar key={reader.id} reader={reader} onPoint={setPointed} onOpen={onOpen} />)}
      </div>)}
      <p className="hc-readout" aria-hidden="true">{pointed ? <><b>{pointed.name}, {pointed.when}.</b> {pointed.looking}</> : "Point at a bar to read what that reader was looking for."}</p>
    </div>
    <p className="hc-caption">{`Each bar is the range given for the work, drawn no narrower than a small minimum so that it can be seen and pressed. It is not a lifespan. The hatched stretch from about AD ${gap.from} to ${gap.to} is this selection's: readers were reading all through it, and the planned study of the medieval church picks up its institutions.`}</p>
    <ol className="hc-turns">{D.turns.map((turn) => <li key={turn.id}><small>{turn.when}</small><h3>{turn.title}</h3><p>{turn.text}</p></li>)}</ol>
    <div className="hc-stance">
      <p className="hc-kicker">{baptist.head}</p>
      <p>{baptist.text}</p>
      <Link to={baptist.confession.href}>{baptist.confession.label} →</Link>
    </div>
  </>;
}
