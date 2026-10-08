// What every section of the Scholars page reads: the data, the shared profile, and the catalogue's filters (the
// catalogue, "By the numbers" and "Five ways to study" all read and set the same filters).
import { createContext, useContext } from "react";
import type { Era, Faith, Field, ScholarsData } from "@/data/teachers/pages-types";

export interface ProfileTarget { id: string; origin: Element | null }
export interface CatalogueFilters { field: Field[]; era: Era[]; faith: Faith[]; used: boolean; q: string }
export const NO_FILTERS: CatalogueFilters = { field: [], era: [], faith: [], used: false, q: "" };
export interface ScholarsContextValue {
  data: ScholarsData;
  /** Open a scholar's profile; `origin` is the clicked element, so the profile can grow out of it and shrink back. */
  openProfile: (id: string, origin?: Element | null) => void;
  closeProfile: () => void;
  profile: ProfileTarget | null;
  filters: CatalogueFilters;
  /** Replace the catalogue's filters (fields left out are cleared); scrolls to the catalogue unless scroll is false. */
  filterCatalogue: (filters: Partial<CatalogueFilters>, options?: { scroll?: boolean }) => void;
  /** The ids the catalogue currently shows, in its on-screen order (for the profile's previous/next). */
  shownIds: string[];
  setShownIds: (ids: string[]) => void;
}
export const ScholarsContext = createContext<ScholarsContextValue | null>(null);
export function useScholars(): ScholarsContextValue {
  const value = useContext(ScholarsContext);
  if (!value) throw new Error("useScholars: a Scholars section was drawn outside ScholarsPage");
  return value;
}
