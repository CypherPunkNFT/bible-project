// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { CurrentEnlarged, Keystone, Pillar, Scales, Shield } from "./DoorwayApologetics";
export const APOLOGETICS_DOORWAYS: DoorwayVariant[] = [
  { name: "Current, enlarged", Art: CurrentEnlarged },
  { name: "Shield of faith", Art: Shield },
  { name: "Scales of evidence", Art: Scales },
  { name: "Keystone arch", Art: Keystone },
  { name: "Pillar and foundation", Art: Pillar },
];
