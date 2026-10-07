import type { Span } from "@/data/people-pages/types";
import type { Harmony, HarmonySection } from "@/lib/study";

/** The four Gospels' codes in the harmony (data/study/harmony.json), with their book numbers. */
export const GOSPELS = [["MAT", "Matthew"], ["MRK", "Mark"], ["LUK", "Luke"], ["JHN", "John"]] as const;
const BOOK_NUM: Record<string, number> = { MAT: 40, MRK: 41, LUK: 42, JHN: 43 };

/** The harmony's events in order, flattened from its parts. */
export const harmonySections = (harmony: Harmony): HarmonySection[] => harmony.parts.flatMap((part) => part.sections);

/** The harmony event a passage belongs to: the one whose Gospel references contain its first verse. */
export function harmonySectionOf(harmony: Harmony, span: Span): HarmonySection | undefined {
  const book = Math.floor(span[0] / 1_000_000);
  const code = Object.keys(BOOK_NUM).find((c) => BOOK_NUM[c] === book) as keyof HarmonySection["refs"] | undefined;
  if (!code) return undefined;
  return harmonySections(harmony).find((s) => s.refs[code]?.some(([a, b]) => span[0] >= a && span[0] <= b));
}
