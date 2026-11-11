// The game's map (design §8, §9): MapLibre over the site's own map file, blank, with one pin the player drops by tap,
// click, drag, or Enter at the centre crosshair. On a reveal it draws the line to the true site and frames both.
// A map that cannot start (no WebGL, no map file, nothing loaded within 20 s) calls onFail; the page offers a retry.
import { addProtocol, LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol } from "pmtiles";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { ChunkedSource } from "@/components/atlas/chunked-source";
import { BOUNDS, tilesBase } from "@/components/atlas/street-style";
import { useThemeVersion, type Theme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { LonLat } from "./geo";
import { QUEST_MAX_ZOOM, buildQuestStyle, revealFeatures, type RevealShape } from "./quest-style";

// The atlas registers the same reader privately (StreetAtlasMap.tsx); importing it would pull the whole atlas in, so the
// game repeats those lines. Both point at the same file, so whichever registered last serves the other page correctly.
let protocolAdded = false;
function addPmtilesProtocol() {
  if (protocolAdded) return;
  setWorkerUrl(mapWorkerUrl); // MapLibre cannot find its worker after bundling without this
  const protocol = new Protocol();
  protocol.add(new PMTiles(new ChunkedSource(tilesBase())));
  addProtocol("pmtiles", protocol.tile);
  protocolAdded = true;
}

const currentTheme = (): Theme => {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const LOAD_TIMEOUT_MS = 20_000;
const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

interface Props {
  /** Where the map opens for a new place (west, south, east, north): changing it moves the map there. */
  view: [number, number, number, number];
  /** Changes for every new place, so the same view is framed again. */
  viewKey: string;
  beginner: boolean;
  pin: LonLat | null;
  onPin: (pin: LonLat) => void;
  reveal: RevealShape | null;
  onFail: () => void;
  label: string;
}

export function QuestMap({ view, viewKey, beginner, pin, onPin, reveal, onFail, label }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const revealRef = useRef(reveal);
  const onPinRef = useRef(onPin);
  const onFailRef = useRef(onFail);
  const beginnerRef = useRef(beginner);
  const viewRef = useRef(view);
  revealRef.current = reveal;
  viewRef.current = view;
  onPinRef.current = onPin;
  onFailRef.current = onFail;
  const themeVersion = useThemeVersion();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const syncReveal = () => {
    const map = mapRef.current;
    const features = revealFeatures(revealRef.current);
    (map?.getSource("mq-line") as GeoJSONSource | undefined)?.setData(features.line);
    (map?.getSource("mq-sites") as GeoJSONSource | undefined)?.setData(features.sites);
  };
  const sync = useRef(syncReveal);
  sync.current = syncReveal;

  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap;
    let loaded = false;
    try {
      addPmtilesProtocol();
      map = new MapLibreMap({
        container: container.current, style: buildQuestStyle(currentTheme(), beginnerRef.current), bounds: viewRef.current,
        maxBounds: BOUNDS, maxZoom: QUEST_MAX_ZOOM, renderWorldCopies: false, attributionControl: { compact: true }, keyboard: true,
      });
    } catch (error) {
      console.error("Map quest: the map could not start (no WebGL?)", error);
      onFailRef.current();
      return;
    }
    const fail = () => { if (mapRef.current === map) onFailRef.current(); };
    const watchdog = window.setTimeout(() => { if (!loaded) { console.error("Map quest: the map did not load within 20 s"); fail(); } }, LOAD_TIMEOUT_MS);
    map.on("load", () => { loaded = true; });
    map.on("error", (event) => {
      console.error("Map quest: map error", event.error);
      // Only a missing piece list means the map cannot load at all; one dropped square is retried and harmless.
      if (String(event.error?.message).startsWith("street atlas: manifest")) fail();
    });
    map.on("webglcontextlost", () => { console.error("Map quest: the graphics context was lost"); fail(); });
    map.on("style.load", () => sync.current()); // a theme switch replaces the style and with it the reveal's shapes
    map.on("click", (event) => { if (!revealRef.current) onPinRef.current([event.lngLat.lng, event.lngLat.lat]); });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => { window.clearTimeout(watchdog); mapRef.current = null; markerRef.current = null; map.remove(); };
  }, []);

  useEffect(() => {
    if (themeVersion > 0 || beginnerRef.current !== beginner) mapRef.current?.setStyle(buildQuestStyle(currentTheme(), beginner));
    beginnerRef.current = beginner;
  }, [themeVersion, beginner]);

  // A new place: back to its opening view.
  // viewKey stands for the place (view itself may be a new array on every render).
  useEffect(() => {
    mapRef.current?.fitBounds(viewRef.current, { duration: 0 });
  }, [viewKey]);

  // The pin: a marker that can be dragged until the answer is shown.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!pin) { markerRef.current?.remove(); markerRef.current = null; return; }
    if (!markerRef.current) {
      const marker = new Marker({ draggable: true, color: css("--accent") || "#b5562d" }).setLngLat([...pin]).addTo(map);
      marker.on("dragend", () => { const at = marker.getLngLat(); onPinRef.current([at.lng, at.lat]); });
      markerRef.current = marker;
    }
    markerRef.current.setLngLat([...pin]);
    markerRef.current.setDraggable(!reveal);
  }, [pin, reveal]);

  // The answer: the line, the sites, and both points framed.
  useEffect(() => {
    sync.current();
    const map = mapRef.current;
    if (!map || !reveal) return;
    const bounds = new LngLatBounds([...reveal.pin], [...reveal.pin]);
    for (const at of [reveal.scored, ...reveal.others]) bounds.extend([...at]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: reducedMotion ? 0 : 900 });
  }, [reveal, reducedMotion]);

  const onKeyDown = (event: KeyboardEvent) => {
    // Enter drops (or moves) the pin at the crosshair; it never confirms a guess.
    if (event.key !== "Enter" || revealRef.current || !mapRef.current) return;
    event.preventDefault();
    const center = mapRef.current.getCenter();
    onPinRef.current([center.lng, center.lat]);
  };

  return <div className="mq-map" onKeyDown={onKeyDown}>
    <div ref={container} className="mq-map-canvas" role="application" aria-label={label} />
    {!reveal && <span className="mq-crosshair" aria-hidden="true" />}
  </div>;
}
