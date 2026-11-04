// Section 02: how northern Europe came to be baptised. A map with real coastlines and a slider of years, and eleven places, each with the way it
// came and who wrote the story, how long after. The list is the interface and never hides a place: the slider changes each one's state, in words
// as well as form. The slider moves on the page while dragged, and writes the address when let go, so a drag does not flood the browser's history.
import { useEffect, useState } from "react";
import { D, findStation, MV, stationMark, stationState, STATE_WORD, wayById, writtenLag, YEAR_FROM, YEAR_TO, type Station } from "./model";
import { Cite, Head, Picture, StandPanel, ThreeParts, WayMark, WayPath } from "./parts";

function MapMark({ station, year, chosen, onChoose }: { station: Station; year: number; chosen: boolean; onChoose: () => void }) {
  const { at, mark } = stationMark(station), way = wayById.get(station.way), state = stationState(station, year);
  const moved = at[0] !== mark[0] || at[1] !== mark[1];
  const left = mark[0] > 430;
  return <g className={`mv-station ${state}${chosen ? " on" : ""}${station.placed ? "" : " unplaced"}`} onClick={onChoose}>
    {moved && <path className="mv-leader" d={`M${at[0]} ${at[1]}L${mark[0]} ${mark[1]}`} />}
    {moved && station.placed && <circle className="mv-truedot" cx={at[0]} cy={at[1]} r="2.5" />}
    <g transform={`translate(${mark[0]} ${mark[1]}) scale(1.1)`}><circle r="12.5" />{way && <WayPath way={way} />}</g>
    {chosen && <text x={mark[0] + (left ? -20 : 20)} y={mark[1] + 6} textAnchor={left ? "end" : "start"}>{station.name}</text>}
  </g>;
}

function NorthMap({ stationId, year, onStation }: { stationId: string; year: number; onStation: (id: string) => void }) {
  const { width, height, paths } = MV.coast;
  return <svg className="mv-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`A map of north-west Europe from Iceland to Prussia, with eleven places marked, at the year ${year}. The list beside it gives each, with its state in that year.`}>
    {paths.map((d, i) => <path key={i} className="mv-land" d={d} />)}
    {D.stations.map((s) => <MapMark key={s.id} station={s} year={year} chosen={s.id === stationId} onChoose={() => onStation(s.id)} />)}
  </svg>;
}

function Record({ station }: { station: Station }) {
  const way = wayById.get(station.way);
  return <div className="mv-stationrecord" aria-live="polite">
    <p className="mv-kicker">{station.place} · {station.when}</p>
    <h3>{station.head}</h3>
    <p className="mv-lag"><b>{station.writer}</b>: {writtenLag(station)}.</p>
    <ThreeParts evidence={station.text} inference={<>This study files {station.name} under “{way?.name}”. That is a one-line summary of a long story, and each of these places also had some of the others.</>} limit={station.limit} />
    <Cite ids={station.sources} />
  </div>;
}

export function Mission({ stationId, addressYear, onChange }: { stationId: string | null; addressYear: number; onChange: (values: Record<string, string | null>) => void }) {
  const [year, setYear] = useState(addressYear);
  useEffect(() => setYear(addressYear), [addressYear]);
  const station = findStation(stationId);
  const commit = () => { if (year !== addressYear) onChange({ year: String(year) }); };
  const counts = D.stations.reduce((sum, s) => { sum[stationState(s, addressYear)] += 1; return sum; }, { before: 0, during: 0, after: 0 });
  return <>
    <Head num="02" kicker="How the north was baptised" title={<>A king's baptism has a date.<em> A people's does not.</em></>}
      lead="Eleven places, four ways it came. Move the years and watch the ranges open. Then ask of each one who is telling the story, and how long after." />
    <ul className="mv-ways" aria-label="The four ways it came">{D.ways.map((w) => <li key={w.id}><WayMark way={w} />{w.name}</li>)}</ul>
    <div className="mv-missiongrid">
      <div>
        <NorthMap stationId={station.id} year={year} onStation={(id) => onChange({ station: id })} />
        <label className="mv-year"><span>AD <b>{year}</b></span>
          <input type="range" min={YEAR_FROM} max={YEAR_TO} value={year} aria-valuetext={`AD ${year}`} onChange={(e) => setYear(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
        </label>
        <p className="mv-caption" aria-live="polite">At AD {addressYear}: {counts.during} under way, {counts.after} past the range drawn here, {counts.before} not yet. “Range ended” means only that the dated events have ended, and not that anyone's faith had. A dashed ring is Poland's, standing for the country because the place is disputed. A mark on a line has been moved aside so that close places can be told apart, and its dot shows where the place is. Coast simplified from <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>.</p>
      </div>
      <ol className="mv-stationlist">{D.stations.map((s) => { const way = wayById.get(s.way), state = stationState(s, year); return <li key={s.id}>
        <button type="button" aria-pressed={s.id === station.id} onClick={() => onChange({ station: s.id })}>
          {way && <WayMark way={way} />}<span><strong>{s.name}</strong><small>{s.when}</small></span><em className={state}>{STATE_WORD[state]}</em>
        </button>
      </li>; })}</ol>
    </div>
    <div className="mv-missionrecord">
      <Record station={station} />
      <div className="mv-missionpic"><Picture id="jelling" /><p className="mv-caption">Harald's stone at Jelling: the one record on this map in a ruler's own voice.</p></div>
    </div>
    <StandPanel stand={D.missionStand} labels={D.missionStand.verse ? [D.missionStand.verse] : []} />
  </>;
}
