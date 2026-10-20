// One order for the live page, headings and jump links. Archived mockups are frozen.
export const SCHOLAR_SECTIONS = [
  { id: 'built', title: 'Sources in use' },
  { id: 'catalogue', title: 'The full catalogue' },
  { id: 'discoveries', title: 'Discoveries' },
  { id: 'directory', title: 'Contributors' },
] as const;
export type ScholarSectionId = typeof SCHOLAR_SECTIONS[number]['id'];
export const sectionNumber = (id: ScholarSectionId) => String(SCHOLAR_SECTIONS.findIndex(s => s.id === id) + 1).padStart(2, '0');
