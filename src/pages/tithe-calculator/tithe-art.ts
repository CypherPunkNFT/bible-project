// The tithe calculator's picture on the tools hub, as the registry takes it (src/pages/tools/registry.ts): the drawing in
// art.tsx, its colour, and what it shows for screen readers. The tone is set to one no other tool in its category uses.
import type { GameArt } from "@/pages/games/art/draw";
import { TitheScene } from "./art";

export const TITHE_ART: GameArt = {
  Scene: TitheScene,
  tone: "history",
  alt: "An offering bowl with one coin falling into it, a sheaf of wheat on one side and a stack of nine coins on the other",
};
