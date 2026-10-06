import { addProtocol, LngLatBounds, Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike, type LngLatLike, type MapLayerMouseEvent } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol } from "pmtiles";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThemeVersion, type Theme } from "@/lib/theme";
import type { MapPlace } from "./projection";
import { ChunkedSource } from "./chunked-source";
import { BOUNDS, buildStyle, placeFeatures, tilesBase } from "./street-style";
import "./vector-atlas.css";
import "./street-atlas.css";

// MapLibre looks for its worker beside its own file, which bundling breaks; point it at the bundled copy.
// The map reads byte ranges of one PMTiles file, stored as pieces (ChunkedSource); register that once for the whole app.
let protocolAdded = false;
function addPmtilesProtocol() {
  if (protocolAdded) return;
  setWorkerUrl(mapWorkerUrl);
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
type Preset = { name: string } & ({ center: LngLatLike; zoom: number } | { bounds: LngLatBoundsLike });
const PRESETS: Preset[] = [
  { name: "Biblical world", bounds: BOUNDS },
  { name: "Holy Land", center: [35.2, 31.7], zoom: 7 },
  { name: "Galilee", center: [35.45, 32.8], zoom: 10 },
  { name: "Jerusalem", center: [35.2295, 31.7767], zoom: 15 },
];

interface Props {
  places: MapPlace[];
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
  overlay?: ReactNode;
  coveredFraction?: number;
  initialRegion?: string;
  focusKey?: number;
}

/** Street-level atlas mockup: OpenStreetMap vector tiles (Protomaps) drawn by MapLibre, zoomable to streets near every place. */
export function StreetAtlasMap({ places, selected, onSelect, overlay, coveredFraction = 0, initialRegion = "Holy Land", focusKey }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selected?.id ?? "");
  const firstPlaces = useRef(true);
  const [activeRegion, setActiveRegion] = useState(initialRegion);
  const initialPreset = useRef(PRESETS.find((preset) => preset.name === initialRegion));
  const [problem, setProblem] = useState("");
  const themeVersion = useThemeVersion();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  placesRef.current = places;
  onSelectRef.current = onSelect;
  selectedIdRef.current = selected?.id ?? "";

  // Dots and the selected ring always come from the latest props (refs), never from a value captured earlier,
  // so a late call can't bring back an old filter result or an old selection.
  const syncOverlays = () => {
    const map = mapRef.current;
    (map?.getSource("places") as GeoJSONSource | undefined)?.setData(placeFeatures(placesRef.current));
    if (map?.getLayer("place-selected")) map.setFilter("place-selected", ["==", ["get", "id"], selectedIdRef.current]);
  };

  useEffect(() => {
    if (!container.current) return;
    addPmtilesProtocol();
    const map = new MapLibreMap({
      container: container.current, style: buildStyle(currentTheme(), placesRef.current, selectedIdRef.current),
      center: initialPreset.current && "center" in initialPreset.current ? initialPreset.current.center : [35.2, 31.7],
      zoom: initialPreset.current && "zoom" in initialPreset.current ? initialPreset.current.zoom : 7, maxZoom: 18, attributionControl: { compact: false },
      maxBounds: BOUNDS, renderWorldCopies: false, // the biblical world only: no panning or zooming out past it
    });
    map.on("movestart", (event) => { if (event.originalEvent) setActiveRegion(""); }); // the reader moved away from a preset
    map.addControl(new NavigationControl({ visualizePitch: false }), "top-left"); // the place panel slides in on the right
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");
    map.on("error", (event) => {
      console.error("street atlas: map error", event.error);
      // Only a missing piece list means the map cannot load at all; a single dropped square is retried and harmless.
      if (!String(event.error?.message).startsWith("street atlas: manifest")) return;
      const local = /^(localhost|127\.)/.test(window.location.hostname);
      setProblem(local ? "The map data is not available. Is the F: drive connected? See STREET_ATLAS.md." : "The map could not be loaded right now. Please try again in a moment.");
    });
    map.on("style.load", syncOverlays); // props may have changed while the style was still loading
    map.on("click", "place-cluster", async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;
      try {
        const zoom = await (map.getSource("places") as GeoJSONSource).getClusterExpansionZoom(feature.properties.cluster_id as number);
        map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3 });
      } catch (error) {
        console.warn("street atlas: group changed before it could be opened (filters changed)", error); // harmless
      }
    });
    map.on("click", "place-dot", (event: MapLayerMouseEvent) => {
      const place = placesRef.current.find((p) => p.id === event.features?.[0]?.properties.id);
      if (place) onSelectRef.current(place);
    });
    for (const layer of ["place-cluster", "place-dot"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; firstPlaces.current = true; };
  }, []);

  // Theme switch: rebuild the style with the other palette (places included, so nothing is lost).
  useEffect(() => {
    if (themeVersion > 0) mapRef.current?.setStyle(buildStyle(currentTheme(), placesRef.current, selectedIdRef.current));
  }, [themeVersion]);

  // Filters changed: new dots, and frame them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncOverlays();
    if (firstPlaces.current) { firstPlaces.current = false; return; }
    if (!places.length) return;
    const bounds = new LngLatBounds();
    places.forEach((p) => bounds.extend([p.lon, p.lat]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: reducedMotion ? 0 : 700 });
    setActiveRegion("");
  }, [places, reducedMotion]);

  // A chosen place: ring it and fly there, keeping it clear of the slide-in panel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncOverlays();
    if (!selected) return;
    setActiveRegion("");
    const width = container.current?.clientWidth ?? 0;
    map.flyTo({ center: [selected.lon, selected.lat], zoom: Math.max(map.getZoom(), 12), padding: { top: 0, bottom: 0, left: 0, right: width * coveredFraction }, duration: reducedMotion ? 0 : 1400 });
  }, [selected, coveredFraction, reducedMotion, focusKey]);

  const goTo = (preset: Preset) => {
    setActiveRegion(preset.name);
    const duration = reducedMotion ? 0 : 1600;
    if ("bounds" in preset) mapRef.current?.fitBounds(preset.bounds, { padding: 0, duration });
    else mapRef.current?.flyTo({ center: preset.center, zoom: preset.zoom, padding: 0, duration });
  };

  return <figure className="vector-atlas street-atlas">
    <div className="vector-atlas-frame">
      <div className="vector-atlas-toolbar">
        <div role="group" aria-label="Map region" className="vector-region-buttons">
          {PRESETS.map((preset) => <button key={preset.name} type="button" aria-pressed={activeRegion === preset.name} onClick={() => goTo(preset)}>{preset.name}</button>)}
        </div>
      </div>
      <div className="vector-atlas-canvas">
        <div ref={container} className="street-atlas-map" aria-label="Street-level map of biblical places" role="region" />
        {problem && <div className="vector-empty" role="alert">{problem}</div>}
        {!places.length && <div className="vector-empty">No places match these filters.</div>}
        {overlay}
      </div>
      <div className="vector-atlas-key"><span><i className="vector-key-group">7</i> Places in this area (select to zoom in)</span><span><i className="vector-key-dot" /> Individual place</span><span><i className="vector-key-uncertain" /> Less certain location</span></div>
    </div>
    <figcaption>Drag to explore · scroll or pinch to zoom · close detail within 50 km of every place, the wider biblical world everywhere else.
      Map data: © OpenStreetMap contributors (ODbL), via Protomaps. Locations: OpenBible.info (CC BY 4.0).</figcaption>
  </figure>;
}
