import { assignRoles } from "@/lib/people-roles";
import type { PersonRow } from "@/lib/study";

/** Kings a name alone cannot pick out: Jeroboam II is the son of Jehoash, not the first Jeroboam. */
const PINNED: Record<string, string> = { "Jeroboam II": "jeroboam-2ki-13-13" };

/**
 * The person page for a king named beside a prophet ("in the days of Uzziah"): of the people with that name, the most
 * named king (Darius the Persian, Uzziah of Judah), else the most named person (Moses). Undefined for "the judges".
 */
export function kingFinder(people: PersonRow[]): (name: string) => string | undefined {
  const roles = assignRoles(people);
  const byName = new Map<string, PersonRow[]>();
  for (const person of people) byName.set(person.n, [...(byName.get(person.n) ?? []), person]);
  return (name) => {
    if (PINNED[name]) return PINNED[name];
    const same = byName.get(name) ?? [];
    const kings = same.filter((person) => roles.get(person.id) === "king");
    return [...(kings.length ? kings : same)].sort((a, b) => b.c - a.c)[0]?.id;
  };
}
