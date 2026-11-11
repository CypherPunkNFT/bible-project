// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { ComponentType } from "react";
import { Fireside, LongTable, Picnic, Village, Walking } from "./NearbyArt";
export const PICKED = { id: "village", name: "The village", Art: Village,
  note: "Your pick from the first four: houses gathered around their church in a valley, lights in the windows, smoke rising, the river catching the church's light." };

export const NEARBY_ART: { id: string; name: string; note: string; Art: ComponentType }[] = [
  { id: "picnic", name: "The picnic", Art: Picnic,
    note: "Families on blankets on a hill under a great tree, a basket between them, and a child flying a kite that sways in the wind." },
  { id: "walking", name: "Walking together", Art: Walking,
    note: "People walking a path through the fields hand in hand, a child between them, more of them further along the way." },
  { id: "fireside", name: "Around the fire", Art: Fireside,
    note: "A circle of people seated around a fire by the lake, the flame flickering, sparks rising, its glow on the water behind." },
  { id: "long-table", name: "The long table", Art: LongTable,
    note: "A long table set in a meadow, people seated all along it with bread and cups, lights strung between two trees twinkling above." },
];
