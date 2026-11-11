// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import "./academic-mockups.css";
import { LongCopyScene, ReadingsScene, TellScene, WitnessesScene } from "./AcademicMockups";
import type { Mockup } from "./types";
export const MOCKUPS: Mockup[] = [
  { name: "The Long Copy", note: "Isaiah 40:8 carried in one ruled line from the Great Isaiah Scroll through Codex Sinaiticus and the Leningrad Codex to the 1611 King James Bible, a light travelling along it; on hover the four copies lift off the timeline.", Scene: LongCopyScene },
  { name: "Four Witnesses", note: "A two-by-two cabinet of framed witnesses (Papyrus 52, the Pilate Stone, Codex Sinaiticus, the 1611 King James Bible) threaded to a seal carrying Pilate's question from John 18:38; on hover the panels part and the seal grows.", Scene: WitnessesScene },
  { name: "The Tell", note: "A mound cut open into four dated layers, each find on the right kept apart from the date concluded from it on the left; on hover the layers separate.", Scene: TellScene },
  { name: "One Stroke", note: "A lens over a Greek folio at 1 Timothy 3:16, where one small bar turns “who” into “God”, with both readings on cards; on hover the lens lifts and the cards draw apart.", Scene: ReadingsScene },
];
