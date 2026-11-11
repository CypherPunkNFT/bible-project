// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { Bookcase, CatalogueTray, ReadingLamp, ScrollAndCodex, Shelf } from "./DoorwaySources";
export const SOURCES_DOORWAYS: DoorwayVariant[] = [
  { name: "The shelf, enlarged", Art: Shelf },
  { name: "Two-shelf bookcase", Art: Bookcase },
  { name: "Scroll, codex and fragment", Art: ScrollAndCodex },
  { name: "Catalogue tray and shelf", Art: CatalogueTray },
  { name: "Books under a reading lamp", Art: ReadingLamp },
];
