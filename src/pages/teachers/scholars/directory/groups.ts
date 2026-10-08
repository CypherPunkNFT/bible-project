// The directory's two groupings of the same people: by era (birth order inside each, as the data lists them), and by
// the first letter of the surname (A to Z).
import type { Scholar, ScholarsData } from "@/data/teachers/pages-types";

export type Mode = "era" | "az";
export interface Group { key: string; label: string; people: Scholar[] }

const surname = (s: Scholar) => s.short.split(" ").at(-1) ?? s.short;

export function buildGroups(data: ScholarsData): Record<Mode, Group[]> {
  const era = Object.entries(data.eras)
    .map(([key, label]) => ({ key, label, people: data.scholars.filter((s) => s.era === key) }))
    .filter((g) => g.people.length);
  const az: Group[] = [];
  const byName = [...data.scholars].sort((a, b) => surname(a).localeCompare(surname(b)) || a.name.localeCompare(b.name));
  for (const s of byName) {
    const key = surname(s)[0].toUpperCase();
    if (az[az.length - 1]?.key !== key) az.push({ key, label: key, people: [] });
    az[az.length - 1].people.push(s);
  }
  return { era, az };
}

export const USE_LABEL = { "in-use": "Used by a live feature", held: "In the library, planned" } as const;
