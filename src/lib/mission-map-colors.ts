// Soft geographic washes provide visual continuity across country borders.
// This is illustrative terrain, not a scientific land-cover dataset.
export const missionMapColors = {
  ocean: '#10232d', oceanLight: '#1b3440', oceanDeep: '#0b1820',
  land: '#344237', coast: '#8eb7b074', border: '#a4cfbda8', selected: '#d5b579',
};

export const missionTerrainWashes: readonly { position: [number, number]; radius: number; color: string; opacity: number }[] = [
  { position: [18, 24], radius: 31, color: '#77664a', opacity: .72 },
  { position: [49, 26], radius: 23, color: '#68543f', opacity: .68 },
  { position: [86, 40], radius: 29, color: '#625641', opacity: .58 },
  { position: [134, -25], radius: 27, color: '#66523e', opacity: .62 },
  { position: [-111, 35], radius: 21, color: '#665b44', opacity: .55 },
  { position: [23, 0], radius: 20, color: '#244b3b', opacity: .75 },
  { position: [-62, -5], radius: 28, color: '#234a3b', opacity: .75 },
  { position: [105, 8], radius: 24, color: '#294b3c', opacity: .7 },
  { position: [20, 53], radius: 25, color: '#2a493c', opacity: .6 },
  { position: [-104, 58], radius: 29, color: '#294638', opacity: .6 },
];
