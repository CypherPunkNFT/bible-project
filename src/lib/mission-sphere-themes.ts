import { missionMapColors, missionTerrainWashes } from './mission-map-colors';

export type SphereDesign = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
interface SpherePalette {
  ocean: string; oceanLight: string; oceanDeep: string; land: string;
  coast: string; border: string; minority: string; selected: string;
  markerEdge: string; horizon: string; hover: string;
  washes: typeof missionTerrainWashes;
}
interface SphereTheme extends SpherePalette { id: SphereDesign; name: string; description: string }
const terrain = (desert: string, forest: string) => missionTerrainWashes.map((wash, index) => ({ ...wash, color: index < 5 ? desert : forest }));

export const missionSphereThemes: readonly SphereTheme[] = [
  { id: 'a', name: 'Earth', description: 'Deep ocean, olive terrain and the familiar gold country highlight.',
    ...missionMapColors, minority: '#8eb7b060', selected: '#f0c47e', border: '#a4cfbddd', coast: '#8eb7b074', markerEdge: '#332b20', horizon: '#8eb7b090', hover: '#8eb7b018', washes: missionTerrainWashes },
  { id: 'b', name: 'Midnight', description: 'Ink-blue water, slate land and cool silver country lines.',
    ocean: '#09152a', oceanLight: '#193850', oceanDeep: '#040914', land: '#263e53', coast: '#87b4cf80', border: '#c4deedc9', minority: '#789aae90', selected: '#f4c68a', markerEdge: '#142536', horizon: '#789db5a0', hover: '#93c5dd24', washes: terrain('#536576', '#2b5560') },
  { id: 'c', name: 'Verdigris', description: 'Patinated green, mineral teal and warm brass accents.',
    ocean: '#12322f', oceanLight: '#2b5b51', oceanDeep: '#09201f', land: '#52735a', coast: '#b9cba080', border: '#d1ddbbcc', minority: '#91b39d90', selected: '#f6d194', markerEdge: '#324a36', horizon: '#a2c0aaa0', hover: '#d1d6aa24', washes: terrain('#9c9d72', '#305e4a') },
  { id: 'd', name: 'Parchment', description: 'An old atlas in sand, sage and dark sepia, with a russet highlight.',
    ocean: '#c8b691', oceanLight: '#e6d9b8', oceanDeep: '#a38d68', land: '#979a77', coast: '#655d4788', border: '#4f584bd9', minority: '#756a4e88', selected: '#873e28', markerEdge: '#f1dfbc', horizon: '#75694f9c', hover: '#874b3220', washes: terrain('#c4a87b', '#738665') },
  { id: 'e', name: 'Copper', description: 'Smoked plum seas, burnished copper land and fine champagne lines.',
    ocean: '#251c24', oceanLight: '#46303b', oceanDeep: '#130f17', land: '#795744', coast: '#d3ac8d88', border: '#ead3b5cc', minority: '#b18e8b90', selected: '#ffe3a2', markerEdge: '#47302b', horizon: '#bb957da0', hover: '#e7bd9124', washes: terrain('#b88c57', '#655e4e') },
  { id: 'f', name: 'Porcelain', description: 'Pale sea glass, ivory land and precise blue-grey outlines.',
    ocean: '#dbe9e7', oceanLight: '#eff6f1', oceanDeep: '#bdD3d7', land: '#f1e7d4', coast: '#62838b88', border: '#3a626dd9', minority: '#77909890', selected: '#a34830', markerEdge: '#f6eee1', horizon: '#7b9b9ea0', hover: '#93604b20', washes: terrain('#dac39e', '#bfd0bb') },
];

export function sphereDesign(value: string | null): SphereDesign | undefined {
  return missionSphereThemes.find(theme => theme.id === value)?.id;
}

export function spherePalette(design: SphereDesign, dark: boolean): SpherePalette {
  const palette = missionSphereThemes.find(theme => theme.id === design) ?? missionSphereThemes[0];
  if (design !== 'a' || dark) return palette;
  return { ...palette, coast: '#53766985', border: '#47695ecc', minority: '#53766980', selected: '#9e6924', horizon: '#53766980', hover: '#507a7214' };
}
