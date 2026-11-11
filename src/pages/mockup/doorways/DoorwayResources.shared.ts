// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { LampToPath, OpenDoor, RoadToChurch, Signpost, TableSet } from "./DoorwayResources";
export const RESOURCES_DOORWAYS: DoorwayVariant[] = [
  { name: "Signpost with three arms", Art: Signpost },
  { name: "Road to the church on the hill", Art: RoadToChurch },
  { name: "A table set for gathering", Art: TableSet },
  { name: "A lamp for the path", Art: LampToPath },
  { name: "The open door", Art: OpenDoor },
];
