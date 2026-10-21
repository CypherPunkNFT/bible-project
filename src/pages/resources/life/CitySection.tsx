// The city section of /resources/life (owner's layout, 2026-10-08; city picker added 2026-10-20): the USA map (every researched city is a dot that chooses it) on the left with the city marked, the
// city's sourced facts to its right, a rule, then the city's own zoomable map with its places beside it (CityMap.tsx). Choosing another city fades only that lower part out and in.
// Facts and map are separate data files (<city>-facts.json, <city>-map.json), loaded only when this section is drawn.
import { geoAlbersUsa } from "d3-geo";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useResource, type City, type CityFact, type CityFacts, type UsStates } from "@/data/resources";
import { dialable } from "../contact-links";
import { CityMap } from "./CityMap";
import { CITY_FILES, hostOf, kindOf, kindsIn, listOf, plural, tone, wayOf } from "./format";
import { attachZoom, placeMarks, type Zoom } from "./zoom";
import { ZoomButtons } from "./ZoomButtons";

export function CitySection({ city, cities, onPick, leaving, checked }: { city: City & { id: keyof typeof CITY_FILES }; cities: City[]; onPick: (id: string) => void; leaving?: boolean; checked: string }) {
  const files = CITY_FILES[city.id];
  const states = useResource("us-states"), facts = useResource(files.facts), map = useResource(files.map);
  const kinds = useMemo(() => kindsIn(city), [city]);
  return <section className="lf-city" aria-labelledby="lf-city-name">
    <div className="lf-city-top">
      {typeof states === "object" ? <UsaMap states={states} city={city} cities={cities} onPick={onPick} /> : <p className="lf-wait lf-wait-usa">{states === "loading" ? "Loading the map…" : "The map outline is missing."}</p>}
      <CityInfo city={city} facts={typeof facts === "object" ? facts : null} kinds={kinds} checked={city.checked ?? checked} />
    </div>
    <hr className="lf-city-rule" />
    {/* Only this lower part fades when another city is chosen; the USA map and the facts above it change in place. */}
    <div key={city.id} className="lf-city-lower" data-leaving={leaving || undefined}>
      {typeof map === "object" ? <CityMap city={city} map={map} kinds={kinds} /> : <p className="lf-wait lf-wait-city">{map === "loading" ? `Loading the map of ${city.name.split(",")[0]}…` : "The city map is missing."}</p>}
    </div>
  </section>;
}

function UsaMap({ states, city, cities, onPick }: { states: UsStates; city: City; cities: City[]; onPick: (id: string) => void }) {
  const svg = useRef<SVGSVGElement>(null), zoom = useRef<Zoom | null>(null);
  const project = useMemo(() => geoAlbersUsa().scale(states.scale).translate(states.translate), [states]);
  const at = useMemo(() => project([city.lon, city.lat]), [project, city]);
  const dots = useMemo(() => cities.flatMap((c) => { const xy = project([c.lon, c.lat]); return xy ? [{ c, xy }] : []; }), [project, cities]);
  const stateName = city.name.split(",")[1]?.trim();
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    zoom.current = attachZoom(el, { width: states.width, height: states.height, max: 8, onChange: (z) => { placeMarks(el, states.width); el.toggleAttribute("data-close", z >= 3); } });
    const resize = new ResizeObserver(() => placeMarks(el, states.width));
    resize.observe(el);
    return () => { zoom.current?.destroy(); zoom.current = null; resize.disconnect(); };
  }, [states]);
  // "Natural Earth 1:50m admin-1 states and provinces (lakes), v5.1.2, public domain" -> "Natural Earth 1:50m (public domain)".
  const credit = `${states.source?.match(/^Natural Earth [\d:]+m/)?.[0] ?? states.source ?? "Natural Earth"}${/public domain/i.test(states.source ?? "") ? " (public domain)" : ""}`;
  const focus = () => { if (at) zoom.current?.fit([at[0] - 70, at[1] - 50, at[0] + 70, at[1] + 50], 0); };
  return <figure className="lf-mapframe lf-usa"><div className="lf-stage">
    <svg ref={svg} viewBox={`0 0 ${states.width} ${states.height}`} style={{ aspectRatio: `${states.width} / ${states.height}` }} role="img" aria-label={`Map of the USA with ${city.name} marked`}>
      <g className="lf-states">{states.states.map((s) => <path key={s.id} d={s.d} data-on={s.name === stateName || undefined}><title>{s.name}</title></path>)}</g>
      {/* Every city is a small dot that shows its name on hover; the chosen one is drawn last, with its ring and name always on. A click on another dot chooses it. */}
      {[...dots].sort((a, b) => Number(a.c.id === city.id) - Number(b.c.id === city.id)).map(({ c, xy }) => {
        const on = c.id === city.id, label = c.name.split(",")[0];
        return <g key={c.id} className="lf-us-city lf-mark" data-x={xy[0]} data-y={xy[1]} data-on={on || undefined} role="button" tabIndex={0} aria-label={on ? `${label}, chosen; zoom to it` : `Show ${c.name}`}
          onClick={() => (on ? focus() : onPick(c.id))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (on) focus(); else onPick(c.id); } }}>
          <circle className="lf-hit" r={11} /><circle className="lf-ring" r={9} /><circle className="lf-dot" r={on ? 4 : 2.6} /><text x={-12} y={-8} textAnchor="end">{label}</text>
        </g>;
      })}
    </svg>
    <ZoomButtons zoom={zoom} />
  </div><figcaption>States: {credit}. Scroll or pinch to zoom.</figcaption></figure>;
}

