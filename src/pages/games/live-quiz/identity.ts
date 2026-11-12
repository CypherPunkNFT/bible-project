// A player's identity for the game (audit item 5): a small line symbol and one of the site's seven book colours, worked
// out from the name alone so the phone and the big screen agree without a new message between them. Collisions are
// fine: the name is still the thing people read; the symbol and colour only make a name easier to find in a crowd.

export const SYMBOLS = ["fish", "dove", "lamp", "star", "sun", "moon", "leaf", "anchor", "flame", "shell", "mountain", "flower"] as const;
export type PlayerSymbol = (typeof SYMBOLS)[number];

/** The site's seven book colours, as CSS values. */
export const TONES: readonly string[] = ["var(--history)", "var(--poetry)", "var(--prophets)", "var(--gospels)", "var(--acts)", "var(--epistles)", "var(--revelation)"];

export interface Identity { symbol: PlayerSymbol; tone: string }

/** FNV-1a over the name's code points: the same in every browser and on every screen, whatever the script. */
export function hashName(name: string): number {
  let hash = 0x811c9dc5;
  for (const char of name.normalize("NFKC").toLocaleLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function identityOf(name: string): Identity {
  const hash = hashName(name);
  return { symbol: SYMBOLS[hash % SYMBOLS.length], tone: TONES[Math.floor(hash / SYMBOLS.length) % TONES.length] };
}
