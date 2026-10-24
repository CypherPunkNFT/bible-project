// The test's settings beside how many: how hard and who for. How hard is set on the questions page's banner
// (../TestBanner.tsx; who for moved to a children's page of its own, owner 2026-10-23), which carries them to the test page in the address (?level=, ?age=).
// Each level draws only the questions Claude Opus rated at it (the bank's `level`, scripts/question_difficulty.py), and
// ?age=children only those it rated as suiting children. An address with no ?level= draws from every level.
import { Backpack, Blocks, UserRound, type LucideIcon } from "lucide-react";
import type { BankQuestion } from "@/lib/data";

/** Each level with its three test lengths, short to long: the lengths the owner gave children, teens and adults
 * (2026-10-23), carried over when children moved to a page of their own and the tests here went by level. */
export const LEVELS = [
  { id: 1, label: "Gentle", rating: "easy", line: "The best-known stories and names", lengths: [10, 20, 30] },
  { id: 2, label: "Steady", rating: "medium", line: "A mix, with some details", lengths: [15, 30, 45] },
  { id: 3, label: "Deep", rating: "hard", line: "Small details and lesser-known books", lengths: [25, 50, 75] },
] as const;
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

/** The level an address asks for (null: every level) and whether it asks for children's questions only. */
export function readSettings(params: URLSearchParams) {
  const level = LEVELS.find((l) => l.id === Number(params.get("level"))) ?? null;
  return { level, children: params.get("age") === "children" };
}

/** Whether a question is one the address's level and age draw from. */
export const fitsSettings = (q: BankQuestion, { level, children }: ReturnType<typeof readSettings>) =>
  (!level || q.level === level.rating) && (!children || q.children === true);

/** Adds the level and age to an address; the level always, since an address without one draws from every level. */
export function writeSettings(out: URLSearchParams, level: number, age: string) {
  out.set("level", String(level));
  if (age !== DEFAULT_AGE) out.set("age", age);
}
