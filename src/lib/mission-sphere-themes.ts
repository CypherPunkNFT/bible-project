import { missionMapColors, missionTerrainWashes } from './mission-map-colors';

export type SphereDesign = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p';
interface SpherePalette {
  ocean: string; oceanLight: string; oceanDeep: string; land: string;
  coast: string; border: string; minority: string; selected: string;
  markerEdge: string; horizon: string; hover: string;
  washes: typeof missionTerrainWashes;
}
interface SphereTheme extends SpherePalette { id: SphereDesign; name: string; description: string }
const terrain = (desert: string, forest: string) => missionTerrainWashes.map((wash, index) => ({ ...wash, color: index < 5 ? desert : forest }));

const originals: readonly SphereTheme[] = [
  { id: 'a', name: 'Earth', description: 'Deep ocean, olive terrain and the familiar gold country highlight.',
    ...missionMapColors, minority: '#8eb7b060', selected: '#f0c47e', border: '#a4cfbddd', coast: '#8eb7b074', markerEdge: '#332b20', horizon: '#8eb7b090', hover: '#8eb7b018', washes: missionTerrainWashes },
  { id: 'b', name: 'Midnight', description: 'Ink-blue water, slate land and cool silver country lines.',
    ocean: '#09152a', oceanLight: '#193850', oceanDeep: '#040914', land: '#263e53', coast: '#87b4cf80', border: '#c4deedc9', minority: '#789aae90', selected: '#f4c68a', markerEdge: '#142536', horizon: '#789db5a0', hover: '#93c5dd24', washes: terrain('#536576', '#2b5560') },
];

// Small departures from the two preferred treatments; geometry and wash locations are shared.
const variation = (base: 0 | 1, id: SphereDesign, name: string, description: string, colors: Partial<SpherePalette>): SphereTheme => ({ ...originals[base], id, name, description, ...colors });
export const missionSphereThemes: readonly SphereTheme[] = [
  ...originals,
  variation(0, 'c', 'Quiet olive', 'Earth with softer olive land and slightly warmer shores.', { land: '#2a3025', washes: terrain('#514831', '#23372b'), border: '#b4c7add4', selected: '#e6bb7b' }),
  variation(1, 'd', 'Blue slate', 'Midnight with muted slate terrain and quieter silver lines.', { land: '#303f4c', washes: terrain('#586370', '#334e58'), border: '#b7ccd9bf', selected: '#e3bf8f' }),
  variation(0, 'e', 'Deep forest', 'Earth with deeper forest greens and a cooler sea.', { ocean: '#071820', oceanLight: '#10252c', land: '#1d3028', washes: terrain('#444333', '#15382d'), border: '#9fc9b9d5' }),
  variation(1, 'f', 'Atlantic', 'Midnight with a little more blue in the ocean and land.', { ocean: '#081a2a', oceanLight: '#1a3c53', land: '#254653', washes: terrain('#4d6772', '#2a5861'), border: '#abcddcce' }),
  variation(0, 'g', 'Warm shore', 'Earth with soft ochre terrain and champagne outlines.', { land: '#303026', washes: terrain('#594a33', '#29372a'), border: '#c6c7a6d1', selected: '#eac895' }),
  variation(1, 'h', 'Smoke blue', 'Midnight with grey-blue land and gently subdued water.', { ocean: '#101b29', oceanLight: '#263a4b', land: '#354651', washes: terrain('#5b6670', '#3c555b'), border: '#c2d1d9c2', selected: '#e6c6a2' }),
  variation(0, 'i', 'Moss', 'Earth with muted moss terrain and fine sage boundaries.', { ocean: '#0a191c', oceanLight: '#14282b', land: '#2e382b', washes: terrain('#4d4c36', '#294131'), border: '#b4c7afd2', selected: '#e3bf80' }),
  variation(1, 'j', 'Deep navy', 'Midnight with deeper navy seas and brighter coast contrast.', { ocean: '#070f21', oceanLight: '#152d43', oceanDeep: '#030713', land: '#22374b', washes: terrain('#495b70', '#274959'), border: '#b2cee1d5' }),
  variation(0, 'k', 'Charcoal', 'Earth with charcoal water and restrained pewter-green terrain.', { ocean: '#111a1e', oceanLight: '#202a30', oceanDeep: '#080f14', land: '#303731', washes: terrain('#4d493c', '#2e3e35'), border: '#b7c6bdd0', selected: '#e1bf8b' }),
  variation(1, 'l', 'Silver coast', 'Midnight with lighter silver coastlines and muted blue terrain.', { land: '#2c4153', coast: '#abc9d395', border: '#d1dfe6cf', washes: terrain('#586977', '#355460'), selected: '#dcc3a1' }),
  variation(0, 'm', 'Muted teal', 'Earth with a restrained teal sea and cool green terrain.', { ocean: '#081d23', oceanLight: '#173237', land: '#25392e', washes: terrain('#474936', '#244437'), border: '#a5cdc2d5', selected: '#e6bf88' }),
  variation(1, 'n', 'Dusk', 'Midnight with a grey cast, softened land and warm gold selection.', { ocean: '#101a2c', oceanLight: '#29394e', land: '#354354', washes: terrain('#606775', '#3b505f'), border: '#c4cddbc4', selected: '#ebbc7c' }),
  variation(0, 'o', 'Soft earth', 'Earth with softer terrain contrast and delicate warm-grey outlines.', { land: '#29312a', washes: terrain('#494432', '#29392d'), border: '#b3bfa9b8', coast: '#8fa89b68', selected: '#ddbb86' }),
  variation(1, 'p', 'Quiet midnight', 'Midnight with lower-contrast outlines and deeper slate land.', { land: '#273c4c', washes: terrain('#4c5d6b', '#2d4c56'), border: '#9fbac8b8', coast: '#7da1b66c', selected: '#dab98a' }),
];

export function sphereDesign(value: string | null): SphereDesign | undefined {
  return missionSphereThemes.find(theme => theme.id === value)?.id;
}

export function spherePalette(design: SphereDesign, dark: boolean): SpherePalette {
  const palette = missionSphereThemes.find(theme => theme.id === design) ?? missionSphereThemes[0];
  if (design !== 'a' || dark) return palette;
  return { ...palette, coast: '#53766985', border: '#47695ecc', minority: '#53766980', selected: '#9e6924', horizon: '#53766980', hover: '#507a7214' };
}
