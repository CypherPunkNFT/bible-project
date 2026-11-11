// Sounds -> Hebrew, Greek and Aramaic letters, and the letter-by-letter lists shown under each spelling. The tables are
// sounds.json and letters.json; the rules for where a letter changes (a word's start and end, two vowels together)
// are here. Hebrew follows how Israelis write foreign names today; Greek how Greeks do today (μπ for b); Aramaic uses
// the 22 old letters with no modern marks, written in square letters and in Syriac. Design: docs/features/name-in-hebrew.
import letters from "./letters.json";
import tables from "./sounds.json";
import { isVowelSound, type Sound } from "./sounds";

interface SemiticTable {
  consonants: Record<string, string>;
  atStart: Record<string, string>;
  atEnd: Record<string, string>;
  vowels: Record<string, { start: string; mid: string; end: string }>;
  between: string;
}

const HEBREW = tables.hebrew as SemiticTable;
const ARAMAIC = tables.aramaic as SemiticTable;
const GREEK = tables.greek as { consonants: Record<string, string>; pairs: Record<string, string>; vowels: Record<string, string> };
const FINAL_FORMS = letters.finalForms as Record<string, string>;
const TO_SYRIAC = letters.squareToSyriac as Record<string, string>;

function semiticWord(sounds: readonly Sound[], table: SemiticTable): string {
  let out = "";
  sounds.forEach((sound, index) => {
    const first = index === 0;
    const last = index === sounds.length - 1;
    if (!isVowelSound(sound)) {
      out += (first && table.atStart[sound]) || (last && table.atEnd[sound]) || table.consonants[sound] || "";
      return;
    }
    const forms = table.vowels[sound];
    const afterVowel = !first && isVowelSound(sounds[index - 1]);
    // Two vowels together: an alef keeps them apart (Liam ליאם, Zoe זואי), except before a final a or e, whose
    // own letter already does (Olivia אוליביה, Mia מיה).
    if (first) out += forms.start;
    else if (last) out += (afterVowel && sound !== "a" && sound !== "e" ? table.between : "") + forms.end;
    else out += (afterVowel ? table.between : "") + forms.mid;
  });
  return out;
}

/** The final forms (ך ם ן ף ץ) on the last letter of each word, for square letters that do not have them yet. */
export function withFinalForms(text: string): string {
  return text.replace(/([\u05DB\u05DE\u05E0\u05E4\u05E6])(?=$|[\s\u05BE])/gu, (letter) => FINAL_FORMS[letter] ?? letter);
}

export const hebrewBySound = (words: readonly Sound[][]) => words.map((word) => semiticWord(word, HEBREW)).join(" ");

/** Aramaic letters by sound, as plain square letters without final forms (aramaicScripts gives both scripts). */
export const aramaicBySound = (words: readonly Sound[][]) => words.map((word) => semiticWord(word, ARAMAIC)).join(" ");

function greekWord(sounds: readonly Sound[]): string {
  let out = "";
  for (let index = 0; index < sounds.length; index += 1) {
    const pair = GREEK.pairs[`${sounds[index]} ${sounds[index + 1]}`];
    if (pair) { out += pair; index += 1; continue; }
    const sound = sounds[index];
    out += isVowelSound(sound) ? GREEK.vowels[sound] : GREEK.consonants[sound] ?? "";
  }
  // A nasal before its own stop is written once (Brandon Μπράντον, not Μπρανντον); a final sigma takes its end form.
  out = out.replace(/ν(?=ντ)|μ(?=μπ)|γ(?=γκ)/gu, "").replace(/σ$/u, "ς");
  return out ? out[0].toLocaleUpperCase("el") + out.slice(1) : out;
}

export const greekBySound = (words: readonly Sound[][]) => words.map(greekWord).join(" ");

// ---- Hebrew spellings from the Bible ------------------------------------------------------------------------------

const CANTILLATION = /[\u0591-\u05AF\u05BD\u05C0\u05C3]/gu;
const POINT = /[\u0591-\u05C7]/u;
const HEBREW_LETTER = /[\u05D0-\u05EA]/u;
const SIN_DOT = "\u05C2";
const MAQAF = /\u05BE/gu;
const GERESH = "\u05F3";

/** A Hebrew or Greek spelling's first form only (Strong's lists some as "דָּנִיֵּאל, דָּנִאֵל"). */
export const firstForm = (word: string) => word.split(",")[0].trim().normalize("NFC");
/** A pointed Hebrew spelling as shown: its first form, vowel points kept, cantillation marks removed. */
export const withoutCantillation = (word: string) => firstForm(word).replace(CANTILLATION, "");

/** Does the letter at `index` carry a sin dot among the points that follow it? */
function hasSinDot(chars: readonly string[], index: number): boolean {
  for (let ahead = index + 1; ahead < chars.length && POINT.test(chars[ahead]); ahead += 1) if (chars[ahead] === SIN_DOT) return true;
  return false;
}

/**
 * A Hebrew spelling as Aramaic letters: points removed, the maqaf (Hebrew hyphen) a space, and a sin (ש with its dot
 * on the left) written ܣ in Syriac, as Syriac spells it. Returns the square letters and the Syriac.
 */
export function aramaicFromHebrew(word: string): { square: string; syriac: string } {
  const chars = [...firstForm(word).replace(MAQAF, " ")];
  let square = "";
  let syriac = "";
  chars.forEach((char, index) => {
    if (HEBREW_LETTER.test(char)) {
      square += char;
      syriac += hasSinDot(chars, index) ? TO_SYRIAC["ס"] : TO_SYRIAC[char];
    } else if (/\s/u.test(char) && !square.endsWith(" ")) {
      square += " ";
      syriac += " ";
    }
  });
  return { square: square.trim(), syriac: syriac.trim() };
}

/** Plain square letters (no final forms yet) -> square letters with final forms, and Syriac. */
export function aramaicScripts(plain: string): { square: string; syriac: string } {
  return { square: withFinalForms(plain), syriac: [...plain].map((char) => TO_SYRIAC[char] ?? (char === " " ? " " : "")).join("") };
}

// ---- Letter by letter ----------------------------------------------------------------------------------------------

export interface Letter { glyph: string; name: string }

const HEBREW_NAMES = letters.hebrewNames as Record<string, string>;
const GREEK_NAMES = letters.greekNames as Record<string, string>;
const SYRIAC_NAMES = letters.syriacNames as Record<string, string>;

/** Hebrew or square Aramaic letters with their names, in reading order (right to left). A geresh (׳) joins its letter. */
export function hebrewLetters(text: string): Letter[] {
  const out: Letter[] = [];
  const chars = [...text];
  chars.forEach((char, index) => {
    const previous = out[out.length - 1];
    if (char === GERESH && previous) { previous.glyph += char; previous.name += letters.gereshSuffix; return; }
    const name = HEBREW_NAMES[char];
    if (name) out.push({ glyph: char, name: char === "ש" && hasSinDot(chars, index) ? "sin" : name });
  });
  return out;
}

export function greekLetters(text: string): Letter[] {
  return [...text.normalize("NFD")].flatMap((char) => {
    const name = GREEK_NAMES[char.toLocaleLowerCase("el")];
    return name ? [{ glyph: char.normalize("NFC"), name }] : [];
  });
}

export function syriacLetters(text: string): Letter[] {
  return [...text].flatMap((char) => (SYRIAC_NAMES[char] ? [{ glyph: char, name: SYRIAC_NAMES[char] }] : []));
}
