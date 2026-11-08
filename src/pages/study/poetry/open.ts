// How a part of the page opens the one sheet: a reference or a record, by its address key ("ref:Psalm 19:1", "kind:restate").
import { createContext, useContext } from "react";

export const OpenContext = createContext<(key: string) => void>(() => undefined);
export const useOpen = () => useContext(OpenContext);
