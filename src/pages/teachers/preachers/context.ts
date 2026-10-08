// What every section of the Preachers & authors page reads: the data, and the shared profile drawer.
import { createContext, useContext } from "react";
import type { PeopleData } from "@/data/teachers/pages-types";

export interface ProfileTarget { id: string; origin: Element | null }
export interface PreachersContextValue {
  data: PeopleData;
  /** Open a person's profile; `origin` is the clicked element, so the drawer can return focus there. */
  openProfile: (id: string, origin?: Element | null) => void;
  closeProfile: () => void;
  profile: ProfileTarget | null;
}
export const PreachersContext = createContext<PreachersContextValue | null>(null);
export function usePreachers(): PreachersContextValue {
  const value = useContext(PreachersContext);
  if (!value) throw new Error("usePreachers: a Preachers & authors section was drawn outside PreachersPage");
  return value;
}
