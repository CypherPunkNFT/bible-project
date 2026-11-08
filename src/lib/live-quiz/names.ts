// Players' names in the live quiz (design.md 6.3, 7.2): the friendly-name picker for rooms where children never type a
// name, and the rules for a typed one. The block-list catches only the obvious; the real safeguards are the leader's
// Remove player and "Name picker only", and nothing here pretends otherwise.

// Each list is one string so the picker's words stay names, not phrases the page translator would swap.
const ADJECTIVES = "Brave Gentle Joyful Faithful Kind Bold Bright Cheerful Humble Loyal Mighty Patient Quiet Swift Steady Wise".split(" ");
const ANIMALS = "Lion Dove Lamb Cedar Eagle Sparrow Deer Fox Owl Olive Raven Ox Camel Badger Falcon Fig".split(" ");

/** A two-word friendly name ("Gentle Dove"); `random` returns a number in [0, 1). */
export function friendlyName(random: () => number = Math.random): string {
  const pick = (words: string[]) => words[Math.min(words.length - 1, Math.floor(random() * words.length))];
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
}

/** Whether a name is one the picker can produce: the only names a "Name picker only" room accepts. */
export function isFriendlyName(name: string): boolean {
  const [adjective, animal, extra] = name.split(" ");
  return extra === undefined && ADJECTIVES.includes(adjective) && animal !== undefined && ANIMALS.includes(animal);
}

export const NAME_MAX = 16;

/** Trimmed, Unicode-normalised, with control, format (zero-width) and repeated spaces removed. */
export function normaliseName(raw: string): string {
  return raw.normalize("NFKC").replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "").replace(/\s+/g, " ").trim();
}

// Matched inside the letters of a name with look-alike digits mapped back (so "sh1t" and "s h i t" are caught)...
const BLOCKED_ANYWHERE = ["fuck", "shit", "cunt", "nigg", "fagg", "wank", "porn", "nazi", "hitler", "whore", "slut", "bitch", "penis", "vagina", "dildo", "boob"];
// ...and these only as whole words, since they sit inside ordinary names ("Dickens", "Cassie", "Shelley").
const BLOCKED_WORDS = ["ass", "arse", "dick", "cock", "fag", "sex", "tit", "tits", "pussy", "rape", "damn", "hell", "crap", "piss", "kill", "die", "poop", "butt", "twat"];
const LOOKALIKES: Record<string, string> = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i" };

const unmask = (text: string) => text.toLowerCase().replace(/[0134578@$!]/g, (c) => LOOKALIKES[c] ?? c);

export function isBlockedName(name: string): boolean {
  const plain = unmask(name);
  const letters = plain.replace(/[^\p{L}]/gu, "");
  if (BLOCKED_ANYWHERE.some((word) => letters.includes(word))) return true;
  return plain.split(/[^\p{L}]+/u).some((word) => BLOCKED_WORDS.includes(word));
}

export type NameCheck = { ok: true; name: string } | { ok: false; error: "name-invalid" | "name-blocked" | "name-picker" };

/** A typed or picked name made ready for the room, or why it cannot be used. */
export function checkName(raw: string, mode: "typed" | "picker"): NameCheck {
  const name = normaliseName(raw);
  const length = Array.from(name).length;
  if (length < 1 || length > NAME_MAX || !/[\p{L}\p{N}]/u.test(name)) return { ok: false, error: "name-invalid" };
  if (mode === "picker" && !isFriendlyName(name)) return { ok: false, error: "name-picker" };
  if (isBlockedName(name)) return { ok: false, error: "name-blocked" };
  return { ok: true, name };
}

/** Names compare without regard to case: "sam" is taken when "Sam" is in. */
export const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();
