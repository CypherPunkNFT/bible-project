// The Manuscripts page's context: the collection with its look-ups, and the record sheet's opener.
import { createContext, useContext } from "react";
import type { MsIndex } from "./model";

/** The collection with its look-ups, and the record sheet's opener (any chosen manuscript slides it in). */
export interface MsContextValue { index: MsIndex; openRecord: (id: string, from?: HTMLElement | SVGElement | null) => void }
export const MsContext = createContext<MsContextValue | null>(null);
export function useMs(): MsContextValue {
  const value = useContext(MsContext);
  if (!value) throw new Error("Manuscripts: a section was drawn outside the page's MsContext provider");
  return value;
}
