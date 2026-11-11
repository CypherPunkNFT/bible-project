// Where a puzzle word stands in a verse (design §5): as a whole word, any case, with a possessive ’s allowed ("the
// eagle’s"), never as part of a longer word or a contraction ("haven’t" is not HAVEN). The build script checks every
// verse with it and the result card highlights with it, so the two always agree. No imports (Node loads it as it is).

export function wordPattern(word: string): RegExp {
  return new RegExp(`(?<![A-Za-z])${word}(?:[’']s)?(?![A-Za-z]|[’'][A-Za-z])`, "gi");
}

export const verseHasWord = (text: string, word: string): boolean => wordPattern(word).test(text);

/** The verse cut into plain and matched pieces, in order, for highlighting. */
export function splitOnWord(text: string, word: string): { text: string; match: boolean }[] {
  const pieces: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const found of text.matchAll(wordPattern(word))) {
    const at = found.index ?? 0;
    if (at > last) pieces.push({ text: text.slice(last, at), match: false });
    pieces.push({ text: found[0], match: true });
    last = at + found[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last), match: false });
  return pieces;
}
