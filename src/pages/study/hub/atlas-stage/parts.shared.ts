// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { useState } from "react";
import { CATEGORIES, type AtlasCategory, type AtlasPlace } from "./atlas-data";
import "./atlas-stage.css";
export const firstPlace = (c: AtlasCategory) => (c.places.find(p => p.key === "Jerusalem") ?? c.places[0]).key;

export function useAtlasChoice() {
  const [categoryId, setCategoryId] = useState("map");
  const category = CATEGORIES.find(c => c.id === categoryId)!;
  const [chosenKey, setChosenKey] = useState(firstPlace(category));
  const chosen: AtlasPlace = category.places.find(p => p.key === chosenKey) ?? category.places[0];
  const pick = (id: string) => { const next = CATEGORIES.find(c => c.id === id)!; setCategoryId(id); setChosenKey(firstPlace(next)); };
  return { category, chosen, pick, choose: setChosenKey };
}
