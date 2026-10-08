// Data for the Atlas home's tilted layer stack (AtlasLayerStack.tsx): Paul's first journey outward, as [lon, lat] in the
// order Acts names the places (paul-letters.json, map "journey-1", via data/places.json): Antioch south-west through
// Cyprus, north-west to Perga, north to Antioch in Pisidia, then the zigzag east through Iconium and Lystra to Derbe
// (Acts 13:4-14:20). The way home is left off, and Seleucia (Antioch's port, 25 km away) is drawn as part of Antioch so
// the start reads as one dot, at the owner's request (2026-10-08). Kept here so the Atlas home need not
// load the Letters data; layer-stack-data.test.ts checks it against that data.
export const FIRST_JOURNEY: [number, number][] = [
  [36.17, 36.23], [33.9, 35.18], [32.4, 34.76], [30.85, 36.96], [31.19, 38.31], [32.49, 37.87], [32.34, 37.6], [33.36, 37.35],
];

/** The part of the world the stack shows, framed on the journey as in the mock-up: [west, south, east, north] in degrees. */
export const STACK_BOUNDS: [number, number, number, number] = [28.6, 34.0, 37.9, 39.2];
