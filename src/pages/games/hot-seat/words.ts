// Hot seat: a question's opening words (design §3.4). "Is the book of…" twice in one turn feels like a drill, so a turn
// never asks two questions whose first four words match. Kept apart so pool.ts can work them out once per question.

/** The first four words, lower case and without punctuation. */
export function firstWords(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
}
