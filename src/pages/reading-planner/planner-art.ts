// The reading planner's picture on the tools hub, as the registry takes it (src/pages/tools/registry.ts): the drawing in
// art.tsx, the poetry tone, and what it shows for screen readers.
import type { GameArt } from "@/pages/games/art/draw";
import { ReadingPlannerScene } from "./art";

export const READING_PLANNER_ART: GameArt = {
  Scene: ReadingPlannerScene,
  tone: "poetry",
  alt: "An open Bible with a ribbon, a calendar page with days ticked off, and a small clock",
};
