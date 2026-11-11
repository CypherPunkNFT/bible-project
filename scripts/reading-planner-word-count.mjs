// How the reading planner counts words (design 2), shared by the build script and the data test so the two can never
// disagree. A word is a run of letters or digits, with straight or curly apostrophes and hyphens kept inside it.
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/** Words in a piece of text. */
export const countWords = (text) => (text.match(WORD) ?? []).length;

/** Words per chapter of one book, from its { "chapter:verse": text } file; chapter n is at index n − 1. */
export function countChapterWords(verses) {
  const counts = [];
  for (const [key, text] of Object.entries(verses)) {
    const chapter = Number(key.split(":")[0]);
    if (!Number.isInteger(chapter) || chapter < 1) throw new Error(`reading planner: verse key "${key}" has no chapter number`);
    while (counts.length < chapter) counts.push(0);
    counts[chapter - 1] += countWords(String(text));
  }
  return counts;
}
