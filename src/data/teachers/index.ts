// The Teachers data (teachers.json, built by scripts/build-teachers.ts) with the three sections' names and colours.
import raw from "./teachers.json";
import type { Section, Teacher, TeachersData } from "./types";

export const TEACHERS = raw as unknown as TeachersData;

export interface SectionInfo { section: Section; slug: string; title: string; one: string; color: string; art: "preachers" | "authors" | "scholars"; text: string }
export const SECTIONS: SectionInfo[] = [
  { section: "preacher", slug: "preachers", title: "Preachers", one: "preacher", color: "accent", art: "preachers", text: "Those whose sermons the library holds, with what of theirs you can read here." },
  { section: "author", slug: "authors", title: "Authors", one: "author", color: "poetry", art: "authors", text: "Writers of books, treatises and letters in the library, and where to read them." },
  { section: "scholar", slug: "scholars", title: "Scholars", one: "scholar", color: "prophets", art: "scholars", text: "Theologians in the library and the commentators our study pages cite." },
];
export const sectionBySlug = (slug: string | undefined) => SECTIONS.find((s) => s.slug === slug);
export const inSection = (section: Section) => TEACHERS.teachers.filter((t) => t.sections.includes(section));

/** Works the site's reading library publishes, counted once even when they have two authors. */
export const readableWorks = (people: Teacher[]) => new Set(people.flatMap((t) => t.published.map((w) => w.title))).size;
export const genreCount = (people: Teacher[], genres: string[]) => people.reduce((sum, t) => sum + (t.holdings?.genres ?? []).filter(([g]) => genres.includes(g)).reduce((n, [, c]) => n + c, 0), 0);
export const traditionCount = (people: Teacher[]) => new Set(people.flatMap((t) => t.traditions)).size;
export const citedWorks = (people: Teacher[]) => new Set(people.flatMap((t) => t.cited.map((c) => c.title))).size;
export const citingPages = (people: Teacher[]) => new Set(people.flatMap((t) => t.cited.flatMap((c) => c.citedOn.map((o) => o.page)))).size;
