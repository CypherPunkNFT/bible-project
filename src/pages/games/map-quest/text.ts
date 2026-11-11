// The words for levels and eras, under label keys so the translation collector picks them up.
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
