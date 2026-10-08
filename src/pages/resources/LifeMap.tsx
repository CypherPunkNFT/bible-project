// The USA map on /resources/life: the states pre-drawn by scripts/build-us-states.mjs (Natural Earth, Albers USA), and
// a point for every researched city that has places in life.json. Choosing a city opens a local map under the USA map
// (rings of distance from city hall, a numbered pin per place in its true direction) and, beside it, its places and phone lines, by kind.
import { geoAlbersUsa } from "d3-geo";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { City, LocalHelp, LocalLine, UsStates } from "@/data/resources";
import { ContactLine, EntryMeta, Hours } from "./Contacts";
import { Checked } from "./Shell";

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace(/[-_]/g, " ");
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const listOf = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`);
const activate = (fn: () => void) => (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

export function LifeMap({ states, cities }: { states: UsStates; cities: City[] }) {
  const drawn = useMemo(() => cities.filter((c) => c.entries.length > 0).sort((a, b) => a.name.localeCompare(b.name)), [cities]);
  // With a single city there is nothing to choose: it opens at once.
  const [view, setView] = useState<{ city: string | null; kind: string }>({ city: drawn.length === 1 ? drawn[0].id : null, kind: "all" });
  const [lit, setLit] = useState<string | null>(null);
  const projection = useMemo(() => geoAlbersUsa().scale(states.scale).translate(states.translate), [states]);
  const city = drawn.find((c) => c.id === view.city);
  const choose = (id: string) => { setView({ city: id === view.city && drawn.length > 1 ? null : id, kind: "all" }); setLit(null); };
  const shown = useMemo(() => (city ? city.entries.filter((e) => view.kind === "all" || e.category === view.kind) : []), [city, view.kind]);
  const points = drawn.map((c) => ({ city: c, at: projection([c.lon, c.lat]) })).filter((p): p is { city: City; at: [number, number] } => p.at !== null);
  return <div className="rs-atlas" data-city={city ? "" : undefined}>
    <div className="rs-usa">
      <svg viewBox={`0 0 ${states.width} ${states.height}`} role="group" aria-label={`Map of the USA with ${plural(points.length, "city", "cities")} that have places listed`}>
        <g>{states.states.map((s) => <path key={s.id} className="rs-state" d={s.d}><title>{s.name}</title></path>)}</g>
        <g>{points.map(({ city: c, at: [x, y] }) => {
          const on = c.id === view.city, r = 4 + Math.min(6, Math.sqrt(c.entries.length) * 1.4);
          return <g key={c.id} className="rs-city" data-on={on || undefined} transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}
            role="button" tabIndex={0} aria-pressed={on} aria-label={`${c.name}: ${plural(c.entries.length, "place")}`}
            onClick={() => choose(c.id)} onKeyDown={activate(() => choose(c.id))}>
            <circle className="rs-halo" r={r + 6} /><circle className="rs-dot" r={on ? r + 1.5 : r} />
            <text x={r + 5} y={4}>{c.name.split(",")[0]}</text>
          </g>;
        })}</g>
      </svg>
      {drawn.length > 1 && <div className="rs-city-list" role="group" aria-label="Cities">
        {drawn.map((c) => <button key={c.id} type="button" aria-pressed={c.id === view.city} onClick={() => choose(c.id)}>{c.name}<small>{c.entries.length}</small></button>)}
      </div>}
      {city && <div className="rs-mini-wrap">
        <p className="rs-mini-cap">{city.name}{view.kind !== "all" ? ` · ${sentence(view.kind)}` : ""}</p>
        <LocalMap city={city} entries={shown} lit={lit} onLight={setLit} />
        <p className="rs-geocode">Each place is located from its address{geocoders(city.entries)}. The dot at the centre is city hall; each place keeps its true direction from it, and distance is drawn on a square-root scale, so read it from the rings.</p>
      </div>}
    </div>
    {city ? <CityPanel key={city.id} city={city} shown={shown} kind={view.kind} onKind={(kind) => setView({ city: city.id, kind })} lit={lit} onLight={setLit} />
      : <p className="rs-pick"><strong>Choose a city</strong>Each point is a city with places we have checked ({listOf([...new Set(drawn.flatMap((c) => c.entries.map((e) => e.category)))].sort())}), each with its address, its hours and how to reach it, and the local lines you can call.</p>}
  </div>;
}

interface PanelProps { city: City; shown: LocalHelp[]; kind: string; onKind: (kind: string) => void; lit: string | null; onLight: (id: string | null) => void }

function CityPanel({ city, shown, kind, onKind, lit, onLight }: PanelProps) {
  const kinds = [...new Set(city.entries.map((e) => e.category))].sort();
  return <section className="rs-local" aria-label={`Places in ${city.name}`}>
    <h3>{city.name}</h3>
    <p>{plural(city.entries.length, "place")}{city.lines?.length ? ` · ${plural(city.lines.length, "phone line")}` : ""}</p>
    {kinds.length > 1 && <div className="tl-chips" role="group" aria-label="Kind of help">
      <span>Show</span>
      {[["all", "Everything"], ...kinds.map((k) => [k, sentence(k)])].map(([id, text]) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => onKind(id)}>{text}</button>)}
    </div>}
    <ol className="rs-local-list">{shown.map((e, i) => <LocalEntry key={e.id} entry={e} n={i + 1} lit={lit === e.id} onLight={onLight} />)}</ol>
    {city.lines && city.lines.length > 0 && <>
      <h4 className="rs-lines-title">Phone lines <small>no walk-in address</small></h4>
      <ul className="rs-local-list">{city.lines.map((l) => <PhoneLine key={l.id} line={l} />)}</ul>
    </>}
  </section>;
}

const S = 340, MID = S / 2, R = S / 2 - 22, PIN = 9;
const RINGS = [1, 2, 5, 10, 20, 50, 100];

/** Pins that would overlap are pushed apart a little; each keeps a thin line back to its true spot. */
function spread(spots: [number, number][]): [number, number][] {
  const at = spots.map(([x, y]) => [x, y] as [number, number]);
  for (let round = 0; round < 80; round++) {
    let moved = false;
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) {
      const dx = at[j][0] - at[i][0], dy = at[j][1] - at[i][1], d = Math.hypot(dx, dy), need = PIN * 2 + 1.5;
      if (d >= need) continue;
      const push = (need - d) / 2, ux = d > 0.01 ? dx / d : Math.cos(i + j), uy = d > 0.01 ? dy / d : Math.sin(i + j);
      at[i][0] -= ux * push; at[i][1] -= uy * push; at[j][0] += ux * push; at[j][1] += uy * push; moved = true;
    }
    if (!moved) break;
  }
  return at.map(([x, y]) => [Math.min(S - PIN, Math.max(PIN, x)), Math.min(S - PIN, Math.max(PIN, y))]);
}

/**
 * A distance map around city hall: each place keeps its true direction, and its distance is drawn on a square-root
 * scale (the rings say how far), so the many places near the centre stay apart while the far ones still fit.
 */
function LocalMap({ city, entries, lit, onLight }: { city: City; entries: LocalHelp[]; lit: string | null; onLight: (id: string | null) => void }) {
  const { rings, pins, radius } = useMemo(() => {
    const located = entries.filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon));
    const far = Math.max(1, ...located.map((e) => miles(city, e)));
    const scale = (d: number) => Math.sqrt(d / far) * R;
    const spots = located.map((e) => {
      const d = miles(city, e), east = (e.lon - city.lon) * Math.cos((city.lat * Math.PI) / 180), north = e.lat - city.lat, len = Math.hypot(east, north) || 1;
      return [MID + (east / len) * scale(d), MID - (north / len) * scale(d)] as [number, number];
    });
    const moved = spread(spots);
    const chosen = RINGS.filter((r) => r <= far * 1.05).slice(-3);
    return { radius: scale, rings: chosen.length ? chosen : [RINGS[0]], pins: located.map((e, i) => ({ e, at: spots[i], pin: moved[i] })) };
  }, [city, entries]);
  return <svg className="rs-mini" viewBox={`0 0 ${S} ${S}`} role="group" aria-label={`How far the places in ${city.name} are from city hall`}>
    {rings.map((r) => {
      const rr = radius(r), a = -Math.PI / 4;
      return <g key={r}><circle className="rs-ring" cx={MID} cy={MID} r={rr} /><text className="rs-ring-label" x={MID + Math.cos(a) * rr + 3} y={MID + Math.sin(a) * rr - 3}>{r} MI</text></g>;
    })}
    <circle className="rs-centre" cx={MID} cy={MID} r={2.4} />
    <text className="rs-ring-label" x={MID - 3} y={12}>N</text>
    {pins.map(({ e, at, pin }) => Math.hypot(pin[0] - at[0], pin[1] - at[1]) > 2 && <g key={`${e.id}-true`} className="rs-true"><line x1={at[0]} y1={at[1]} x2={pin[0]} y2={pin[1]} /><circle cx={at[0]} cy={at[1]} r={1.6} /></g>)}
    {pins.map(({ e, pin }) => <g key={e.id} className="rs-pin" data-on={lit === e.id || undefined} transform={`translate(${pin[0].toFixed(1)},${pin[1].toFixed(1)})`}
      onMouseEnter={() => onLight(e.id)} onMouseLeave={() => onLight(null)} onClick={() => onLight(lit === e.id ? null : e.id)}>
      <circle r={PIN} /><text>{entries.indexOf(e) + 1}</text><title>{`${e.name}: ${miles(city, e).toFixed(1)} miles from city hall`}</title>
    </g>)}
  </svg>;
}

/** " by the US Census Bureau geocoder or OpenStreetMap Nominatim", from each place's geocode note. */
function geocoders(entries: LocalHelp[]) {
  const names = [...new Set(entries.map((e) => (e.geocode ?? "").split(" (")[0].trim()).filter(Boolean))];
  return names.length ? ` by the ${names.join(" or ")}` : "";
}

/** Great-circle distance in miles. */
function miles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

function LocalEntry({ entry: e, n, lit, onLight }: { entry: LocalHelp; n: number; lit: boolean; onLight: (id: string | null) => void }) {
  return <li className="rs-local-entry" data-on={lit || undefined} onMouseEnter={() => onLight(e.id)} onMouseLeave={() => onLight(null)}>
    <b aria-hidden="true">{n}</b>
    <div>
      <h4>{e.name}</h4>
      <address>{sentence(e.category)} · {e.address}</address>
      {e.summary && <p className="rs-entry-sum">{e.summary}</p>}
      <EntryMeta entry={e} />
      <div className="rs-contacts"><Hours hours={e.hours} />{e.contact.map((c) => <ContactLine key={`${c.kind}-${c.value}`} contact={c} />)}</div>
      <Checked date={e.checked} source={e.source} />
    </div>
  </li>;
}

function PhoneLine({ line: l }: { line: LocalLine }) {
  return <li className="rs-local-entry rs-line">
    <b aria-hidden="true" />
    <div>
      <h4>{l.name}</h4>
      {l.summary && <p className="rs-entry-sum">{l.summary}</p>}
      <EntryMeta entry={l} />
      <div className="rs-contacts"><Hours hours={l.hours} />{l.contact.map((c) => <ContactLine key={`${c.kind}-${c.value}`} contact={c} />)}</div>
      <Checked date={l.checked} source={l.source} />
    </div>
  </li>;
}
