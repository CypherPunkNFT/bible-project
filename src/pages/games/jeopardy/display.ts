// Small display rules shared by Bible Jeopardy's screens: choice letters, the clue's type size, the order of the team
// buttons, and why a team name cannot be used (the live quiz's name check and wording).
import { checkName } from "@/lib/live-quiz/names";

export const LETTERS = ["A", "B", "C", "D"];

/** The clue's size: up to 80 letters about 6% of the screen height, up to 140 about 5%, longer about 4% (9.4). */
export const clueSize = (text: string) => (text.length <= 80 ? "is-short" : text.length <= 140 ? "is-mid" : "is-long");

/** Why the team name at `index` cannot be used, or null: its own problem, or an earlier team has the same name. */
export function teamNameProblem(names: readonly string[], index: number): string | null {
  const own = nameProblem(names[index]);
  if (own) return own;
  const key = (name: string) => name.trim().toLocaleLowerCase();
  return names.findIndex((name) => key(name) === key(names[index])) < index ? "Another team already has this name." : null;
}

/** Why a team name cannot be used, or null. */
export function nameProblem(name: string): string | null {
  const check = checkName(name, "typed");
  if (check.ok) return null;
  return check.error === "name-blocked" ? "Please choose another name." : "Please choose a name of 1 to 16 letters.";
}
