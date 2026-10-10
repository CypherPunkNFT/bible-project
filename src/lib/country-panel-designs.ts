export const countryPanelDesigns = [
  { id: 'a', name: 'Reading ledger' },
  { id: 'b', name: 'Editorial rows' },
  { id: 'c', name: 'Engagement chapters' },
  { id: 'd', name: 'Open directory' },
  { id: 'e', name: 'Group focus' },
  { id: 'f', name: 'Language index' },
  { id: 'g', name: 'Comparison matrix' },
  { id: 'h', name: 'Field notes' },
] as const;
export type CountryPanelDesign = typeof countryPanelDesigns[number]['id'];
