// The words for levels and eras, under label keys so the translation collector picks them up.
import type { Rank } from "../kit";
import type { Era, Level } from "./pools";

export const LEVEL_TEXT: Record<Level, { label: string; description: string }> = {
  beginner: { label: "Beginner", description: "About sixty famous places, with sea, lake and river names on the map." },
  standard: { label: "Standard", description: "Adds every place named in five verses or more." },
  expert: { label: "Expert", description: "Every place in the game, from famous cities to small villages." },
};

export const ERA_TEXT: Record<Era, { label: string }> = {
  all: { label: "All eras" },
  abraham: { label: "Abraham's world" },
  exodus: { label: "Exodus and conquest" },
  kingdoms: { label: "Kings and the divided kingdom" },
  jesus: { label: "Life of Jesus" },
  paul: { label: "Paul's journeys" },
};

/** The title a total earns, by its share of the most possible (the kit's rank line). */
export const RANKS: readonly Rank[] = [
  { from: 0, title: "Wanderer" },
  { from: 0.35, title: "Pilgrim" },
  { from: 0.6, title: "Traveller" },
  { from: 0.8, title: "Mapmaker" },
  { from: 0.95, title: "Cartographer" },
];
