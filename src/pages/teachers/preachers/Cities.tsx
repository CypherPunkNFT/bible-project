// Section 03 · Cities that gathered them (approved mock-up: design/authors-directions/teachers/cities.js). City cards,
// each with a line drawing of the town's best-known landmark; choosing one glides the map (Europe or America) onto it,
// drawing a line from where each teacher came, and the panel beside it lists who arrived when (each row opens the
// shared profile drawer).
import { useMemo, useState, type PointerEvent } from "react";
import { SectionHead } from "../shared/Frame";
import { familyOf, THIS_YEAR } from "../shared/people";
import { CityMap } from "./cities/CityMap";
import { dotStyle } from "./cities/frame";
import { LandmarkIcon } from "./cities/LandmarkIcon";
import { landmarkOf } from "./cities/landmarks";
import { countLabel, fitView, sharedCities, yearsLabel, type City } from "./cities/places";
import { usePreachers } from "./context";
import "./Cities.css";

export function Cities() {
  const { data } = usePreachers();
  const cities = useMemo(() => sharedCities(data), [data]);
  const projectors = useMemo(() => ({ europe: fitView(data, "europe"), america: fitView(data, "america") }), [data]);
  const [chosen, setChosen] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const city = cities[chosen] ?? cities[0];
  const choose = (i: number) => { setChosen(i); setLit(null); };

  return <>
    <SectionHead num="03" kicker="Places · where their paths met" title={<>Cities that <em>gathered them</em></>}
      line={`${cities.length} towns where two or more of these teachers lived. Choose one and the map flies there, with a line from where each of them came.`} />
    <div className="cty-rail" role="group" aria-label="Choose a city">
      {cities.map((c, i) => <CityCard key={c.name} city={c} pressed={c === city} onChoose={() => choose(i)} />)}
    </div>
    {city && <div className="cty-body">
      <CityMap city={city} view={data.views[city.view]} project={projectors[city.view]} lit={lit} />
      <WhoArrived city={city} onLight={setLit} />
    </div>}
  </>;
}

function CityCard({ city, pressed, onChoose }: { city: City; pressed: boolean; onChoose: () => void }) {
  return <button type="button" className="cty-card" aria-pressed={pressed} aria-label={`${city.name}, ${countLabel(city.stays.length)}`} onClick={onChoose}>
    <span className="cty-card-top"><LandmarkIcon name={city.name} size={38} className="cty-ico" /><span className="cty-card-years">{yearsLabel(city)}</span></span>
    <span className="cty-card-name">{city.name}</span>
    <span className="cty-card-count"><b>{city.stays.length}</b> teachers</span>
    <span className="cty-card-dots">{city.stays.map((s) => <i key={s.person.id} style={dotStyle(familyOf(s.person).tone)} />)}</span>
  </button>;
}

/** The panel beside the map: the city, its landmark, and a bar for the years each teacher lived there. */
function WhoArrived({ city, onLight }: { city: City; onLight: (stay: number | null) => void }) {
  const { openProfile } = usePreachers();
  const span = Math.max(1, city.last - city.first);
  const lightFrom = (e: PointerEvent<HTMLOListElement>) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-i]");
    onLight(row ? Number(row.dataset.i) : null);
  };
  return <div className="cty-panel">
    <div className="cty-panel-head">
      <span className="cty-panel-ico"><LandmarkIcon name={city.name} size={60} className="cty-ico cty-ico-lg" /></span>
      <div>
        <p className="kicker cty-kicker">{countLabel(city.stays.length)} · {yearsLabel(city)}</p>
        <h3 className="cty-title">{city.name}</h3>
        <p className="cty-landmark">{landmarkOf(city.name).label}</p>
      </div>
    </div>
    <p className="cty-note">Each bar is the years a teacher lived here; the line on the map shows where they came from.</p>
    <ol className="cty-stays" onPointerOver={lightFrom} onPointerLeave={() => onLight(null)}>
      {city.stays.map((s, i) => {
        const left = ((s.from - city.first) / span) * 100, width = Math.max(1.5, ((s.to - s.from) / span) * 100);
        const how = s.bornHere ? "born here" : s.cameFrom ? `from ${s.cameFrom}` : "birthplace unknown";
        const until = s.to >= THIS_YEAR && !s.person.died ? "today" : s.to;
        return <li key={`${city.name}-${s.person.id}`}>
          <button type="button" data-i={i} style={dotStyle(familyOf(s.person).tone)} onClick={(e) => openProfile(s.person.id, e.currentTarget)}>
            <span className="cty-yr">{s.from}</span>
            <span className="cty-who"><i /><b>{s.person.name}</b><small>{how} · until {until}{s.returned ? " · returned later" : ""}</small></span>
            <span className="cty-bar"><span style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} /></span>
          </button>
        </li>;
      })}
    </ol>
  </div>;
}
