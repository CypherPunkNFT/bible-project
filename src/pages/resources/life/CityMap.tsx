// A city's own map (US Census Bureau TIGER/Line, scripts/build-city-maps.py) with its places beside it. The list starts
// level with the map's top and scrolls on its own; pointing at a pin lights its row, and clicking a pin chooses it: the row opens, stays
// highlighted and the list glides to it. Choosing a row lights its pin.
// When another city is chosen, what changes (the map's drawing, its kind chips, the places and the heading's words) is marked lf-fade and fades; the map's square, the panel's box and
// header bar, and the zoom and view buttons stay.
// Kind filters show some kinds only; County and Downtown jump the map; the wheel, a pinch or the buttons zoom it.
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import type { City, CityMap as CityMapData } from "@/data/resources";
import { centreLabel, centreWords, compass, kindOf, LIFE_WORDS, miles, tone, type CityWords } from "./format";
import { ZoomButtons } from "./ZoomButtons";
import { LifeRow } from "./Row";
import { attachZoom, placeMarks, type Zoom } from "./zoom";

const PIN = 10.5;
type View = "county" | "downtown" | null;

const waterName = (s: string) => s.replace(/\bRiv\b/, "River").replace(/\bLk\b/, "Lake").replace(/^St /, "St. ");

/** The map itself: land, water, roads and labels. Drawn once; zooming moves the viewBox, not React. */
const Layers = memo(function Layers({ map, hall, hallName }: { map: CityMapData; hall: [number, number]; hallName: string }) {
  const { width: W, height: H } = map;
  return <>
    <rect className="lf-sea" width={W} height={H} />
    <path className="lf-around" d={map.land.around} />
    <path className="lf-duval" d={map.land.county} />
    <path className="lf-streets" d={map.roads.streets} />
    <path className="lf-water" d={map.water} />
    <path className="lf-road2" d={map.roads.secondary} />
    <path className="lf-road1" d={map.roads.primary} />
    <path className="lf-county-line" d={map.land.county} />
    <g>
      {map.waterLabels.filter((w) => !/Atlantic/.test(w.name)).slice(0, 4).map((w) => <g key={w.name} className="lf-mark lf-lab lf-water-lab" data-x={w.x} data-y={w.y}><text>{waterName(w.name)}</text></g>)}
      {map.waterLabels.some((w) => /Atlantic/.test(w.name)) && <g className="lf-mark lf-lab lf-sea-lab" data-x={W - 34} data-y={H * 0.62}><text transform="rotate(90)">Atlantic Ocean</text></g>}
      {map.places.map((p) => <g key={p.name} className="lf-mark lf-lab lf-town-lab" data-out={p.county ? undefined : ""} data-x={p.x} data-y={p.y}><text>{p.name}</text></g>)}
      {map.roadLabels.map((r) => <g key={r.name} className="lf-mark lf-lab lf-road-lab" data-x={r.x} data-y={r.y}><rect x={-17} y={-8} width={34} height={16} rx={4} /><text>{r.name}</text></g>)}
      <g className="lf-mark lf-lab lf-hall" data-x={hall[0]} data-y={hall[1]}><rect x={-3.5} y={-3.5} width={7} height={7} transform="rotate(45)" /><text x={8} y={-7}>{hallName}</text></g>
    </g>
  </>;
});


interface PinProps { id: string; name: string; category: string; n: number; at: [number, number]; off: boolean; on: boolean; sel: boolean; onLit: (id: string | null) => void; onChoose: (id: string) => void }

/** One pin. Memoised: pointing at a row or pin re-draws only the two pins involved, not all of them. */
const Pin = memo(function Pin({ id, name, category, n, at, off, on, sel, onLit, onChoose }: PinProps) {
  return <g className="lf-pin" data-id={id} data-cat={category} data-x={at[0]} data-y={at[1]} data-off={off ? "" : undefined} data-on={on || undefined} data-sel={sel || undefined}
    style={{ "--c": tone(category) } as CSSProperties} role="button" tabIndex={-1} aria-label={`${n}. ${name}`} onPointerEnter={() => onLit(id)} onPointerLeave={() => onLit(null)} onClick={() => onChoose(id)}>
    <circle className="lf-halo" r={16} /><circle className="lf-disc" r={10} /><text>{n}</text>
  </g>;
});

