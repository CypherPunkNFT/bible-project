// The game's map (design §8, §9): MapLibre over the site's own map file, blank, with one pin the player drops by tap,
// click, drag, or Enter at the centre crosshair. The pin is an HTML marker that drops in with a ring where the tap
// landed and lifts while dragged; on a reveal the dashed line draws itself out from the pin to the true site over half
// a second, the true site lands as a marker with a slow looping ring, and both are framed clear of the answer card. In
// summary mode (`summary`) the map is still, draws every place's line and points, and takes no input. Hint circles
// (`hints`) are drawn under the pin; each new one is framed so the player sees it whole.
// A map that cannot start (no WebGL, no map file, nothing loaded within 20 s) calls onFail; the page offers a retry.
import { addProtocol, AttributionControl, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource, type PaddingOptions } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol } from "pmtiles";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { ChunkedSource } from "@/components/atlas/chunked-source";
import { BOUNDS, tilesBase } from "@/components/atlas/street-style";
import { useThemeVersion, type Theme } from "@/lib/theme";
import { motionMs } from "../kit";
import type { LonLat } from "./geo";
import { boundsOf, clampPadding } from "./frame";
import { circleBox, type HintCircle } from "./hints";
import { QUEST_MAX_ZOOM, buildQuestStyle, hintFeatures, revealFeatures, type RevealShape } from "./quest-style";

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
const NO_LAND_AFTER_FAILURE_MS = 3_000;
const LINE_DRAW_MS = 550;
const REVEAL_ZOOM_MS = 900;
const HINT_ZOOM_MS = 700;
const HINT_PADDING = 56;

/** Draws the shapes into the map's three answer sources, the lines `progress` (0 to 1) of the way. */
function setData(map: MapLibreMap, shapes: RevealShape | readonly RevealShape[] | null, progress: number) {
  const features = revealFeatures(shapes, progress);
  (map.getSource("mq-line") as GeoJSONSource | undefined)?.setData(features.line);
  (map.getSource("mq-sites") as GeoJSONSource | undefined)?.setData(features.sites);
  (map.getSource("mq-pins") as GeoJSONSource | undefined)?.setData(features.pins);
}

/** The pin's element: MapLibre moves the outer box, so everything that animates is inside it. */
function pinElement(): HTMLElement {
  const box = document.createElement("div");
  box.className = "mq-marker";
  const pin = document.createElement("div");
  pin.className = "mq-pin";
  const head = document.createElement("span");
  head.className = "mq-pin-head";
  pin.appendChild(head);
  box.appendChild(pin);
  return box;
}

/** A fresh ring at the pin's tip each time it lands, so the flash plays again. */
function flashRing(box: HTMLElement) {
  box.querySelector(".mq-pin-ring")?.remove();
  const ring = document.createElement("span");
  ring.className = "mq-pin-ring";
  box.appendChild(ring);
}

/** The true site: a dot in the round's colour with a ring that keeps breathing. */
function siteElement(color: string): HTMLElement {
  const box = document.createElement("div");
  box.className = "mq-site";
  box.style.setProperty("--mq-site", color);
  const ring = document.createElement("span");
  ring.className = "mq-site-ring";
  const dot = document.createElement("span");
  dot.className = "mq-site-dot";
  box.append(ring, dot);
  return box;
}

interface Props {
  /** Where the map opens for a new place (west, south, east, north): changing it moves the map there. */
  view: [number, number, number, number];
  /** Changes for every new place, so the same view is framed again. */
  viewKey: string;
  beginner: boolean;
  pin: LonLat | null;
  onPin: (pin: LonLat) => void;
  reveal: RevealShape | null;
  /** The hint circles taken for this place, largest first (none once the answer shows). */
  hints?: readonly HintCircle[];
  /** Room to leave around the framed answer, for the card that sits over the map. */
  revealPadding?: Partial<PaddingOptions>;
  /** Every place of a finished game: the map goes still and draws them all. */
  summary?: readonly RevealShape[];
  onFail: () => void;
  label: string;
}

const NO_HINTS: readonly HintCircle[] = [];

