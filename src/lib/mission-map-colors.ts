// Original outlines; continuous terrain colours are 20% darker
// and 20% more saturated than the preceding mature palette (relative HSL).
// This is illustrative terrain, not a scientific land-cover dataset.
export const missionMapColors = {
  ocean: '#0a1d26', oceanLight: '#132b36', oceanDeep: '#07141b',
  land: '#28362b', coast: '#8eb7b074', border: '#a4cfbda8', selected: '#d29d39',
};

export const missionTerrainWashes: readonly { position: [number, number]; radius: number; color: string; opacity: number }[] = [
  { position: [18, 24], radius: 31, color: '#635238', opacity: .72 },
  { position: [49, 26], radius: 23, color: '#56432f', opacity: .68 },
  { position: [86, 40], radius: 29, color: '#514631', opacity: .58 },
  { position: [134, -25], radius: 27, color: '#55422e', opacity: .62 },
  { position: [-111, 35], radius: 21, color: '#544a34', opacity: .55 },
  { position: [23, 0], radius: 20, color: '#1a3f30', opacity: .75 },
  { position: [-62, -5], radius: 28, color: '#193e30', opacity: .75 },
  { position: [105, 8], radius: 24, color: '#1e3f30', opacity: .7 },
  { position: [20, 53], radius: 25, color: '#1f3d30', opacity: .6 },
  { position: [-104, 58], radius: 29, color: '#1e3a2d', opacity: .6 },
];
