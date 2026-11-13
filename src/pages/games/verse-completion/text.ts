// Verse completion: the game's fixed wording, under label keys so the translation collector picks it up (design §12).
// The verses themselves are always the English Berean Standard Bible, in every language of the site.
import type { BoxChange } from "./boxes.ts";
import type { Verdict } from "./match.ts";
import type { Level } from "./model.ts";

export const ANSWERS = [
  { value: "pick", label: "Pick" },
  { value: "type", label: "Type" },
] as const;

export const STYLES = [
  { value: "words", label: "Whole words" },
  { value: "letters", label: "First letters" },
] as const;

export const LEVELS: readonly { value: Level; label: string; text: string }[] = [
  { value: "easy", label: "Easy", text: "Famous verses, the last part hidden" },
  { value: "medium", label: "Medium", text: "Famous and well-known verses, about half hidden" },
  { value: "hard", label: "Hard", text: "Every verse in the game, only the opening words shown" },
];

/** Where the verses come from, as picture tiles (Start.tsx): the drawing and short line each tile shows. */
export const TESTAMENTS = [
  { value: "all", label: "Whole Bible", icon: "book", note: "Genesis to Revelation" },
  { value: "ot", label: "Old Testament", icon: "tablets", note: "Genesis to Malachi" },
  { value: "nt", label: "New Testament", icon: "cross", note: "Matthew to Revelation" },
] as const;

/** Each word state has its own symbol and words, never colour alone (§6.5). */
export const VERDICTS: Record<Verdict, { label: string; symbol: string }> = {
  exact: { label: "Right", symbol: "✓" },
  typo: { label: "Typo accepted", symbol: "≈" },
  near: { label: "Nearly right", symbol: "½" },
  wrong: { label: "Wrong", symbol: "✗" },
  missing: { label: "Missed", symbol: "○" },
};

/** A hinted word is shown, not typed: its own mark in the result (display only; it still scores as wrong, §3.1). */
export const SHOWN_MARK = { label: "Shown with a hint", symbol: "◇" };

/** The verdict words in the band after a card, by stars. */
export const BAND_LINES: readonly { label: string }[] = [
  { label: "Not this time" },
  { label: "Getting there" },
  { label: "Nearly there" },
  { label: "Right!" },
];

/** The round's title by its share of the stars possible (the kit's RankLine). */
export const ROUND_RANKS: readonly { from: number; title: string }[] = [
  { from: 0, title: "Keep going" },
  { from: 0.4, title: "Good round" },
  { from: 0.7, title: "Well remembered" },
  { from: 1, title: "Word perfect round!" },
];

export const STAR_LINES: readonly { label: string }[] = [
  { label: "No stars" },
  { label: "One star" },
  { label: "Two stars" },
  { label: "Three stars" },
];

export const LEGENDS = {
  answer: { label: "Answer" },
  mode: { label: "How you answer" },
  typing: { label: "Typing" },
  difficulty: { label: "Difficulty" },
  from: { label: "Verses from" },
};

export const BOX_MEANING: Record<number, { label: string }> = {
  1: { label: "Learning" },
  2: { label: "Learning" },
  3: { label: "Getting there" },
  4: { label: "Nearly there" },
  5: { label: "Nearly there" },
};

export const boxLabel = (box: number): string => BOX_MEANING[box]?.label ?? "";

/** Each box's own sentence: the gap follows from the box (1, 3, 7, 14 and 30 days), so no count is pieced in. */
const UP_TEXT: Record<number, { label: string }> = {
  2: { label: "Up to box 2: back in 3 days" },
  3: { label: "Up to box 3: back in 7 days" },
  4: { label: "Up to box 4: back in 14 days" },
  5: { label: "Up to box 5: back in 30 days" },
};
const STAY_TEXT: Record<number, { label: string }> = {
  1: { label: "Stays in box 1: back tomorrow" },
  2: { label: "Stays in box 2: back in 3 days" },
  3: { label: "Stays in box 3: back in 7 days" },
  4: { label: "Stays in box 4: back in 14 days" },
  5: { label: "Stays in box 5: back in 30 days" },
};

/** The box change after an answer in My verses, in words (§10.3). */
export function boxChangeText(change: BoxChange): string {
  switch (change.kind) {
    case "up": return UP_TEXT[change.box]?.label ?? "";
    case "memorised": return "Memorised! It comes back in 60 days to keep it fresh.";
    case "renewed": return "Still memorised: back in 60 days.";
    case "stay": return STAY_TEXT[change.box]?.label ?? "";
    case "reset": return "Back to box 1: back tomorrow";
    case "early": return "Not due yet, so its box stays the same.";
    case "not-hard": return "Only a Hard round or a review can move it up a box.";
    case "ceiling": return change.style === "pick"
      ? "Picking can lift a verse only to box 2. Type it to move it higher."
      : "First letters can lift a verse only to box 4. Type the whole words to finish learning it.";
  }
}

export const HELP_LINES: readonly { label: string }[] = [
  { label: "Pick: choose the right ending from three, or at Hard rebuild it word by word." },
  { label: "Type: write the rest of the verse, either whole words or the first letter of each word." },
  { label: "Easy hides the last part of famous verses, Medium about half, and Hard everything after the opening words." },
  { label: "Capitals, punctuation and small typos don't count against you. A different word does." },
  { label: "Add any verse to My verses to learn it by heart." },
  { label: "Each verse climbs five boxes and comes back after 1, 3, 7, 14 and 30 days; a miss sends it back to box 1." },
  { label: "Typing the whole words in a Hard round or a review is what marks a verse Memorised." },
  { label: "The verses are the Berean Standard Bible, in English, in every language of the site." },
  { label: "Your progress stays in this browser. Your answers are not uploaded." },
];
