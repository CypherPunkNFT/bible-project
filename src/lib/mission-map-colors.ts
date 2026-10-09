// Original outlines; ocean and terrain lightness is reduced a further 20%
// from the Earth-only palette, retaining its saturation (relative HSL).
// This is illustrative terrain, not a scientific land-cover dataset.
export const missionMapColors = {
  ocean: '#08171e', oceanLight: '#0f222b', oceanDeep: '#061016',
  land: '#202b22', coast: '#8eb7b074', border: '#a4cfbda8', selected: '#d29d39',
};

export const missionTerrainWashes: readonly { position: [number, number]; radius: number; color: string; opacity: number }[] = [
  { position: [18, 24], radius: 31, color: '#4f422d', opacity: .72 },
  { position: [49, 26], radius: 23, color: '#453626', opacity: .68 },
  { position: [86, 40], radius: 29, color: '#413827', opacity: .58 },
  { position: [134, -25], radius: 27, color: '#443525', opacity: .62 },
  { position: [-111, 35], radius: 21, color: '#433b2a', opacity: .55 },
  { position: [23, 0], radius: 20, color: '#153226', opacity: .75 },
  { position: [-62, -5], radius: 28, color: '#143226', opacity: .75 },
  { position: [105, 8], radius: 24, color: '#183226', opacity: .7 },
  { position: [20, 53], radius: 25, color: '#193126', opacity: .6 },
  { position: [-104, 58], radius: 29, color: '#182e24', opacity: .6 },
];
