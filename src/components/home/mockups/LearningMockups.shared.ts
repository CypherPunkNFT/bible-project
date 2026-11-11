// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import "./learning-mockups.css";
import { DeskScene, ExplodedScene, TypeCaseScene } from "./LearningMockups";
import type { Mockup } from "./types";
export const MOCKUPS: Mockup[] = [
  { name: "The Exploded Workbook", note: "“Moses: three forties” taken apart like an engineer's drawing: the cover, an engraved page for each forty (the palace of Egypt, the burning bush in Midian, the tents of the wilderness), the activity page and a memory-verse card lifting off along dashed assembly lines, each labelled, a light climbing through them under Deuteronomy 34:7; on hover the layers part further.", Scene: ExplodedScene },
  { name: "The Study Desk", note: "The open spread seen from above on a wooden desk: the passage with its engraved bush and key verse on the left, three questions with room to write on the right (one being answered), seven coloured tabs for the readers from little ones to leaders, verse cards, a ribbon and a lamp whose light drifts across the page; on hover the tabs fan out and the cards spread.", Scene: DeskScene },
  { name: "The Type Case", note: "A printer's type case holding the real catalogue, seven readers by nine kinds, one spine per title (41), with the one ready title, “Moses: three forties”, lifted out of its compartment and lit, a light running along its row to it; on hover the cover rises and the case settles.", Scene: TypeCaseScene },
];
