import type { Feature, MultiLineString, MultiPolygon, Polygon } from 'geojson';

export type MissionCountry = Feature<Polygon | MultiPolygon, { code: string; name: string; selectable: boolean }>;
export interface MissionAtlas { land: MultiPolygon; countries: MissionCountry[] }
let cached: MissionAtlas | undefined;

export async function loadMissionAtlas(signal: AbortSignal): Promise<MissionAtlas> {
  if (cached) return cached;
  const response = await fetch('/assets/muslim-world/atlas.json', { signal });
  if (!response.ok) throw new Error('Country map could not be loaded.');
  const atlas = await response.json() as MissionAtlas;
  cached = atlas;
  return atlas;
}

export const missionOutlines = (geometry: Polygon | MultiPolygon): MultiLineString => ({
  type: 'MultiLineString', coordinates: geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flatMap(polygon => polygon),
});
