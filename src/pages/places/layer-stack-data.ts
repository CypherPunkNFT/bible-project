// Data for the Atlas home's tilted layer stack (AtlasLayerStack.tsx): Paul's first journey, as [lon, lat] in the
// order Acts names the places (paul-letters.json, map "journey-1", via data/places.json; a stop repeated in place is
// drawn once). Kept here so the Atlas home need not load the Letters data; layer-stack-data.test.ts checks it still
// matches that data.
export const FIRST_JOURNEY: [number, number][] = [
  [36.17, 36.23], [35.92, 36.12], [33.9, 35.18], [32.4, 34.76], [30.85, 36.96], [31.19, 38.31], [32.49, 37.87], [32.34, 37.6],
  [33.36, 37.35], [32.34, 37.6], [32.49, 37.87], [31.19, 38.31], [31.0, 37.0], [30.85, 36.96], [30.7, 36.88], [36.17, 36.23],
];

/** The part of the world the stack shows: the eastern Mediterranean, [west, south, east, north] in degrees. */
export const STACK_BOUNDS: [number, number, number, number] = [26.5, 32.6, 38.5, 40.6];
