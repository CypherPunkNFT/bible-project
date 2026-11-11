// The converter's picture on the tools hub, as the registry takes it (src/pages/tools/registry.ts): the drawing in art.tsx,
// the history tone, and what it shows for screen readers.
import type { GameArt } from "@/pages/games/art/draw";
import { ConverterScene } from "./art";

export const CONVERTER_ART: GameArt = {
  Scene: ConverterScene,
  tone: "history",
  alt: "A merchant's balance weighing silver against a weight, with a measuring rod leaning beside it",
};
