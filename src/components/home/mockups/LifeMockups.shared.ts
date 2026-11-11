// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import "./life-mockups.css";
import { HarbourScene, InnScene, WayfinderScene } from "./LifeMockups";
import type { Mockup } from "./types";
export const MOCKUPS: Mockup[] = [
  { name: "The Harbour Light", note: "An engraved harbour under Psalm 107:30: a lighthouse on hatched rocks sweeps its beam across seven moored boats, one per kind of help (crisis 988, pregnancy, healing after abortion, families, food, grief, recovery), each lantern lighting as the beam finds it, with fifteen city lights on the far shore; on hover the boats rise and the beam brightens.", Scene: HarbourScene },
  { name: "The Open Inn", note: "The inn of the Good Samaritan (Luke 10:34) cut open like an old engraving: seven rooms lit in turn (a phone desk for crisis, a rocking chair, a sunrise window for healing, a nursery, a pantry, two chairs for grief, a circle of chairs for recovery), the front door open onto the road; on hover the roof lifts.", Scene: InnScene },
  { name: "The Wayfinder", note: "A carved signpost under Matthew 11:28: seven arms, each naming a kind of help and a real service, a lantern swinging from its bracket, and a plaque listing the fifteen cities with local maps; light passes from arm to arm, and on hover the arms open outward.", Scene: WayfinderScene },
];
