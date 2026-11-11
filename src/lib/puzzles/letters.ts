// The letters a word takes in a puzzle grid: accents removed, upper case, A–Z only ("Mary Magdalene" → MARYMAGDALENE).

export function gridLetters(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[^A-Z]/g, "");
}

/** True for text that is already grid letters, `min` to `max` long. */
export const isGridWord = (text: string, min = 2, max = Infinity): boolean =>
  /^[A-Z]+$/.test(text) && text.length >= min && text.length <= max;
