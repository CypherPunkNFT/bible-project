// The good news: lets any verse link on the page open the sheet. Given by GoodNewsPage.
import { createContext } from "react";

export const OpenVerse = createContext<(id: string) => void>(() => undefined);
