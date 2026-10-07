import type { CSSProperties } from "react";
import { categoryStyle, TOPIC_SECTIONS } from "@/lib/topic-style";
import type { TopicCategory, TopicIndex } from "@/lib/topics";

/** A family's colour on an element (the reveal panel reads the Atlas variable name, so both are set). */
export const tint = (categoryId: string) => {
  const { color } = categoryStyle(categoryId);
  return { "--topics-color": color, "--places-color": color } as CSSProperties;
};
// Each family card on the Topics home and its tile on the family pages share one transition name, so the card folds into the tile.
export const morph = (categoryId: string) => ({ ...tint(categoryId), "--topics-morph": `topics-card-${categoryId}` }) as CSSProperties;

/** Families in section order, then any family no section names. */
export function orderedFamilies(index: TopicIndex): TopicCategory[] {
  const placed = TOPIC_SECTIONS.flatMap((section) => section.categories);
  const byId = new Map(index.categories.map((c) => [c.id, c]));
  return [...placed.flatMap((id) => byId.get(id) ?? []), ...index.categories.filter((c) => !placed.includes(c.id))];
}