function Source({ fact }: { fact: CityFact }) {
  return <a className="lf-src" href={fact.source} target="_blank" rel="noreferrer"><span className="lf-long">{fact.by}</span><span className="lf-short">{fact.by.split(",")[0]}</span> · checked {fact.checked}</a>;
}

/** "211": the city's own 211 line from life.json, with its other numbers and its text line. */
function Local211({ city }: { city: City }) {
  const line = city.lines?.find((l) => l.contact.some((c) => wayOf(c.kind) === "call" && dialable(c.value) === "211"));
  if (!line) return null;
  const phones = line.contact.filter((c) => wayOf(c.kind) === "call" && dialable(c.value) !== "211").map((c) => c.value);
  const texts = line.contact.filter((c) => wayOf(c.kind) === "text").map((c) => (c.note ? c.note.charAt(0).toLowerCase() + c.note.slice(1) : `text ${c.value}`));
  const also = [phones.length ? `also ${listOf(phones)}` : "", texts.length ? `or ${texts.join(", ")}` : ""].filter(Boolean).join(", ");
  return <div><dt>Local 211</dt><dd>
    <strong><a href="tel:211">211</a></strong>
    <span>{[line.name.replace(/\s*\((.*)\)/, " of $1"), line.hours, line.cost].filter(Boolean).join(" · ")}{also && `; ${also}`}</span>
    <a className="lf-src" href={line.source} target="_blank" rel="noreferrer">{hostOf(line.source)} · checked {line.checked}</a>
  </dd></div>;
}

function CityInfo({ city, facts, kinds, checked }: { city: City; facts: CityFacts | null; kinds: [string, number][]; checked: string }) {
  const f = Object.fromEntries((facts?.facts ?? []).map((x) => [x.id, x]));
  const n = (v: string | number) => v.toLocaleString("en-US");
  const [place, region] = [city.name.split(",")[0], city.name.split(",").slice(1).join(",").trim()];
  const lines = city.lines?.length ?? 0;
  return <div className="lf-city-info">
    <p className="lf-kick">02 · Local help</p>
    <h2 id="lf-city-name">{place}{region && <>, <em>{region}</em></>}</h2>
    <p className="lf-city-lead">{plural(city.entries.length, "place")} you can walk into and {plural(lines, "phone line")}, each checked on the organisation’s own page.</p>
    <dl className="lf-facts">
      {f.county && <div><dt>County</dt><dd><strong>{f.county.value}</strong><span>{f.county.note}</span><Source fact={f.county} /></dd></div>}
      {f["county-population"] && <div><dt>Population</dt><dd><strong>{n(f["county-population"].value)}</strong>
        <span>in {f.county?.value ?? "the county"}{f["city-population"] && <>, and {n(f["city-population"].value)} in the city of {place}</>}; {f["county-population"].note}</span><Source fact={f["county-population"]} /></dd></div>}
      {f["land-area"] && <div><dt>Area</dt><dd><strong>{f["land-area"].value} {f["land-area"].unit}</strong><span>of land, {f["land-area"].note}</span><Source fact={f["land-area"]} /></dd></div>}
      <Local211 city={city} />
      <div className="lf-by-kind"><dt>Checked here</dt><dd>
        <div className="lf-kind-bar" aria-hidden="true">{kinds.map(([k, c]) => <span key={k} style={{ flex: c, background: tone(k) }} />)}</div>
        <ul className="lf-kind-key">{kinds.map(([k, c]) => <li key={k} style={{ "--c": tone(k) } as CSSProperties}><i />{kindOf(k).short} <b>{c}</b></li>)}{lines > 0 && <li className="lf-lines"><i />Phone lines <b>{lines}</b></li>}</ul>
        <span className="lf-src lf-plain">{plural(city.entries.length, "place")} from this site’s list · checked {checked}</span>
      </dd></div>
    </dl>
  </div>;
}