export function QuestMap({ view, viewKey, beginner, pin, onPin, reveal, hints = NO_HINTS, revealPadding, summary, onFail, label }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const siteRef = useRef<Marker | null>(null);
  const frameRef = useRef(0);
  const revealRef = useRef(reveal);
  const hintsRef = useRef(hints);
  const hintsShownRef = useRef(hints.length);
  const summaryRef = useRef(summary);
  const paddingRef = useRef(revealPadding);
  const onPinRef = useRef(onPin);
  const onFailRef = useRef(onFail);
  const beginnerRef = useRef(beginner);
  const viewRef = useRef(view);
  revealRef.current = reveal;
  hintsRef.current = hints;
  summaryRef.current = summary;
  paddingRef.current = revealPadding;
  viewRef.current = view;
  onPinRef.current = onPin;
  onFailRef.current = onFail;
  const themeVersion = useThemeVersion();
  const still = !!summary;

  const shapes = (): RevealShape | readonly RevealShape[] | null => summaryRef.current ?? revealRef.current;
  const syncReveal = () => {
    const map = mapRef.current;
    if (map?.getSource("mq-line")) setData(map, shapes(), 1);
    (map?.getSource("mq-hints") as GeoJSONSource | undefined)?.setData(hintFeatures(hintsRef.current));
  };
  const sync = useRef(syncReveal);
  sync.current = syncReveal;

  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap;
    let loaded = false;
    const stillMap = !!summaryRef.current;
    try {
      addPmtilesProtocol();
      const bounds = (stillMap && boundsOf(summaryRef.current!)) || viewRef.current;
      map = new MapLibreMap({
        container: container.current, style: buildQuestStyle(currentTheme(), beginnerRef.current, shapes(), hintsRef.current), bounds,
        fitBoundsOptions: stillMap ? { padding: 36, maxZoom: 7 } : undefined,
        maxBounds: BOUNDS, maxZoom: QUEST_MAX_ZOOM, renderWorldCopies: false, attributionControl: false,
        interactive: !stillMap, keyboard: !stillMap,
      });
    } catch (error) {
      console.error("Map quest: the map could not start (no WebGL?)", error);
      onFailRef.current();
      return;
    }
    const fail = () => { if (mapRef.current === map) onFailRef.current(); };
    const watchdog = window.setTimeout(() => { if (!loaded) { console.error("Map quest: the map did not load within 20 s"); fail(); } }, LOAD_TIMEOUT_MS);
    map.on("load", () => { loaded = true; });
    // A map with no land at all: the piece list answered with an error, or (no network) a square failed and no land had
    // drawn three seconds later. A narrow phone view asks for only one or two squares, so failures are not counted; one
    // dropped square after the land has drawn is retried by the source and harmless.
    let landDrawn = false;
    let noLandClock = 0;
    map.on("sourcedata", (event) => { if (event.sourceId === "world" && event.tile) landDrawn = true; });
    map.on("error", (event) => {
      console.error("Map quest: map error", event.error);
      const squareFailed = !!(event as { tile?: unknown }).tile;
      if (String(event.error?.message).startsWith("street atlas: manifest")) fail();
      else if (squareFailed && !landDrawn && !noLandClock) {
        noLandClock = window.setTimeout(() => { if (!landDrawn) { console.error("Map quest: no land drew after a square failed"); fail(); } }, NO_LAND_AFTER_FAILURE_MS);
      }
    });
    map.on("webglcontextlost", () => { console.error("Map quest: the graphics context was lost"); fail(); });
    map.on("style.load", () => sync.current()); // a theme switch replaces the style and with it the reveal's shapes
    if (!stillMap) {
      map.on("click", (event) => { if (!revealRef.current) onPinRef.current([event.lngLat.lng, event.lngLat.lat]); });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new AttributionControl({ compact: true }), "bottom-left");
    }
    mapRef.current = map;
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(watchdog);
      window.clearTimeout(noLandClock);
      mapRef.current = null;
      markerRef.current = null;
      siteRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (themeVersion > 0 || beginnerRef.current !== beginner) mapRef.current?.setStyle(buildQuestStyle(currentTheme(), beginner, shapes(), hintsRef.current));
    beginnerRef.current = beginner;
  }, [themeVersion, beginner]);

  // A new place: back to its opening view.
  // viewKey stands for the place (view itself may be a new array on every render).
  useEffect(() => {
    if (!still) mapRef.current?.fitBounds(viewRef.current, { duration: 0 });
  }, [viewKey, still]);

  // The hint circles: drawn as they are taken, and a new one framed whole (a resumed game frames the last one taken).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || still) return;
    (map.getSource("mq-hints") as GeoJSONSource | undefined)?.setData(hintFeatures(hintsRef.current));
    const grew = hints.length > 0 && hints.length >= hintsShownRef.current;
    hintsShownRef.current = hints.length;
    if (!grew) return;
    const canvas = map.getCanvas();
    const padding = clampPadding({ top: HINT_PADDING, right: HINT_PADDING, bottom: HINT_PADDING, left: HINT_PADDING }, canvas.clientWidth || 360, canvas.clientHeight || 300);
    try {
      map.fitBounds(circleBox(hints[hints.length - 1]), { padding, maxZoom: QUEST_MAX_ZOOM - 1, duration: motionMs(HINT_ZOOM_MS) });
    } catch (error) {
      console.warn("Map quest: could not frame the hint circle, leaving the map where it is:", error);
    }
  }, [hints, still]);

  // The pin: a marker that drops in, can be dragged until the answer is shown, and flashes a ring where it lands.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || still) return;
    if (!pin) { markerRef.current?.remove(); markerRef.current = null; return; }
    let fresh = false;
    if (!markerRef.current) {
      fresh = true;
      const element = pinElement();
      const marker = new Marker({ element, draggable: true, anchor: "bottom" }).setLngLat([...pin]).addTo(map);
      marker.on("dragstart", () => element.classList.add("is-lifted"));
      marker.on("dragend", () => { element.classList.remove("is-lifted"); const at = marker.getLngLat(); onPinRef.current([at.lng, at.lat]); });
      markerRef.current = marker;
    }
    const marker = markerRef.current;
    const was = marker.getLngLat();
    marker.setLngLat([...pin]);
    marker.setDraggable(!reveal);
    marker.getElement().classList.toggle("is-set", !!reveal);
    if (!reveal && (fresh || was.lng !== pin[0] || was.lat !== pin[1])) flashRing(marker.getElement());
  }, [pin, reveal, still]);

  // The answer: the line draws out from the pin, the true site lands with its ring, and both points are framed clear
  // of the card. The state is whole from the first frame; the drawing only decorates it.
  useEffect(() => {
    const map = mapRef.current;
    window.cancelAnimationFrame(frameRef.current);
    siteRef.current?.remove();
    siteRef.current = null;
    if (!map || still) return;
    if (!reveal) { sync.current(); return; }
    const color = reveal.color ?? "var(--accent)";
    siteRef.current = new Marker({ element: siteElement(color), anchor: "center" }).setLngLat([...reveal.scored]).addTo(map);
    const drawMs = motionMs(LINE_DRAW_MS);
    if (drawMs === 0) setData(map, reveal, 1);
    else {
      const start = performance.now();
      const tick = (now: number) => {
        if (mapRef.current !== map) return;
        const progress = Math.min(1, (now - start) / drawMs);
        setData(map, reveal, progress);
        if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
      };
      setData(map, reveal, 0);
      frameRef.current = window.requestAnimationFrame(tick);
    }
    const bounds = boundsOf([reveal])!;
    const canvas = map.getCanvas();
    const padding = clampPadding({ top: 48, right: 48, bottom: 48, left: 48, ...paddingRef.current }, canvas.clientWidth || 360, canvas.clientHeight || 300);
    try {
      map.fitBounds(bounds, { padding, maxZoom: 8, duration: motionMs(REVEAL_ZOOM_MS) });
    } catch (error) {
      console.warn("Map quest: could not frame the answer with the card's padding, framing plainly instead:", error);
      map.fitBounds(bounds, { padding: 24, maxZoom: 8, duration: 0 });
    }
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [reveal, still]);

  const onKeyDown = (event: KeyboardEvent) => {
    // Enter on the map drops (or moves) the pin at the crosshair; it never confirms a guess, and a button over the
    // map keeps its own Enter.
    if (event.key !== "Enter" || still || revealRef.current || !mapRef.current) return;
    if (!container.current?.contains(event.target as Node)) return;
    event.preventDefault();
    const center = mapRef.current.getCenter();
    onPinRef.current([center.lng, center.lat]);
  };

  return <div className={`mq-map${still ? " mq-map--still" : ""}`} onKeyDown={onKeyDown}>
    <div ref={container} className="mq-map-canvas" role={still ? "img" : "application"} aria-label={label} />
    {!reveal && !still && <span className="mq-crosshair" aria-hidden="true" />}
  </div>;
}
