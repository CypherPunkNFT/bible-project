// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { FoldedCompass, OpenAtlas, PinnedBoard, ScrollMap, SeaChart } from "./DoorwayAtlasMore";
export const ATLAS_MORE_DOORWAYS: DoorwayVariant[] = [
  { name: "Map unrolled on a scroll", Art: ScrollMap },
  { name: "Atlas open at a double-page map", Art: OpenAtlas },
  { name: "Map pinned to a board, route string", Art: PinnedBoard },
  { name: "Sea chart with a ship", Art: SeaChart },
  { name: "Folded map with a pocket compass", Art: FoldedCompass },
];
