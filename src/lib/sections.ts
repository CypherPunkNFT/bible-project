import type { SectionId } from "./types";

/** The owner's reading-chart bands. Colours themselves live in src/index.css (one place to change). */
export const SECTIONS: { id: SectionId; name: string; span: string; short: string }[] = [
  { id: "history", name: "History", span: "Genesis – Esther", short: "Hist" },
  { id: "poetry", name: "Poetry & Wisdom", span: "Job – Song of Songs", short: "Poet" },
  { id: "prophets", name: "Prophets", span: "Isaiah – Malachi", short: "Proph" },
  { id: "gospels", name: "Gospels & Acts", span: "Matthew – Acts", short: "Gosp" },
  { id: "epistles", name: "Epistles", span: "Romans – Jude", short: "Epis" },
  { id: "revelation", name: "Revelation", span: "Revelation", short: "Rev" },
  { id: "apocrypha", name: "Apocrypha", span: "Tobit – 4 Maccabees", short: "Apoc" },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<SectionId, (typeof SECTIONS)[number]>;

/** CSS colour for a section, theme-aware (resolves the token at paint time). */
export const sectionColor = (id: SectionId): string => `var(--${id})`;

/** Read the current theme's resolved colour, for canvas drawing which cannot use var(). */
export function resolvedSectionColors(): Record<SectionId, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(SECTIONS.map((s) => [s.id, style.getPropertyValue(`--${s.id}`).trim() || "#888"])) as Record<
    SectionId,
    string
  >;
}

export const isNewTestament = (id: SectionId) => id === "gospels" || id === "epistles" || id === "revelation";
