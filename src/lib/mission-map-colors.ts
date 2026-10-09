// Illustrative country colours, shared by both projections. These do not
// encode demographics, climate or IMB engagement classifications.
export const missionMapColors = {
  ocean: '#315d79',
  land: '#b79b70',
  coast: '#eadbb9',
  border: '#f0e3c7',
  selected: '#ffdb79',
};

const countryColors = ['#77965b', '#d1b467', '#a47b55', '#91a76b', '#c59c69'];

export function missionCountryColor(code: string): string {
  let hash = 0;
  for (const character of code) hash = hash * 31 + character.charCodeAt(0);
  return countryColors[hash % countryColors.length];
}
