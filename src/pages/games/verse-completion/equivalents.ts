// Verse completion: other ways of writing the BSB's words that count as the same word (design §6.2). Hand-kept on
// purpose: an automatic spelling rule would let real differences through.
import { normalize } from "./words.ts";

/** Typed contractions, expanded before lining up. "its", "ill", "well", "shell" and "were" are real words: not here. */
export const CONTRACTIONS: ReadonlyMap<string, string> = new Map([
  ["dont", "do not"], ["doesnt", "does not"], ["didnt", "did not"], ["wont", "will not"], ["cant", "cannot"],
  ["isnt", "is not"], ["arent", "are not"], ["wasnt", "was not"], ["werent", "were not"], ["havent", "have not"],
  ["hasnt", "has not"], ["hadnt", "had not"], ["shouldnt", "should not"], ["wouldnt", "would not"], ["couldnt", "could not"],
  ["mustnt", "must not"], ["neednt", "need not"], ["shant", "shall not"], ["im", "i am"], ["ive", "i have"],
  ["youre", "you are"], ["youve", "you have"], ["youll", "you will"], ["theyre", "they are"], ["theyve", "they have"],
  ["theyll", "they will"], ["weve", "we have"], ["hes", "he is"], ["shes", "she is"], ["thats", "that is"],
  ["theres", "there is"], ["whats", "what is"], ["lets", "let us"],
]);

/** A contraction as the Bible would print it: a passage holding one is refused by the build (§15). */
export function isContraction(raw: string): boolean {
  const word = raw.replace(/^[^\p{L}]+|[^\p{L}’']+$/gu, "");
  return /n[’']t$/i.test(word) || /[’'](ll|re|ve|m|d)$/i.test(word)
    || /^(it|that|he|she|there|here|what|who|let|where)[’']s$/i.test(word);
}

const BRITISH: readonly [string, string][] = [
  ["honour", "honor"], ["honours", "honors"], ["honoured", "honored"], ["honouring", "honoring"], ["honourable", "honorable"],
  ["saviour", "savior"], ["neighbour", "neighbor"], ["neighbours", "neighbors"], ["favour", "favor"], ["favoured", "favored"],
  ["favourable", "favorable"], ["labour", "labor"], ["labours", "labors"], ["laboured", "labored"], ["colour", "color"],
  ["colours", "colors"], ["behaviour", "behavior"], ["splendour", "splendor"], ["harbour", "harbor"], ["rumour", "rumor"],
  ["vigour", "vigor"], ["odour", "odor"], ["judgement", "judgment"], ["judgements", "judgments"], ["worshipped", "worshiped"],
  ["worshipping", "worshiping"], ["worshipper", "worshiper"], ["worshippers", "worshipers"], ["counsellor", "counselor"],
  ["counsellors", "counselors"], ["counselled", "counseled"], ["travelled", "traveled"], ["travelling", "traveling"],
  ["fulfil", "fulfill"], ["fulfils", "fulfills"], ["fulfilment", "fulfillment"], ["recognise", "recognize"],
  ["recognised", "recognized"], ["realise", "realize"], ["realised", "realized"], ["baptise", "baptize"], ["baptised", "baptized"],
  ["centre", "center"], ["defence", "defense"], ["offence", "offense"], ["offences", "offenses"], ["grey", "gray"],
  ["jewellery", "jewelry"], ["plough", "plow"], ["ploughs", "plows"], ["sceptre", "scepter"], ["armour", "armor"],
  ["fervour", "fervor"], ["clamour", "clamor"], ["sombre", "somber"],
];

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const TENS = ["thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const SAME: ReadonlyMap<string, string> = new Map([
  ...BRITISH,
  ...NUMBER_WORDS.map((word, i): [string, string] => [word, String(i)]),
  ...TENS.map((word, i): [string, string] => [word, String((i + 3) * 10)]),
  ["hundred", "100"], ["thousand", "1000"],
]);

/** The one form a word is compared in: the BSB's spelling, or the digits of a number word. */
export const equivalent = (key: string): string => SAME.get(key) ?? key;

/** A typed answer as words: normalised, contractions expanded, "can not" joined. Compare them through `equivalent`. */
export function typedTokens(text: string): string[] {
  const expanded = normalize(text).flatMap((word) => (CONTRACTIONS.get(word) ?? word).split(" "));
  const joined: string[] = [];
  for (const word of expanded) {
    if (word === "not" && joined[joined.length - 1] === "can") joined[joined.length - 1] = "cannot";
    else joined.push(word);
  }
  return joined;
}