/** Eases a scroll box so the row sits in its middle (owner, 2026-10-22: "smack in the middle"), or its top when the row is taller than the box,
 *  following the row for half a second while rows above it open or close; a wheel, touch or key press hands the scroll back. */
function glideToRow(box: HTMLElement, row: HTMLElement): () => void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0, last = performance.now();
  const start = last;
  const stop = () => { cancelAnimationFrame(frame); for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) box.removeEventListener(ev, stop); };
  const want = () => {
    const top = row.offsetTop - box.offsetTop, height = row.offsetHeight;
    return height > box.clientHeight - 16 ? top - 8 : top + (height - box.clientHeight) / 2;
  };
  const step = (now: number) => {
    const goal = Math.max(0, Math.min(want(), box.scrollHeight - box.clientHeight)), gap = goal - box.scrollTop;
    box.scrollTop = reduced || Math.abs(gap) < 1 ? goal : box.scrollTop + gap * (1 - Math.exp(-(now - last) / 120));
    last = now;
    if (now - start < 1200 && (now - start < 500 || Math.abs(gap) >= 1)) frame = requestAnimationFrame(step); else stop();
  };
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) box.addEventListener(ev, stop, { passive: true, once: true });
  frame = requestAnimationFrame(step);
  return stop;
}

export function CityMap({ city, map, kinds, words = LIFE_WORDS }: { city: City; map: CityMapData; kinds: [string, number][]; words?: CityWords }) {
  const P = map.projection;
  const project = useCallback((lon: number, lat: number): [number, number] => [(lon - P.west) * P.cos * P.k, (P.north - lat) * P.k], [P]);
  const places = useMemo(() => city.entries.map((e, i) => ({ e, n: i + 1, at: project(e.lon, e.lat) })), [city, project]);
  const hall = useMemo(() => project(city.lon, city.lat), [city, project]);
  const [shown, setShown] = useState<Set<string>>(() => new Set(kinds.map(([k]) => k)));
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  const [view, setView] = useState<View>("county");
  const svg = useRef<SVGSVGElement>(null), leaders = useRef<SVGGElement>(null), list = useRef<HTMLDivElement>(null), zoom = useRef<Zoom | null>(null);
  const shownRef = useRef(shown), openRef = useRef(open), selectedRef = useRef(selected), stopGlide = useRef<() => void>(() => {});
  shownRef.current = shown;
  openRef.current = open;
  selectedRef.current = selected;
  const placeIds = useMemo(() => new Set(city.entries.map((e) => e.id)), [city]);
  useEffect(() => () => stopGlide.current(), []);
  // Rows passing under a still pointer while the list scrolls must not light up (each one would redraw the map): they light once the scrolling stops.
  const overList = useRef<[number, number] | null>(null), scrolling = useRef(false);
  const lightRow = useCallback((id: string | null) => { if (!(scrolling.current && id)) setLit(id); }, []);

  /** Pins that would overlap at this zoom are pushed apart, each with a thin line back to its true spot. */
  const layoutPins = useCallback(() => {
    const el = svg.current;
    if (!el || !leaders.current) return;
    const px = Number(el.dataset.px) || 1;
    const live = [...el.querySelectorAll<SVGGElement>(".lf-pin")].filter((p) => shownRef.current.has(p.dataset.cat ?? ""));
    const at = live.map((p) => [Number(p.dataset.x) / px, Number(p.dataset.y) / px]);
    const pos = at.map(([x, y]) => [x, y]);
    for (let round = 0; round < 60; round++) {
      let moved = false;
      for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy), need = PIN * 2 + 2;
        if (d >= need) continue;
        const push = (need - d) / 2, ux = d > 0.01 ? dx / d : Math.cos(i + j), uy = d > 0.01 ? dy / d : Math.sin(i + j);
        pos[i][0] -= ux * push; pos[i][1] -= uy * push; pos[j][0] += ux * push; pos[j][1] += uy * push; moved = true;
      }
      if (!moved) break;
    }
    const marks: SVGElement[] = [];
    const svgEl = <K extends "line" | "circle">(name: K, attrs: Record<string, string>, c: string) => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", name);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      node.style.setProperty("--c", c);
      return node;
    };
    live.forEach((p, i) => {
      const x = (pos[i][0] * px).toFixed(2), y = (pos[i][1] * px).toFixed(2), c = tone(p.dataset.cat ?? ""), x0 = p.dataset.x ?? "0", y0 = p.dataset.y ?? "0";
      p.setAttribute("transform", `translate(${x} ${y}) scale(${px})`);
      if (Math.hypot(pos[i][0] - at[i][0], pos[i][1] - at[i][1]) > 3) marks.push(svgEl("line", { x1: x0, y1: y0, x2: x, y2: y }, c), svgEl("circle", { cx: x0, cy: y0, r: (1.8 * px).toFixed(2) }, c));
    });
    leaders.current.replaceChildren(...marks);
  }, []);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const redraw = () => { placeMarks(el, map.width); layoutPins(); };
    zoom.current = attachZoom(el, { width: map.width, height: map.height, max: 14, onChange: (z) => { el.dataset.z = z > 2.2 ? "near" : "far"; redraw(); } });
    const resize = new ResizeObserver(redraw);
    resize.observe(el);
    // On a phone the whole county is too small to read: start on the places themselves.
    if (matchMedia("(max-width: 600px)").matches) {
      const xs = places.map((q) => q.at[0]), ys = places.map((q) => q.at[1]);
      zoom.current.fit([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], 0.12);
      setView(null);
    }
    return () => { zoom.current?.destroy(); zoom.current = null; resize.disconnect(); };
  }, [map, places, layoutPins]);
  useLayoutEffect(layoutPins, [shown, selected, layoutPins]);

  useEffect(() => {
    const box = list.current?.closest<HTMLElement>(".outside-scroll-viewport");
    if (!box) return;
    let timer = 0;
    const onScroll = () => {
      scrolling.current = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        scrolling.current = false;
        const at = overList.current;
        if (!at) return;
        const row = document.elementFromPoint(at[0], at[1])?.closest<HTMLElement>(".lf-row[data-id]");
        setLit(row && box.contains(row) ? row.dataset.id ?? null : null);
      }, 140);
    };
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => { box.removeEventListener("scroll", onScroll); window.clearTimeout(timer); };
  }, []);

  const scrollRow = useCallback((id: string) => {
    // `list` marks the list's content; the area that scrolls is OutsideScroll's viewport around it.
    const box = list.current?.closest<HTMLElement>(".outside-scroll-viewport"), row = box?.querySelector<HTMLElement>(`.lf-row[data-id="${CSS.escape(id)}"]`);
    if (!box || !row || getComputedStyle(box).overflowY === "visible") return;
    stopGlide.current();
    stopGlide.current = glideToRow(box, row);
  }, []);
  const select = useCallback((id: string | null) => {
    setSelected(id);
    const place = id ? places.find((q) => q.e.id === id) : null;
    if (place) zoom.current?.reveal(place.at[0], place.at[1]);
  }, [places]);
  const choosePin = useCallback((id: string) => {
    setOpen((prev) => new Set([...prev].filter((x) => !placeIds.has(x)).concat(id)));
    select(id);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollRow(id)));
  }, [placeIds, select, scrollRow]);
  const toggle = useCallback((id: string) => {
    const opening = !openRef.current.has(id);
    setOpen((prev) => { const next = new Set(prev); if (opening) next.add(id); else next.delete(id); return next; });
    if (placeIds.has(id)) select(opening ? id : selectedRef.current === id ? null : selectedRef.current);
  }, [placeIds, select]);
  const filter = (k: string) => setShown((prev) => {
    // The first tap shows only that kind; later taps add or remove kinds; switching the last one off shows all again.
    const next = prev.size === kinds.length ? new Set([k]) : new Set(prev);
    if (prev.size !== kinds.length) { if (next.has(k)) next.delete(k); else next.add(k); }
    return next.size ? next : new Set(kinds.map(([kk]) => kk));
  });
  const jump = (v: Exclude<View, null>) => {
    setView(v);
    if (v === "county") zoom.current?.reset();
    else { const d = (2.2 / 69) * P.k; zoom.current?.fit([hall[0] - d * 1.2, hall[1] - d, hall[0] + d * 1.2, hall[1] + d], 0); }
  };

  const subs = useMemo(() => new Map(city.entries.map((e) => {
    const d = miles(city, e);
    return [e.id, `${words.tag(e)}  ·  ${d < 0.5 ? `downtown, by ${centreWords(city)}` : `${d.toFixed(1)} mi ${compass(city, e)} of ${centreWords(city)}`}`];
  })), [city, words]);
  const ordered = selected ? [...places.filter((q) => q.e.id !== selected), ...places.filter((q) => q.e.id === selected)] : places;
  const lines = city.lines ?? [];
  return <div className="lf-city-main">
    <figure className="lf-mapframe lf-jax"><div className="lf-stage">
      <div className="lf-map-filter lf-fade" role="group" aria-label="Show on the map">{kinds.map(([k, c]) => <button key={k} type="button" aria-pressed={shown.has(k)} style={{ "--c": tone(k) } as CSSProperties} onClick={() => filter(k)}><i />{kindOf(k).short}<b>{c}</b></button>)}</div>
      <svg ref={svg} className="lf-fade" viewBox={`0 0 ${map.width} ${map.height}`} style={{ aspectRatio: `${map.width} / ${map.height}` }} role="group" aria-label={`Map of ${city.name.split(",")[0]} and ${map.about.split(",")[0]} with the ${city.entries.length} places`}>
        <Layers map={map} hall={hall} hallName={centreLabel(city)} />
        <g ref={leaders} className="lf-leaders" />
        <g>{ordered.map(({ e, n, at }) => <Pin key={e.id} id={e.id} name={e.name} category={e.category} n={n} at={at} off={!shown.has(e.category)} on={lit === e.id} sel={selected === e.id} onLit={setLit} onChoose={choosePin} />)}</g>
      </svg>
      <div className="lf-map-views" role="group" aria-label="View">{(["county", "downtown"] as const).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => jump(v)}>{v === "county" ? "County" : "Downtown"}</button>)}</div>
      <ZoomButtons zoom={zoom} onReset={() => setView("county")} />
    </div>
    </figure>
    {/* Pointing at a pin only lights it; the list scrolls when a pin is clicked (owner, 2026-10-08). The places in a panel as tall as the map: a header, then the list scrolling with the pill outside the edge. */}
    <div className="lf-places">
      <header className="lf-places-head">
        <h3 className="lf-fade">{words.title(city.name.split(",")[0])}</h3>
        <p className="lf-fade">{words.count(city.entries.length, lines.length)}</p>
      </header>
      <OutsideScroll className="lf-places-scroll lf-fade" viewportClassName="lf-city-list" label={words.title(city.name)} resetKey={city.id}>
      <div ref={list} onPointerMove={(e) => { overList.current = [e.clientX, e.clientY]; }} onPointerLeave={() => { overList.current = null; }}>
      <ol aria-label={words.title(city.name)}>{places.map(({ e, n }) => <LifeRow key={e.id} entry={e} kind={e.category} layout="stack" n={n} quick={1} address
        sub={subs.get(e.id)} open={open.has(e.id)} onToggle={toggle} lit={lit === e.id} selected={selected === e.id}
        hidden={!shown.has(e.category)} onLit={lightRow} />)}</ol>
      {lines.length > 0 && <>
        <h3 className="lf-lines-head">Phone lines <small>no walk-in address</small></h3>
        <ol aria-label={`Phone lines in ${city.name}`}>{lines.map((l) => <LifeRow key={l.id} entry={l} kind={l.category ?? "crisis"} layout="stack" quick={2} address open={open.has(l.id)} onToggle={toggle} />)}</ol>
      </>}
      </div>
      </OutsideScroll>
    </div>
  </div>;
}
