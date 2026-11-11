// The Scripture memory helper's picture on the tools hub, as the registry takes it (src/pages/tools/registry.ts): the
// drawing in art.tsx, its colour, and what it shows for screen readers. The tone is one no other study tool uses.
import type { GameArt } from "@/pages/games/art/draw";
import { MemoryScene } from "./art";

export const MEMORY_ART: GameArt = {
  Scene: MemoryScene,
  tone: "gospels",
  alt: "An open Bible whose right-hand page fades line by line, with a heart rising above it",
};
