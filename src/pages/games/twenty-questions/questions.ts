// Bible twenty questions: the form rules every pre-written question must pass (design §6). Used by
// scripts/twenty-questions/check.ts and the data test. Relative imports only (Node loads it directly).

const OPENERS = ["Is ", "Was ", "Did ", "Does ", "Has "];
const HARD_WORDS = /\b(patriarch|theophany|levitical|pentateuch|eschatolog|covenantal)\w*/i;
const PRONOUNS = /\b(he|she|his|her|him)\b/i;

const normal = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\byour person\b/g, "").replace(/\s+/g, " ").trim();

/** Problems with one question, given every question (to catch duplicates); empty when it passes. */
export function questionProblems(question: string, all: readonly string[]): string[] {
  const problems: string[] = [];
  if (!OPENERS.some((o) => question.startsWith(o))) problems.push(`must start with ${OPENERS.map((o) => o.trim()).join(", ")}`);
  if (!question.endsWith("?")) problems.push("must end with a question mark");
  if (question.length > 70) problems.push(`is ${question.length} characters; the limit is 70`);
  if (!question.includes("your person")) problems.push('must say "your person"');
  if (PRONOUNS.test(question)) problems.push("must not use he, she, his or her before the sex is known");
  if (HARD_WORDS.test(question)) problems.push("uses a word a ten-year-old may not know");
  if (all.filter((q) => normal(q) === normal(question)).length > 1) problems.push("duplicates another question");
  return problems;
}
