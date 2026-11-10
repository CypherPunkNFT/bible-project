// What a day file holds (docs/features/verse-widget/design.md 4.5), made from a scheduled day and the Berean's words.
// Shared by the build script, which writes the files, and the data test, which rebuilds them to compare.
import { readPath } from "@/data/verse-of-the-day/keys";
import { assemblePassage, passageReference } from "@/pages/life-events/passage";
import { passageOfDay, type ScheduledDay, type Season } from "./schedule";

/** Ordinary entries are 220 characters or fewer after tidying, so the fixed-height frame fits them (design 4.2). */
export const MAX_ORDINARY = 220;

export interface DayFile {
  v: 1;
  date: string;
  text: string;
  reference: string;
  translation: "BSB";
  read: string;
  season: Season | null;
}

export interface Words {
  /** A verse id's Berean text, or null. */
  verse: (id: number) => string | null;
  /** A book number's English name. */
  bookName: (bookNumber: number) => string;
}

export function dayFileOf(date: string, day: ScheduledDay, words: Words): DayFile {
  const passage = passageOfDay(day);
  return {
    v: 1,
    date,
    text: assemblePassage(passage, words.verse),
    reference: passageReference(passage, words.bookName),
    translation: "BSB",
    read: readPath(passage),
    season: typeof day !== "string" && "season" in day ? day.season : null,
  };
}
