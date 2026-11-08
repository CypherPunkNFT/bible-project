// The page's one way to open its sheet, shared with every part that holds a reference or a mark.
import { createContext, useContext } from "react";

export const OpenSheet = createContext<(id: string) => void>(() => undefined);
export const useOpenSheet = (): ((id: string) => void) => useContext(OpenSheet);
