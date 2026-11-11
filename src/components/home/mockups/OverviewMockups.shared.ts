// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import "./overview-mockups.css";
import { LampScene, SurveyScene, WindowsScene } from "./OverviewMockups";
import type { Mockup } from "./types";
export const MOCKUPS: Mockup[] = [
  { name: "The Surveyor's Map", note: "An engraved three-panel sheet with a piano-key border, compass rose, cartouche, contour hills, a lake, a village, fifteen towns and a legend keyed to learning, fellowship and help for life, a light walking the road between them under Isaiah 30:21; on hover the panels part and the rose turns.", Scene: SurveyScene },
  { name: "The Lamplit Map", note: "A traveller's map half-opened on a wooden table beside an oil lamp, its right panel still lifting, lamplight walking the road past six labelled stops (Moses: three forties, Bible study and prayer, fifteen city maps) under Psalm 119:105; on hover the panel opens further and the lamp brightens.", Scene: LampScene },
  { name: "Three Windows", note: "A folding map stood up like a screen, each panel framing a scene (an open workbook, a table of friends under a lamp, a lit doorway beside a street map of fifteen pins) with the road running beneath all three under Galatians 6:2; on hover the panels part and the door opens wider.", Scene: WindowsScene },
];
