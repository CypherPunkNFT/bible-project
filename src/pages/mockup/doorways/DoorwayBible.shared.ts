// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { GiltClosed, Lectern, Standing, TallOpen, TurningPage } from "./DoorwayBible";
export const BIBLE_DOORWAYS: DoorwayVariant[] = [
  { name: "Tall open book", Art: TallOpen },
  { name: "Open on the lectern", Art: Lectern },
  { name: "Standing, closed", Art: Standing },
  { name: "Gilt-edged, lying closed", Art: GiltClosed },
  { name: "Turning the page", Art: TurningPage },
];
