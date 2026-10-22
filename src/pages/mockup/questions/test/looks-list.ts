// The four looks of the test page, in the order the mock-up bar offers them.
import type { ComponentType } from "react";
import { LookDeck, LookPanel, LookPaper, LookStage, type LookProps } from "./Looks";

export interface Look { id: string; name: string; note: string; Look: ComponentType<LookProps> }
export const LOOKS: Look[] = [
  { id: "paper", name: "The exam paper", note: "A printed page: a big numeral behind each question, and the marks drawn in like a teacher's.", Look: LookPaper },
  { id: "deck", name: "The card deck", note: "A stack of cards that thins as you go. Answer, and the card turns over to show the verse.", Look: LookDeck },
  { id: "stage", name: "The dark stage", note: "Gold type on a dark field of slow floating dust, a step for every question along the top.", Look: LookStage },
  { id: "panel", name: "Try one, grown up", note: "The header's Try one panel at full size, one height for every question, a ring filling beside it.", Look: LookPanel },
];
