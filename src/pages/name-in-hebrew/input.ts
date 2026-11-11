// What a visitor types, made safe and tidy before anything is spelled or looked up. The same rule serves the form and
// the address (?name=), so a link can never carry something the form would refuse: Latin letters only (accents kept),
// with spaces, hyphens and apostrophes between them, at most MAX_NAME letters. Everything else, digits, dots, slashes,
// other alphabets and invisible direction marks included, is dropped, and `dropped` says so.

export const MAX_NAME = 40;

/** Letters that Unicode does not split into a plain letter and an accent, written the way English does. */
const FOLD: Record<string, string> = { ß: "ss", æ: "ae", ø: "o", ł: "l", đ: "d", þ: "th", œ: "oe", ı: "i", ð: "d" };

export interface CleanName {
  /** The name as the page shows it: words in title case ("MARY jane" -> "Mary Jane"). */
  display: string;
  /** Its words in lower case, accents kept (José stays josé: its accent marks it Spanish). */
  words: string[];
  /** True when something typed was not a Latin letter, space, hyphen or apostrophe. */
  dropped: boolean;
}

const titleCase = (word: string) => word.replace(/(^|[-'’])(\p{L})/gu, (_match, before: string, letter: string) => before + letter.toLocaleUpperCase("en"));

export function cleanName(raw: string): CleanName {
  const composed = raw.normalize("NFC");
  let kept = "";
  let dropped = false;
  for (const char of composed) {
    if (/\p{Script=Latin}/u.test(char) || /[\s'’-]/u.test(char)) kept += char;
    else dropped = true;
  }
  const tidy = kept.replace(/’/g, "'").replace(/\s+/g, " ").replace(/^[\s'-]+|[\s'-]+$/g, "");
  const letters = [...tidy];
  if (letters.length > MAX_NAME) dropped = true;
  const cut = letters.slice(0, MAX_NAME).join("").replace(/[\s'-]+$/g, "");
  const words = cut.toLocaleLowerCase("en").split(" ").filter((word) => /\p{L}/u.test(word));
  return { display: words.map(titleCase).join(" "), words, dropped };
}

/** A word in plain a-z for the rules and the slug: accents removed, ß and the like written out. */
export function plainLetters(word: string): string {
  return [...word.toLocaleLowerCase("en")].map((char) => FOLD[char] ?? char).join("")
    .normalize("NFKD").replace(/\p{M}/gu, "");
}

/** True when a word has an accented vowel or ñ, the mark of a Spanish (or other Romance) name. */
export const looksSpanish = (word: string) => /[áéíóúñ]/u.test(word);
