// The game's fixed wording, under label keys so the translation collector picks it up: the hint for each category
// (design §3.4), the line for a win in one to six tries (§9.3) and what a tile or key tells a screen reader (§10).
import type { Category } from "./daily-rules";
import type { Mark } from "./evaluate";

export const CATEGORY_HINT: Record<Category, { label: string }> = {
  person: { label: "A person in the Bible" },
  place: { label: "A place in the Bible" },
  creature: { label: "An animal or creature in the Bible" },
  object: { label: "Something you could see or hold" },
  idea: { label: "An idea, quality or feeling" },
  action: { label: "Something people do" },
};

/** Index 0 is a win in one try. */
export const WIN_LINES: readonly { label: string }[] = [
  { label: "Hallelujah!" },
  { label: "Wonderful!" },
  { label: "Splendid!" },
  { label: "Well done!" },
  { label: "Good and faithful!" },
  { label: "Just in time!" },
];

/**
 * A tile or key for screen readers: "F is in the right spot", "A is in the word, wrong spot", "T is not in the word".
 * Each label starts with the letter and goes on in words (never a comma first), so the translation collector takes it.
 */
export function markLabel(letter: string, mark: Mark): string {
  const shown = letter.toUpperCase();
  if (mark === "correct") return `${shown} is in the right spot`;
  if (mark === "present") return `${shown} is in the word, wrong spot`;
  return `${shown} is not in the word`;
}
