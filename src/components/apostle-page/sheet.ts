import { createContext, useContext, type ReactNode } from "react";
import type { Entry } from "./types";

/** The reading sheet's controls, shared by every section (the sheet itself is drawn by Sheet in ui.tsx). */
export interface SheetApi { open: (node: ReactNode, tone?: string) => void; openEntry: (e: Entry) => void }
export const SheetContext = createContext<SheetApi>({ open: () => undefined, openEntry: () => undefined });
export const useSheet = () => useContext(SheetContext);

