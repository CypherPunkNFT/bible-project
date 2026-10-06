import { geoNaturalEarth1 } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { ArrowRight, Globe, Maximize, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { formatTestimonyDate } from "@/lib/testimonies";
import type { TestimonyPin } from "@/lib/testimony-contract";

interface WorldMap { width: number; height: number; scale: number; translate: [number, number]; sphere: string; land: string; borders: string }
interface Place { key: string; x: number; y: number; label: string; people: TestimonyPin[] }
interface Props { pins: TestimonyPin[] | null; error: string; selectedId: string; onOpen: (id: string) => void }

const countryNames = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
function placeLabel(pin: TestimonyPin) {
  const country = pin.country ? countryNames?.of(pin.country) ?? pin.country : "";
  return [pin.city, country].filter(Boolean).join(", ") || "Unknown place";
}

/** Every public testimony at the approximate place it was first published. Pins at one place share a dot. */
export function TestimonyWorldMap({ pins, error, selectedId, onOpen }: Props) {
  const [map, setMap] = useState<WorldMap | null>(null), [mapError, setMapError] = useState("");
  const [openKey, setOpenKey] = useState("");
  const viewport = useRef<HTMLDivElement>(null), layer = useRef<SVGGElement>(null), dots = useRef<HTMLDivElement>(null);
  const percentage = useRef<HTMLOutputElement>(null), behaviour = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const fit = useRef(() => {}), whole = useRef(1);

  // The drawing is ~100 KB compressed, so it loads only when someone opens the map.
  useEffect(() => {
    let active = true;
    import("@/data/world-map.json").then((module) => { if (active) setMap(module.default as WorldMap); }).catch(() => { if (active) setMapError("The world map could not be loaded. Please try again."); });
    return () => { active = false; };
  }, []);

  const places = useMemo(() => {
    if (!map || !pins) return [];
    const projection = geoNaturalEarth1().scale(map.scale).translate(map.translate);
    const grouped = new Map<string, Place>();
    for (const pin of pins) {
      const key = pin.latitude.toFixed(1) + "," + pin.longitude.toFixed(1), point = projection([pin.longitude, pin.latitude]);
      if (!point) continue;
      const place = grouped.get(key) ?? { key, x: point[0], y: point[1], label: placeLabel(pin), people: [] };
      place.people.push(pin); grouped.set(key, place);
    }
    return [...grouped.values()];
  }, [map, pins]);
  const open = places.find((place) => place.key === openKey);

  useEffect(() => {
    const element = viewport.current;
    if (!element || !map) return;
    const selection = select(element);
    const place = (transform: ZoomTransform) => {
      layer.current?.setAttribute("transform", transform.toString());
      for (const dot of Array.from(dots.current?.children ?? []) as HTMLElement[]) dot.style.transform = `translate(${transform.applyX(Number(dot.dataset.x))}px, ${transform.applyY(Number(dot.dataset.y))}px)`;
      if (percentage.current) percentage.current.value = `${Math.round((transform.k / whole.current) * 100)}%`;
    };
    const zoomer = zoom<HTMLDivElement, unknown>().clickDistance(6).duration(0)
      .on("start", () => element.classList.add("is-moving"))
      .on("zoom", ({ transform }: { transform: ZoomTransform }) => place(transform))
      .on("end", () => element.classList.remove("is-moving"));
    behaviour.current = zoomer;
    selection.call(zoomer);
    const preventScroll = (event: WheelEvent) => event.preventDefault();
    element.addEventListener("wheel", preventScroll, { passive: false });
    fit.current = () => {
      const w = element.clientWidth, h = element.clientHeight;
      if (!w || !h) return;
      const scale = Math.min((w - 24) / map.width, (h - 64) / map.height); whole.current = scale;
      zoomer.scaleExtent([scale * .8, scale * 24]).translateExtent([[-map.width * .1, -map.height * .1], [map.width * 1.1, map.height * 1.1]]);
      selection.call(zoomer.transform, zoomIdentity.translate((w - map.width * scale) / 2, (h - 48 - map.height * scale) / 2).scale(scale));
    };
    fit.current();
    const observer = new ResizeObserver(() => fit.current());
    observer.observe(element);
    return () => { observer.disconnect(); selection.on(".zoom", null); element.removeEventListener("wheel", preventScroll); behaviour.current = null; };
  }, [map]);

  // New dots take the current transform as soon as they render.
  useEffect(() => { if (viewport.current && behaviour.current) select(viewport.current).call(behaviour.current.transform, zoomTransform(viewport.current)); }, [places]);

  function zoomBy(factor: number) { if (viewport.current && behaviour.current) select(viewport.current).call(behaviour.current.scaleBy, factor); }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const element = viewport.current, zoomer = behaviour.current;
    if (!element || !zoomer || event.target !== element) return;
    const shifts: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
    if (shifts[event.key]) { event.preventDefault(); const [x, y] = shifts[event.key], k = zoomTransform(element).k; select(element).call(zoomer.translateBy, x / k, y / k); }
    else if (["+", "=", "-", "0", "Home"].includes(event.key)) { event.preventDefault(); if (event.key === "0" || event.key === "Home") fit.current(); else zoomBy(event.key === "-" ? 1 / 1.4 : 1.4); }
  }
  function choose(place: Place) { if (place.people.length === 1) { setOpenKey(""); onOpen(place.people[0].id); } else setOpenKey(place.key === openKey ? "" : place.key); }

  const status = mapError || error || (!map || !pins ? "Loading the world map…" : places.length === 0 ? "No testimonies are on the map yet. Each new story appears where it was shared." : "");
  return <div className="testimony-tree-stage testimony-world-stage">
    <div ref={viewport} className="testimony-map-viewport testimony-world-viewport" tabIndex={0} role="region" aria-label="World map of testimonies" aria-describedby="testimony-world-help" onKeyDown={keyboard}>
      {map && <svg className="testimony-world-drawing" aria-hidden="true"><g ref={layer}>
        <path className="testimony-world-sea" d={map.sphere} /><path className="testimony-world-land" d={map.land} /><path className="testimony-world-borders" d={map.borders} />
      </g></svg>}
      <div ref={dots} className="testimony-world-dots">{places.map((place) => {
        const selected = place.people.some((person) => person.id === selectedId);
        return <button key={place.key} type="button" data-x={place.x} data-y={place.y} className="testimony-world-dot" aria-pressed={selected || place.key === openKey}
          aria-label={place.people.length === 1 ? `${place.people[0].name}, shared from ${place.label}` : `${place.people.length} testimonies shared from ${place.label}`}
          title={place.people.length === 1 ? `${place.people[0].name} · ${place.label}` : `${place.people.length} stories · ${place.label}`} onClick={() => choose(place)}>
          <span>{place.people.length > 1 ? place.people.length : ""}</span>
        </button>;
      })}</div>
    </div>
    {status && <p className="testimony-world-status" role="status"><Globe size={16} aria-hidden />{status}</p>}
    {open && <div className="testimony-world-place" role="dialog" aria-label={`Testimonies shared from ${open.label}`}>
      <header><div><p className="testimony-kicker">Shared from</p><h3>{open.label}</h3></div><button type="button" aria-label="Close" onClick={() => setOpenKey("")}><X size={15} /></button></header>
      <ol>{open.people.map((person) => <li key={person.id}><button type="button" aria-pressed={person.id === selectedId} onClick={() => onOpen(person.id)}>
        <span><strong>{person.name}</strong>{person.publishedAt && <small><time dateTime={person.publishedAt}>Shared {formatTestimonyDate(person.publishedAt)}</time></small>}</span><ArrowRight size={14} aria-hidden />
      </button></li>)}</ol>
    </div>}
    <div className="testimony-zoom-controls" role="group" aria-label="Map zoom">
      <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.4)}><Minus size={16} /></button>
      <output ref={percentage} aria-label="Zoom level">100%</output>
      <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.4)}><Plus size={16} /></button>
      <button type="button" className="testimony-fit" onClick={() => fit.current()}><Maximize size={15} />Whole world</button>
    </div>
    <p id="testimony-world-help" className="sr-only">Drag to move. Pinch or use the mouse wheel to zoom. Arrow keys move the map, plus and minus zoom, and Home shows the whole world. Tab to a place and press Enter to read the stories shared there.</p>
  </div>;
}
