// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { AtlasPlate, CurrentEnlarged, FoldedMap, GlobeRoutes, HolyLand } from "./DoorwayAtlas";
export const ATLAS_DOORWAYS: DoorwayVariant[] = [
  { name: "Current, enlarged", Art: CurrentEnlarged },
  { name: "Holy Land with compass rose", Art: HolyLand },
  { name: "Folded paper map", Art: FoldedMap },
  { name: "Globe with routes", Art: GlobeRoutes },
  { name: "Old atlas plate", Art: AtlasPlate },
];
