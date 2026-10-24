// The test's settings beside how many: how hard and who for. How hard is set on the questions page's banner
// (../TestBanner.tsx; who for moved to a children's page of its own, owner 2026-10-23), which carries them to the test page in the address (?level=, ?age=).
// The bank does not yet record how hard a question is or what age it suits, so both change nothing in the draw yet.
import { Backpack, Blocks, UserRound, type LucideIcon } from "lucide-react";

/** Each level with its three test lengths, short to long: the lengths the owner gave children, teens and adults
 * (2026-10-23), carried over when children moved to a page of their own and the tests here went by level. */
export const LEVELS = [
  { id: 1, label: "Gentle", line: "The best-known stories and names", lengths: [10, 20, 30] },
  { id: 2, label: "Steady", line: "A mix, with some details", lengths: [15, 30, 45] },
  { id: 3, label: "Deep", line: "Small details and lesser-known books", lengths: [25, 50, 75] },
];
export const DEFAULT_LEVEL = 2;

/** Each age group with its three test lengths, short to long (owner, 2026-10-23). */
export const AGES: { id: string; label: string; line: string; Icon: LucideIcon; lengths: number[] }[] = [
  { id: "children", label: "Children", line: "Ages about 6 to 11", Icon: Blocks, lengths: [10, 20, 30] },
  { id: "teens", label: "Teens", line: "Ages about 12 to 17", Icon: Backpack, lengths: [15, 30, 45] },
  { id: "adults", label: "Adults", line: "Everything in the bank", Icon: UserRound, lengths: [25, 50, 75] },
];
export const DEFAULT_AGE = "adults";

/** About twenty seconds a question: reading it, choosing, and a glance at the verse. */
export const minutesFor = (n: number) => `about ${Math.max(1, Math.round((n * 20) / 60))} min`;
export const levelOf = (id: number) => LEVELS.find((l) => l.id === id) ?? LEVELS[DEFAULT_LEVEL - 1];
export const ageOf = (id: string) => AGES.find((a) => a.id === id) ?? AGES[AGES.length - 1];

/** The level and age an address asks for, or the defaults when it asks for none or for one that does not exist. */
export function readSettings(params: URLSearchParams) {
  return { level: levelOf(Number(params.get("level"))).id, age: ageOf(params.get("age") ?? "").id };
}

/** Adds the level and age to an address, leaving out the defaults. */
export function writeSettings(out: URLSearchParams, level: number, age: string) {
  if (level !== DEFAULT_LEVEL) out.set("level", String(level));
  if (age !== DEFAULT_AGE) out.set("age", age);
}
