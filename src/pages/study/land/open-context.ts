// Opens a record or a verse in the land page's one sheet, by its address key ("region:coast", "verse:Luke 10:30").
import { createContext, useContext } from "react";

export const OpenContext = createContext<(key: string) => void>(() => undefined);
export const useOpen = () => useContext(OpenContext);
