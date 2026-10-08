// Small look-ups shared by the landing and the profile drawer (ported from the mock-up's drawer.js and landing.js).
import type { CSSProperties } from "react";
import type { PeopleData, Person } from "@/data/teachers/pages-types";
import { familyOf } from "../../shared/people";

/** Two letters for a person's mark: the first letter of their first and last names. */
export function initials(person: Person) {
  const parts = person.name.split(/\s+/).filter(Boolean);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A person's family colour as a CSS value. */
export const toneOf = (person: Person) => `var(${familyOf(person).tone})`;

/** CSS custom properties for a style attribute (React's CSSProperties does not type "--name" keys). */
export const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

/** True when the visitor asked for less motion; read when needed, so a change in the setting is honoured. */
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const GENRE_TONE: Record<string, string> = {
  sermon: "--prophets", treatise: "--history", commentary: "--poetry", letter: "--acts", "systematic-theology": "--gospels",
  "collected-works": "--epistles", article: "--revelation",
};
export const genreName = (genre: string) => genre.replace(/-/g, " ");

export interface KnownLink { other: Person; note: string }
/** The people a person is documented as knowing, with the note that says how. */
export function linksOf(data: PeopleData, id: string): KnownLink[] {
  const result: KnownLink[] = [];
  for (const link of data.links) {
    if (link.from !== id && link.to !== id) continue;
    const otherId = link.from === id ? link.to : link.from;
    const other = data.people.find((p) => p.id === otherId);
    if (other) result.push({ other, note: link.note });
    else console.error(`Teachers drawer: link from "${link.from}" to "${link.to}" names no teacher in the data`);
  }
  return result;
}
