// Colour contrast for the builder's warning (docs/features/verse-widget/design.md 5.3): WCAG 2 relative luminance and
// contrast ratio. The card colours are the ones public/widget/v1/verse.js draws; a test checks the two agree.

export const CARD_COLOURS = {
  light: { background: "#fffdf8", text: "#1f1b16", muted: "#6b6255" },
  dark: { background: "#1b1916", text: "#ece6da", muted: "#a39a8b" },
} as const;

/** WCAG AA for ordinary text. */
export const AA = 4.5;

function channels(hex: string): [number, number, number] {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? digits.split("").map((digit) => digit + digit).join("") : digits;
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16) / 255) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Which card backgrounds a link colour is hard to read on, for the card's colour choice ("auto" shows both). */
export function hardToReadOn(accent: string, theme: "auto" | "light" | "dark"): ("light" | "dark")[] {
  const shown: ("light" | "dark")[] = theme === "auto" ? ["light", "dark"] : [theme];
  return shown.filter((surface) => contrastRatio(accent, CARD_COLOURS[surface].background) < AA);
}
