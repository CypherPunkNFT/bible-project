import { geoMercator } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import atlasMap from "@/data/atlas-map.json";
import { loadPlaces } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import type { MapLayer } from "@/data/letters/types";
import { useKeep } from "./letter-hooks";
import { ClaimText, KeepX, Refs } from "./LetterParts";

// The Atlas's own projection and land outline (src/data/atlas-map.json), so places sit exactly where the Atlas puts them.
const projection = geoMercator().scale(atlasMap.scale).translate(atlasMap.translate as [number, number]);
const LAYER_TONES = ["var(--lg)", "var(--poetry)", "var(--prophets)", "var(--revelation)", "var(--acts)", "var(--history)"];

const LEG_MS = 700; // time to travel one leg of a journey when it plays

/** Plays one route: t runs from 0 (first stop) to stops - 1 (last), along the legs in order. */
function usePlayback() {
  const [play, setPlay] = useState<{ id: string; t: number; stops: number; running: boolean } | null>(null);
  useEffect(() => {
    if (!play?.running) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPlay({ ...play, t: play.stops - 1, running: false }); return; }
    let frame = 0;
    const start = performance.now() - play.t * LEG_MS;
    const tick = (now: number) => {
      const t = Math.min(play.stops - 1, (now - start) / LEG_MS);
      setPlay((p) => (p && p.id === play.id ? { ...p, t, running: t < play.stops - 1 } : p));
      if (t < play.stops - 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when a different route starts or resumes
  }, [play?.id, play?.running]);
  return [play, setPlay] as const;
}

type Point = { name: string; x: number; y: number; layer: number; note?: string; letter?: string; refs?: MapLayer["stops"][number]["refs"] };

/** Routes and pins over the land outline, zoomed to the places shown; one toggle per layer. */
export function LetterMap({ layers, title, displayWidth = 1150 }: { layers: MapLayer[]; title: string; displayWidth?: number }) {
  const places = useAsync(loadPlaces, "places");
  // Busy maps open with their first four layers; the rest are a click away.
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(layers.slice(4).map((l) => l.id)));
  const keep = useKeep<string>();
  const keyOf = (p: Point) => `${p.layer}:${p.name}`;
  const [play, setPlay] = usePlayback();
  const byId = useMemo(() => new Map(places.status === "ready" ? places.value.map((p) => [p.id, p]) : []), [places]);
  if (places.status !== "ready") return <div className="lg-figure" style={{ minHeight: 320 }} />;

  const shown = layers.map((layer, i) => ({ layer, tone: LAYER_TONES[i % LAYER_TONES.length], index: i })).filter(({ layer }) => !hidden.has(layer.id));
  const points: Point[][] = shown.map(({ layer, index }) => layer.stops.flatMap((stop) => {
    const place = byId.get(stop.placeId);
    const xy = place ? projection([place.lon, place.lat]) : null;
    return xy ? [{ name: stop.name, x: xy[0], y: xy[1], layer: index, note: stop.note, letter: stop.letter, refs: stop.refs }] : [];
  }));
  const all = points.flat();
  const active = all.find((p) => keyOf(p) === keep.active);
  const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
  // Frame the places with a margin, then widen (never crop) to a calm 2:1 view, at least a region wide.
  const spread = all.length ? Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) : 0;
  const pad = Math.max(18, spread * 0.12);
  let [x0, x1, y0, y1] = all.length ? [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad] : [0, atlasMap.width, 0, atlasMap.height];
  const minW = all.length < 3 ? 160 : 90;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if ((x1 - x0) / (y1 - y0) < 2) { const c = (x0 + x1) / 2, w = (y1 - y0) * 2; x0 = c - w / 2; x1 = c + w / 2; }
  else { const c = (y0 + y1) / 2, h = (x1 - x0) / 2; y0 = c - h / 2; y1 = c + h / 2; }
  const labelAll = all.length <= 16; // on busier maps a name shows when you point at its place
  const scale = (x1 - x0) / displayWidth; // map units per screen pixel, so labels and pins keep their size
  const playing = play ? shown.find(({ layer }) => layer.id === play.id) : undefined;
  const playIndex = playing ? shown.indexOf(playing) : -1;
  const stopIndex = play ? Math.min(Math.round(play.t), (points[playIndex]?.length ?? 1) - 1) : -1;
  const current = playIndex >= 0 ? points[playIndex][stopIndex] : undefined;
  const isCurrent = (p: Point) => p === current;
  const start = (layer: MapLayer) => {
    setHidden((h) => { const next = new Set(h); next.delete(layer.id); return next; });
    setPlay({ id: layer.id, t: 0, stops: layer.stops.filter((s) => byId.has(s.placeId)).length, running: true });
  };
  const routes = layers.filter((l) => l.route);

  return <figure>
    <div className="lg-tabs" role="group" aria-label={`${title}: layers`}>
      {layers.map((layer, i) => <button key={layer.id} type="button" className="lg-tab" aria-pressed={!hidden.has(layer.id)}
        style={{ borderColor: hidden.has(layer.id) ? undefined : LAYER_TONES[i % LAYER_TONES.length] }}
        onClick={() => setHidden((h) => { const next = new Set(h); if (next.has(layer.id)) next.delete(layer.id); else next.add(layer.id); return next; })}>{layer.title}</button>)}
    </div>
    {routes.length > 0 && <div className="lg-play" role="group" aria-label="Play a journey">
      {routes.map((layer) => {
        const on = play?.id === layer.id;
        return <button key={layer.id} type="button" className="lg-play-button" aria-pressed={on}
          onClick={() => (on && play?.running ? setPlay({ ...play, running: false }) : on && play && play.t < play.stops - 1 ? setPlay({ ...play, running: true }) : start(layer))}>
          <span aria-hidden="true">{on && play?.running ? "❚❚" : "▶"}</span>{layer.title}{layer.years && <small>AD {layer.years[0]}–{layer.years[1]}</small>}
        </button>;
      })}
      {play && <button type="button" className="lg-play-button" onClick={() => setPlay(null)}>Reset</button>}
    </div>}
    {playing && current && <div className="lg-play-status" aria-live="polite">
      <strong>{playing.layer.title}</strong>
      <span className="lg-muted">{playing.layer.years ? `AD ${playing.layer.years[0]}–${playing.layer.years[1]}` : "in order"} · stop {stopIndex + 1} of {points[playIndex].length}</span>
      <span>{current.name}</span><Refs refs={current.refs} limit={2} />
      <div className="lg-play-progress"><i style={{ width: `${(play!.t / Math.max(1, points[playIndex].length - 1)) * 100}%` }} /></div>
    </div>}
    <div className="lg-figure" style={{ marginTop: ".75rem", borderRadius: 14, overflow: "hidden" }}>
      <svg viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={title} style={{ background: "color-mix(in srgb, var(--prophets) 10%, transparent)" }}>
        <path d={atlasMap.land} fill="color-mix(in srgb, var(--lg) 9%, var(--surface))" stroke="var(--lg-line)" strokeWidth={0.6 * scale} />
        {/* Routes rest faded and dotted; playing one draws it solid, leg by leg, with a glowing traveller. */}
        {shown.map(({ layer, tone }, li) => layer.route && points[li].length > 1 && <polyline key={layer.id} points={points[li].map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={tone} strokeWidth={2 * scale} strokeDasharray={`${5 * scale} ${4 * scale}`} strokeLinejoin="round" opacity={play ? 0.25 : 0.55} />)}
        {shown.map(({ layer, tone }, li) => {
          if (!play || play.id !== layer.id || points[li].length < 2) return null;
          const pts = points[li], whole = Math.floor(play.t), part = play.t - whole;
          const drawn = pts.slice(0, whole + 1);
          const next = pts[Math.min(whole + 1, pts.length - 1)];
          const tip = { x: pts[whole].x + (next.x - pts[whole].x) * part, y: pts[whole].y + (next.y - pts[whole].y) * part };
          return <g key={`play-${layer.id}`}>
            <polyline points={[...drawn, tip].map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={tone} strokeWidth={3 * scale} strokeLinejoin="round" strokeLinecap="round" className="lg-glow" />
            <circle cx={tip.x} cy={tip.y} r={7 * scale} fill={tone} opacity=".35" className="lg-glow" />
            <circle cx={tip.x} cy={tip.y} r={3.5 * scale} fill="var(--page)" stroke={tone} strokeWidth={2 * scale} />
          </g>;
        })}
        {points.flat().map((p, i) => <g key={i} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={p.name}
          className={keep.peek(keyOf(p)) ? "lg-peek" : undefined} {...keep.bind(keyOf(p))}>
          <circle r={(p.letter ? 6 : 4) * scale} fill={LAYER_TONES[p.layer % LAYER_TONES.length]} stroke="var(--page)" strokeWidth={1.2 * scale} className="lg-glow" />
          {(labelAll || (active && keyOf(active) === keyOf(p)) || isCurrent(p)) && <text x={(p.x > x1 - (x1 - x0) * 0.22 ? -8 : 8) * scale} y={4 * scale} textAnchor={p.x > x1 - (x1 - x0) * 0.22 ? "end" : "start"} style={{ font: `${11 * scale}px var(--font-sans)`, fill: "var(--ink)", paintOrder: "stroke", stroke: "var(--page)", strokeWidth: 3 * scale }}>{p.name}</text>}
        </g>)}
      </svg>
    </div>
    <div className="lg-tip" aria-live="polite">
      {active ? <><strong>{active.name}</strong>{keep.kept && <KeepX onRelease={keep.release} />}{active.letter && <span className="lg-muted"> · letter: {active.letter}</span>}{active.note && <span className="lg-muted"> · {active.note}</span>}<Refs refs={active.refs} /></>
        : <span className="lg-muted">Point at a place; click to keep it. Places from OpenBible.info (CC BY); land outline from Natural Earth.</span>}
    </div>
    {shown.map(({ layer }) => <ClaimText key={layer.id} claim={layer.claim} className="lg-caption" />)}
  </figure>;
}
