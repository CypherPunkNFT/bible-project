// How a part of the page opens the one sheet: a station's record or a Bible reference, by its address key
// ("rec:conquest.ai", "ref:1 Kings 6:1").
import { createContext, useContext } from "react";

export const OpenContext = createContext<(key: string) => void>(() => undefined);
export const useOpen = () => useContext(OpenContext);
