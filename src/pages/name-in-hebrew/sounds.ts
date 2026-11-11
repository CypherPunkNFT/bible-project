// English spelling -> sounds, by rule (design: docs/features/name-in-hebrew/design.md, section 4 and "Review").
// A word is first looked up in sounds.json's `common` list (names whose spelling misleads the rules), then read left to
// right, longest letter group first. The result is a list of sounds such as ["m", "ai", "k"], which transliterate.ts
// writes in each script. It is a fair guess at an English speaker's way of saying the name, never more.
import tables from "./sounds.json";
import { looksSpanish, plainLetters } from "./input";

export type Sound = string;

const COMMON = tables.common as Record<string, string>;
const VOWEL_SOUNDS = new Set(["a", "e", "i", "o", "u", "ei", "ai", "oi", "au"]);
export const isVowelSound = (sound: Sound) => VOWEL_SOUNDS.has(sound);

const isVowel = (char: string | undefined) => !!char && "aeiou".includes(char);
const isConsonant = (char: string | undefined) => !!char && /[a-z]/.test(char) && !isVowel(char) && char !== "y";
const LONG: Record<string, Sound> = { a: "ei", e: "i", i: "ai", o: "o", u: "u", y: "ai" };

/** Letter groups read as one sound, longest first. A function decides the sound where it depends on the place. */
type Rule = [string, Sound[] | ((word: string, at: number) => Sound[] | null)];
const RULES: Rule[] = [
  ["tch", ["ch"]], ["sch", ["sh"]], ["chr", ["k", "r"]], ["chl", ["k", "l"]], ["igh", ["ai"]],
  ["iel", (_word, at) => (at > 0 ? ["y", "e", "l"] : null)],
  ["gh", (_word, at) => (at === 0 ? ["g"] : [])],
  ["ch", ["ch"]], ["sh", ["sh"]], ["ph", ["f"]], ["th", ["th"]], ["ck", ["k"]], ["qu", ["k", "w"]],
  ["wh", ["w"]], ["wr", (_word, at) => (at === 0 ? ["r"] : null)], ["kn", (_word, at) => (at === 0 ? ["n"] : null)],
  ["tz", ["ts"]], ["ts", ["ts"]], ["zh", ["zh"]], ["kh", ["kh"]], ["dg", ["j"]],
  ["ee", ["i"]], ["ea", ["i"]], ["oo", ["u"]], ["ai", ["ei"]], ["ay", ["ei"]], ["oa", ["o"]], ["au", ["o"]], ["aw", ["o"]],
  ["ew", ["u"]], ["oi", ["oi"]], ["oy", ["oi"]],
  ["ie", (word, at) => (at + 2 === word.length || isConsonant(word[at + 2]) ? ["i"] : null)],
  ["ei", ["ei"]],
  ["ey", (word, at) => (at + 2 === word.length && isConsonant(word[at - 1]) ? ["i"] : ["ei"])],
  ["ou", ["au"]],
  ["ow", (word, at) => (at + 2 === word.length ? ["o"] : ["au"])],
];

/** The silent-e rule: one vowel, one consonant, then a final e (Kate, Mike, Rose, Luke). Returns the vowel's index. */
function magicVowel(word: string): number {
  const n = word.length;
  if (n < 3 || word[n - 1] !== "e") return -1;
  const consonant = word[n - 2];
  if (!isConsonant(consonant) || "wx".includes(consonant)) return -1;
  const vowel = word[n - 3];
  if (!(isVowel(vowel) || vowel === "y") || isVowel(word[n - 4])) return -1;
  return n - 3;
}

function letterSound(word: string, at: number, spanish: boolean): Sound[] {
  const char = word[at];
  const next = word[at + 1];
  const last = at === word.length - 1;
  switch (char) {
    case "c": return next && "eiy".includes(next) ? ["s"] : ["k"];
    case "g":
      if (next === "i" && isVowel(word[at + 2])) return ["j"]; // Gianna; the i is skipped by the caller
      return next && "ey".includes(next) ? ["j"] : ["g"];
    case "j": return spanish ? ["kh"] : ["j"];
    case "x": return at === 0 ? ["z"] : ["k", "s"];
    case "q": return ["k"];
    case "h":
      if (at > 0 && (isVowel(word[at - 1]) || isConsonant(word[at - 1]))) return []; // Leah, Sarah; Rhys
      return ["h"];
    case "w": return isVowel(next) || next === "y" ? ["w"] : [];
    case "y":
      if (at === 0 && isVowel(next)) return ["y"];
      if (last) return ["i"];
      if (isConsonant(next) && (isVowel(word[at + 2]) || word[at + 2] === "y")) return ["ai"]; // Kyle, Tyler, Myla
      return ["i"];
    case "e": return last && at > 0 && !spanish ? [] : ["e"];
    case "u": return isConsonant(next) && isConsonant(word[at + 2]) && next !== word[at + 2] ? ["a"] : ["u"]; // Hunter
    case "ñ": return ["n", "y"];
    default: return /[a-z]/.test(char) ? [char] : [];
  }
}

/** One word's sounds. Spanish-looking words (an accent) read j as kh and sound a final e. */
function wordSounds(raw: string): Sound[] {
  const listed = COMMON[raw] ?? COMMON[plainLetters(raw)];
  if (listed) return listed.split(" ");
  const spanish = looksSpanish(raw);
  let word = plainLetters(raw).replace(/'/g, "");
  if (spanish) word = word.replace(/ll/g, "y");
  let trailingZ = false;
  // Miles, James: a silent e then s, read as the e-rule plus z.
  if (/[aeiouy][b-df-hj-np-tv-z]es$/.test(word) && word.length > 4) {
    word = word.slice(0, -1);
    trailingZ = true;
  }
  const magic = spanish ? -1 : magicVowel(word);
  const sounds: Sound[] = [];
  for (let at = 0; at < word.length;) {
    if (at === magic) { sounds.push(LONG[word[at]]); at += 1; continue; }
    if (at > 0 && word[at] === word[at - 1] && isConsonant(word[at])) { at += 1; continue; } // doubled letters once
    const rule = RULES.find(([letters, result]) => word.startsWith(letters, at) && (typeof result !== "function" || result(word, at) !== null));
    if (rule) {
      const [letters, result] = rule;
      sounds.push(...(typeof result === "function" ? result(word, at)! : result));
      at += letters.length;
      continue;
    }
    sounds.push(...letterSound(word, at, spanish));
    at += word[at] === "g" && word[at + 1] === "i" && isVowel(word[at + 2]) ? 2 : 1;
  }
  if (trailingZ) sounds.push("z");
  // Two identical sounds in a row (a doubled letter the rules read separately) are said once.
  return sounds.filter((sound, index) => sound !== sounds[index - 1] || isVowelSound(sound));
}

/** The sounds of each word of a name; hyphenated parts are spelled as separate words (Mary-Jane). */
export function nameSounds(words: readonly string[]): Sound[][] {
  return words.flatMap((word) => word.split("-")).filter((word) => /\p{L}/u.test(word)).map(wordSounds).filter((sounds) => sounds.length > 0);
}

