// How a part of the page opens the one sheet: a record or a reference, by its address key ("rec:ignatius", "ref:John 1:14").
import { createContext, useContext } from "react";

export const OpenContext = createContext<(key: string) => void>(() => undefined);
export const useOpen = () => useContext(OpenContext);
