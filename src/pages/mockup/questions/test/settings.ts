// The test's settings beside how many: how hard and who for. Set on the questions page's
// banner (../TestBanner.tsx), which carries them to the test page in the address (?level=, ?age=).
// The bank does not yet record how hard a question is or what age it suits, so both change nothing in the draw yet.
import { Backpack, Blocks, UserRound, type LucideIcon } from "lucide-react";

export const LEVELS = [
  { id: 1, label: "Gentle", line: "The best-known stories and names" },
  { id: 2, label: "Steady", line: "A mix, with some details" },
  { id: 3, label: "Deep", line: "Small details and lesser-known books" },
];
export const DEFAULT_LEVEL = 2;

export const AGES: { id: string; label: string; line: string; Icon: LucideIcon }[] = [
  { id: "children", label: "Children", line: "Ages about 6 to 11", Icon: Blocks },
  { id: "teens", label: "Teens", line: "Ages about 12 to 17", Icon: Backpack },
  { id: "adults", label: "Adults", line: "Everything in the bank", Icon: UserRound },
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
