// One order for the live page, headings and jump links. Archived mockups are frozen.
export const SCHOLAR_SECTIONS = [
  { id: 'catalogue', title: 'The full catalogue' },
  { id: 'built', title: 'Built on their work' },
  { id: 'discoveries', title: 'Discoveries' },
  { id: 'named', title: 'Where the site names them' },
  { id: 'numbers', title: 'By the numbers' },
  { id: 'directory', title: 'Documented profiles' },
] as const;
export type ScholarSectionId = typeof SCHOLAR_SECTIONS[number]['id'];
export const sectionNumber = (id: ScholarSectionId) => String(SCHOLAR_SECTIONS.findIndex(s => s.id === id) + 1).padStart(2, '0');
